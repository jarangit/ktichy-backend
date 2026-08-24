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

  private getCredentialsFromEnv(): any | null {
    // Priority: JSON -> BASE64 (both GCS_* and GOOGLE_* variants for Railway DX)
    const jsonRaw =
      process.env.GCS_SERVICE_ACCOUNT_JSON ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (jsonRaw) {
      try {
        const parsed = JSON.parse(jsonRaw);
        if (parsed.private_key) {
          parsed.private_key = String(parsed.private_key).replace(/\\n/g, '\n');
        }
        return parsed;
      } catch {
        throw new ServiceUnavailableException(
          'Invalid GCS_SERVICE_ACCOUNT_JSON: not valid JSON',
        );
      }
    }

    const b64Raw =
      process.env.GCS_SERVICE_ACCOUNT_BASE64 ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
    if (b64Raw) {
      try {
        const decoded = Buffer.from(b64Raw.trim(), 'base64').toString('utf8');
        const parsed = JSON.parse(decoded);
        if (parsed.private_key) {
          parsed.private_key = String(parsed.private_key).replace(/\\n/g, '\n');
        }
        return parsed;
      } catch {
        throw new ServiceUnavailableException(
          'Invalid GCS_SERVICE_ACCOUNT_BASE64: not valid base64 JSON',
        );
      }
    }

    return null;
  }

  private ensureConfig(): { storage: Storage; bucket: string } {
    const projectId = process.env.GCS_PROJECT_ID;
    const bucket = process.env.GCS_BUCKET;
    if (!projectId || !bucket) {
      throw new ServiceUnavailableException(
        'GCS_PROJECT_ID and GCS_BUCKET must be set to enable uploads',
      );
    }
    if (!this.storage) {
      const credentials = this.getCredentialsFromEnv();
      if (credentials) {
        // Use inline credentials (Railway) - project_id inside JSON takes precedence if env is generic
        this.storage = new Storage({
          projectId: credentials.project_id || projectId,
          credentials,
        });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // File-based auth (local dev) - Storage will read the file automatically,
        // but we pass keyFilename explicitly for clearer error handling
        this.storage = new Storage({
          projectId,
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        });
      } else {
        // ADC / Workload Identity fallback (e.g. Cloud Run)
        this.storage = new Storage({ projectId });
      }
    }
    this.bucket = bucket;
    return { storage: this.storage, bucket };
  }

  private getObjectKeyFromUrl(imageUrl: string) {
    const { bucket } = this.ensureConfig();
    const prefix = `https://storage.googleapis.com/${bucket}/`;

    if (!imageUrl.startsWith(prefix)) {
      return null;
    }

    return imageUrl.slice(prefix.length);
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

  async deleteProductImageByUrl(imageUrl: string | null | undefined) {
    if (!imageUrl) {
      return;
    }

    const key = this.getObjectKeyFromUrl(imageUrl);
    if (!key) {
      return;
    }

    const { storage, bucket } = this.ensureConfig();

    try {
      await storage.bucket(bucket).file(key).delete({ ignoreNotFound: true });
    } catch (error) {
      throw new ServiceUnavailableException(
        `Failed to delete image: ${(error as Error).message}`,
      );
    }
  }
}
