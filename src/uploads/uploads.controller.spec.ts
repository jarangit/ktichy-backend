import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

describe('UploadsController', () => {
  let controller: UploadsController;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        {
          provide: UploadsService,
          useValue: {
            uploadProductImage: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<UploadsController>(UploadsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates to the upload service', async () => {
    const service = module.get<UploadsService>(UploadsService);
    const uploadMock = service.uploadProductImage as jest.Mock;
    uploadMock.mockResolvedValue({
      imageUrl:
        'https://storage.googleapis.com/kitchy-product-images/products/x.jpg',
    });

    const result = await controller.uploadProductImage(
      {} as Express.Multer.File,
    );

    expect(uploadMock).toHaveBeenCalledWith({});
    expect(result).toEqual({
      imageUrl:
        'https://storage.googleapis.com/kitchy-product-images/products/x.jpg',
    });
  });
});
