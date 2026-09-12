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

  const productWithModifiers = {
    id: 'prod-1',
    name: 'Americano',
    price: '60.00',
    cost: null,
    isBestSeller: false,
    isActive: true,
    imageUrl: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    store: { id: 'store-1' },
    station: { id: 'station-1', name: 'Drinks' },
    category: { id: 'cat-1', name: 'Coffee' },
    productModifierGroups: [
      {
        sortOrder: 2,
        modifierGroup: {
          id: 'mg_extra',
          name: 'Extra',
          selectionType: 'MULTIPLE',
          minSelect: 0,
          maxSelect: 3,
          isActive: true,
          options: [
            {
              id: 'mo_oat',
              name: 'Oat Milk',
              priceAdjustment: '25.00',
              sortOrder: 2,
              isAvailable: false,
            },
            {
              id: 'mo_shot',
              name: 'Extra Shot',
              priceAdjustment: '20.00',
              sortOrder: 1,
              isAvailable: true,
            },
          ],
        },
      },
      {
        sortOrder: 1,
        modifierGroup: {
          id: 'mg_size',
          name: 'Size',
          selectionType: 'SINGLE',
          minSelect: 1,
          maxSelect: 1,
          isActive: true,
          options: [
            {
              id: 'mo_large',
              name: 'Large',
              priceAdjustment: '20.00',
              sortOrder: 2,
              isAvailable: true,
            },
            {
              id: 'mo_small',
              name: 'Small',
              priceAdjustment: '0.00',
              sortOrder: 1,
              isAvailable: true,
            },
          ],
        },
      },
      {
        sortOrder: 3,
        modifierGroup: {
          id: 'mg_inactive',
          name: 'Inactive',
          selectionType: 'SINGLE',
          minSelect: 0,
          maxSelect: 1,
          isActive: false,
          options: [
            {
              id: 'mo_hidden',
              name: 'Hidden',
              priceAdjustment: '99.00',
              sortOrder: 1,
              isAvailable: true,
            },
          ],
        },
      },
    ],
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
          relations: {
            store: true,
            station: true,
            category: true,
            productModifierGroups: { modifierGroup: { options: true } },
          },
        }),
      );
      expect(result[0]).toEqual(
        expect.objectContaining({
          price: 60,
          cost: 30,
          categoryName: 'ข้าว',
          stationName: 'ครัว',
          modifierGroups: [],
        }),
      );
    });

    it('returns active modifier groups and available options for the store list', async () => {
      mockRepo.find.mockResolvedValue([productWithModifiers]);

      const result = await service.findByStoreId('store-1');

      expect(result[0].modifierGroups).toEqual([
        {
          id: 'mg_size',
          name: 'Size',
          selectionType: 'SINGLE',
          minSelect: 1,
          maxSelect: 1,
          sortOrder: 1,
          options: [
            {
              id: 'mo_small',
              name: 'Small',
              priceAdjustment: 0,
              sortOrder: 1,
              isAvailable: true,
            },
            {
              id: 'mo_large',
              name: 'Large',
              priceAdjustment: 20,
              sortOrder: 2,
              isAvailable: true,
            },
          ],
        },
        {
          id: 'mg_extra',
          name: 'Extra',
          selectionType: 'MULTIPLE',
          minSelect: 0,
          maxSelect: 3,
          sortOrder: 2,
          options: [
            {
              id: 'mo_shot',
              name: 'Extra Shot',
              priceAdjustment: 20,
              sortOrder: 1,
              isAvailable: true,
            },
          ],
        },
      ]);
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
          modifierGroups: [],
        }),
      );
    });
  });

  describe('findByCategoryId', () => {
    it('returns products with modifier groups for the category list', async () => {
      mockRepo.find.mockResolvedValue([productWithModifiers]);

      const result = await service.findByCategoryId('cat-1');

      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category: { id: 'cat-1' } },
          relations: {
            store: true,
            station: true,
            category: true,
            productModifierGroups: { modifierGroup: { options: true } },
          },
        }),
      );
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'prod-1',
          modifierGroups: expect.arrayContaining([
            expect.objectContaining({ id: 'mg_size' }),
          ]),
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
