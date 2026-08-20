import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ProductService } from './products.service';
import { Product } from './entities/product.entity';
import { UploadsService } from '../uploads/uploads.service';

describe('ProductsService', () => {
  let service: ProductService;
  const uploadsService = {
    deleteProductImageByUrl: jest.fn(),
  };

  const manager = {
    findOne: jest.fn(),
  };

  const mockRepo = {
    manager,
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    merge: jest.fn((entity: unknown, patch: object) => ({
      ...(entity as object),
      ...patch,
    })),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepo,
        },
        {
          provide: UploadsService,
          useValue: uploadsService,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      name: 'ข้าวผัดกุ้ง',
      storeId: 'store-1',
      stationId: 'station-1',
      categoryId: 'cat-1',
      price: 60,
      cost: 30,
      isBestSeller: true,
      imageUrl: 'data:image/png;base64,abc',
    };

    const savedRow = {
      id: 'prod-1',
      name: dto.name,
      price: '60.00',
      cost: '30.00',
      isBestSeller: true,
      imageUrl: dto.imageUrl,
      isActive: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    };

    it('saves the product and returns a flattened view', async () => {
      manager.findOne
        .mockResolvedValueOnce({ id: 'store-1', owner_id: 'user-1' })
        .mockResolvedValueOnce({ id: 'station-1', storeId: 'store-1' })
        .mockResolvedValueOnce({
          id: 'cat-1',
          name: 'ข้าว',
          store: { id: 'store-1' },
        });
      mockRepo.create.mockReturnValue(savedRow);
      mockRepo.save.mockResolvedValue(savedRow);
      mockRepo.findOne.mockResolvedValue({
        ...savedRow,
        store: { id: 'store-1', name: 'Test Store' },
        station: { id: 'station-1', name: 'ครัว' },
        category: { id: 'cat-1', name: 'ข้าว' },
      });

      const result = await service.create(dto, 'user-1');

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          price: 60,
          cost: 30,
          isBestSeller: true,
          imageUrl: dto.imageUrl,
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: 'prod-1',
          price: 60,
          cost: 30,
          isBestSeller: true,
          imageUrl: dto.imageUrl,
          storeId: 'store-1',
          stationId: 'station-1',
          categoryId: 'cat-1',
          categoryName: 'ข้าว',
          stationName: 'ครัว',
        }),
      );
    });

    it('rejects when the user is not the store owner', async () => {
      manager.findOne
        .mockResolvedValueOnce({ id: 'store-1', owner_id: 'someone-else' })
        .mockResolvedValueOnce({ id: 'station-1', storeId: 'store-1' });

      await expect(service.create(dto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects when the category does not belong to the store', async () => {
      manager.findOne
        .mockResolvedValueOnce({ id: 'store-1', owner_id: 'user-1' })
        .mockResolvedValueOnce({ id: 'station-1', storeId: 'store-1' })
        .mockResolvedValueOnce({
          id: 'cat-1',
          name: 'ข้าว',
          store: { id: 'other-store' },
        });

      await expect(service.create(dto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findByStoreId', () => {
    it('returns flattened products for the store', async () => {
      mockRepo.find.mockResolvedValue([
        {
          id: 'prod-1',
          name: 'ข้าวผัดกุ้ง',
          price: '60.00',
          cost: '30.00',
          isBestSeller: true,
          isActive: true,
          imageUrl: null,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
          store: { id: 'store-1' },
          station: { id: 'station-1', name: 'ครัว' },
          category: { id: 'cat-1', name: 'ข้าว' },
        },
      ]);

      const result = await service.findByStoreId('store-1');

      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: { store: true, station: true, category: true },
        }),
      );
      expect(result[0]).toEqual(
        expect.objectContaining({
          price: 60,
          cost: 30,
          categoryName: 'ข้าว',
          stationName: 'ครัว',
        }),
      );
    });

    it('throws NotFoundException when the store has no products', async () => {
      mockRepo.find.mockResolvedValue([]);

      await expect(service.findByStoreId('store-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('returns a flattened product view', async () => {
      mockRepo.findOne.mockResolvedValue({
        id: 'prod-1',
        name: 'ข้าวผัดกุ้ง',
        price: '60.00',
        cost: '30.00',
        isBestSeller: true,
        isActive: true,
        imageUrl: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        store: { id: 'store-1' },
        station: { id: 'station-1', name: 'ครัว' },
        category: { id: 'cat-1', name: 'ข้าว' },
      });

      const result = await service.findOne('prod-1');

      expect(result).toEqual(
        expect.objectContaining({
          id: 'prod-1',
          price: 60,
          categoryName: 'ข้าว',
          stationName: 'ครัว',
        }),
      );
    });
  });

  describe('update', () => {
    it('allows the owner to clear imageUrl with null', async () => {
      mockRepo.findOne
        .mockResolvedValueOnce({
          id: 'prod-1',
          name: 'ข้าวผัดกุ้ง',
          price: '60.00',
          cost: '30.00',
          isBestSeller: true,
          isActive: true,
          imageUrl: 'https://img',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
          store: { id: 'store-1', owner_id: 'user-1' },
          station: { id: 'station-1', name: 'ครัว' },
          category: { id: 'cat-1', name: 'ข้าว' },
        })
        .mockResolvedValueOnce({
          id: 'prod-1',
          name: 'ข้าวผัดกุ้ง',
          price: '60.00',
          cost: '30.00',
          isBestSeller: true,
          isActive: true,
          imageUrl: null,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
          store: { id: 'store-1', owner_id: 'user-1' },
          station: { id: 'station-1', name: 'ครัว' },
          category: { id: 'cat-1', name: 'ข้าว' },
        });
      mockRepo.save.mockResolvedValue(undefined);

      const result = await service.update(
        'prod-1',
        { imageUrl: null },
        'user-1',
      );

      expect(mockRepo.merge).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'prod-1' }),
        expect.objectContaining({ imageUrl: null }),
      );
      expect(uploadsService.deleteProductImageByUrl).toHaveBeenCalledWith(
        'https://img',
      );
      expect(result).toEqual(expect.objectContaining({ imageUrl: null }));
    });

    it('deletes the old image when a new one replaces it', async () => {
      mockRepo.findOne
        .mockResolvedValueOnce({
          id: 'prod-1',
          name: 'ข้าวผัดกุ้ง',
          price: '60.00',
          cost: '30.00',
          isBestSeller: true,
          isActive: true,
          imageUrl: 'https://old-image',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
          store: { id: 'store-1', owner_id: 'user-1' },
          station: { id: 'station-1', name: 'ครัว' },
          category: { id: 'cat-1', name: 'ข้าว' },
        })
        .mockResolvedValueOnce({
          id: 'prod-1',
          name: 'ข้าวผัดกุ้ง',
          price: '60.00',
          cost: '30.00',
          isBestSeller: true,
          isActive: true,
          imageUrl: 'https://new-image',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
          store: { id: 'store-1', owner_id: 'user-1' },
          station: { id: 'station-1', name: 'ครัว' },
          category: { id: 'cat-1', name: 'ข้าว' },
        });
      mockRepo.save.mockResolvedValue(undefined);

      await service.update(
        'prod-1',
        { imageUrl: 'https://new-image' },
        'user-1',
      );

      expect(uploadsService.deleteProductImageByUrl).toHaveBeenCalledWith(
        'https://old-image',
      );
    });

    it('rejects updates from a non-owner', async () => {
      mockRepo.findOne.mockResolvedValue({
        id: 'prod-1',
        store: { id: 'store-1', owner_id: 'someone-else' },
      });

      await expect(
        service.update('prod-1', { price: 70 }, 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('deletes the product image after deleting the product', async () => {
      mockRepo.findOne.mockResolvedValue({
        id: 'prod-1',
        imageUrl: 'https://img',
        store: { id: 'store-1', owner_id: 'user-1' },
      });
      mockRepo.delete.mockResolvedValue(undefined);

      await service.remove('prod-1', 'user-1');

      expect(mockRepo.delete).toHaveBeenCalledWith('prod-1');
      expect(uploadsService.deleteProductImageByUrl).toHaveBeenCalledWith(
        'https://img',
      );
    });

    it('rejects deletes from a non-owner', async () => {
      mockRepo.findOne.mockResolvedValue({
        id: 'prod-1',
        store: { id: 'store-1', owner_id: 'someone-else' },
      });

      await expect(service.remove('prod-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
