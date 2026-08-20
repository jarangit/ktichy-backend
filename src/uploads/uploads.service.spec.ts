import { BadRequestException } from '@nestjs/common';
import { UploadsService } from './uploads.service';

// Jest hoists module mocks before top-level initialization, so these need var.
// eslint-disable-next-line no-var
var saveMock: jest.Mock;
// eslint-disable-next-line no-var
var deleteMock: jest.Mock;
// eslint-disable-next-line no-var
var toBufferMock: jest.Mock;

jest.mock('sharp', () => {
  toBufferMock = jest.fn().mockResolvedValue(Buffer.from('webp-data'));
  return jest.fn(() => ({
    rotate: jest.fn().mockReturnThis(),
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: toBufferMock,
  }));
});

jest.mock('@google-cloud/storage', () => {
  saveMock = jest.fn().mockResolvedValue(undefined);
  deleteMock = jest.fn().mockResolvedValue(undefined);
  return {
    Storage: jest.fn().mockImplementation(() => ({
      bucket: jest.fn(() => ({
        file: jest.fn(() => ({ save: saveMock, delete: deleteMock })),
      })),
    })),
  };
});

describe('UploadsService', () => {
  let service: UploadsService;

  beforeEach(() => {
    process.env.GCS_PROJECT_ID = 'kitchy-project';
    process.env.GCS_BUCKET = 'kitchy-product-images';
    jest.clearAllMocks();
    saveMock.mockResolvedValue(undefined);
    deleteMock.mockResolvedValue(undefined);
    toBufferMock.mockResolvedValue(Buffer.from('webp-data'));
    service = new UploadsService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('uploads an image and returns a public URL', async () => {
    const file = {
      buffer: Buffer.from('png-data'),
      mimetype: 'image/png',
      originalname: 'photo.png',
      size: 100,
    } as Express.Multer.File;

    const result = await service.uploadProductImage(file);

    expect(result.imageUrl).toMatch(
      /^https:\/\/storage\.googleapis\.com\/kitchy-product-images\/products\/[a-zA-Z0-9]{10}\.webp$/,
    );
    expect(saveMock).toHaveBeenCalledWith(
      Buffer.from('webp-data'),
      expect.objectContaining({ contentType: 'image/webp' }),
    );
  });

  it('rejects when no file is provided', async () => {
    await expect(service.uploadProductImage(null as never)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects files larger than 50MB', async () => {
    const file = {
      buffer: Buffer.alloc(1),
      mimetype: 'image/png',
      originalname: 'photo.png',
      size: 50 * 1024 * 1024 + 1,
    } as Express.Multer.File;

    await expect(service.uploadProductImage(file)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects non-image files', async () => {
    const file = {
      buffer: Buffer.alloc(1),
      mimetype: 'application/pdf',
      originalname: 'doc.pdf',
      size: 10,
    } as Express.Multer.File;

    await expect(service.uploadProductImage(file)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects images that cannot be processed', async () => {
    toBufferMock.mockRejectedValueOnce(new Error('bad image'));

    await expect(
      service.uploadProductImage({
        buffer: Buffer.from('bad-image'),
        mimetype: 'image/png',
        originalname: 'photo.png',
        size: 10,
      } as Express.Multer.File),
    ).rejects.toThrow('Image processing failed');
  });

  it('throws when GCS env vars are missing', async () => {
    delete process.env.GCS_PROJECT_ID;
    delete process.env.GCS_BUCKET;

    await expect(
      service.uploadProductImage({
        buffer: Buffer.alloc(1),
        mimetype: 'image/png',
        originalname: 'photo.png',
        size: 10,
      } as Express.Multer.File),
    ).rejects.toThrow('GCS_PROJECT_ID and GCS_BUCKET must be set');
  });

  it('deletes a bucket-owned image by URL', async () => {
    await service.deleteProductImageByUrl(
      'https://storage.googleapis.com/kitchy-product-images/products/x.webp',
    );

    expect(deleteMock).toHaveBeenCalledWith({ ignoreNotFound: true });
  });

  it('ignores external image URLs during delete', async () => {
    await service.deleteProductImageByUrl('https://example.com/image.webp');

    expect(deleteMock).not.toHaveBeenCalled();
  });
});
