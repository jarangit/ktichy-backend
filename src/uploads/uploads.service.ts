import { Storage } from '@google-cloud/storage';
import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { nanoid10 } from '../utils/nanoid';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharp = require('sharp');

const MAX_IMAGE_SIZE = 50 * 1024 * 1024;
const MAX_OUTPUT_EDGE = 2560;
const WEBP_QUALITY = 80;

@Injectable()
export class UploadsService {
  private storage?: Storage;
  private bucket?: string;

  private ensureConfig(): { storage: Storage; bucket: string } {
    const projectId = process.env.GCS_PROJECT_ID;
    const bucket = process.env.GCS_BUCKET;
    if (!projectId || !bucket) {
      throw new ServiceUnavailableException(
        'GCS_PROJECT_ID and GCS_BUCKET must be set to enable uploads',
      );
    }
    if (!this.storage) {
      this.storage = new Storage({ projectId });
    }
    this.bucket = bucket;
    return { storage: this.storage, bucket };
  }

  async uploadProductImage(
    file: Express.Multer.File,
  ): Promise<{ imageUrl: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (file.size > MAX_IMAGE_SIZE) {
      throw new BadRequestException('Image must be smaller than 50MB');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    const { storage, bucket } = this.ensureConfig();
    const key = `products/${nanoid10()}.webp`;

    let optimizedBuffer: Buffer;

    try {
      optimizedBuffer = await sharp(file.buffer, { failOn: 'none' })
        .rotate()
        .resize({
          width: MAX_OUTPUT_EDGE,
          height: MAX_OUTPUT_EDGE,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
    } catch {
      throw new BadRequestException('Image processing failed');
    }

    try {
      await storage
        .bucket(bucket)
        .file(key)
        .save(optimizedBuffer, {
          contentType: 'image/webp',
          metadata: { cacheControl: 'public, max-age=31536000, immutable' },
        });
    } catch (error) {
      throw new ServiceUnavailableException(
        `Failed to upload image: ${(error as Error).message}`,
      );
    }

    return {
      imageUrl: `https://storage.googleapis.com/${bucket}/${key}`,
    };
  }
}
