import 'dotenv/config';
import { Like } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Product } from '../products/entities/product.entity';
import { UploadsService } from '../uploads/uploads.service';

/**
 * One-off migration for product images that were stored as inline base64
 * data URLs. Re-uploads each image to GCS and swaps imageUrl for a public
 * storage.googleapis.com URL. Run once: npm run migrate:images
 */
async function main() {
  if (!process.env.GCS_PROJECT_ID || !process.env.GCS_BUCKET) {
    throw new Error(
      'GCS_PROJECT_ID and GCS_BUCKET must be set before migrating images',
    );
  }

  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Product);
  const uploads = new UploadsService();

  const legacy = await repo.find({ where: { imageUrl: Like('%data:%') } });
  console.log(`Found ${legacy.length} products with legacy data-URL images`);

  for (const product of legacy) {
    const match = /^data:(image\/[\w+.]+);base64,(.*)$/s.exec(
      product.imageUrl ?? '',
    );
    if (!match) {
      console.warn(`SKIP ${product.id}: not a base64 data URL`);
      continue;
    }
    const [, mimetype, b64] = match;
    const buffer = Buffer.from(b64, 'base64');
    const ext = mimetype.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';

    const { imageUrl } = await uploads.uploadProductImage({
      buffer,
      mimetype,
      originalname: `${product.id}.${ext}`,
      size: buffer.length,
    } as Express.Multer.File);

    product.imageUrl = imageUrl;
    await repo.save(product);
    console.log(`MIGRATED ${product.id} (${product.name}) -> ${imageUrl}`);
  }

  await AppDataSource.destroy();
  console.log('Done.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
