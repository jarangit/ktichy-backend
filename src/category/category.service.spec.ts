import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoryService } from './category.service';
import { Category } from './entities/category.entity';
import { Store } from '../stores/entities/store.entity';

describe('CategoryService', () => {
  let service: CategoryService;

  const categoryRepositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const storeRepositoryMock = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getRepositoryToken(Category),
          useValue: categoryRepositoryMock,
        },
        {
          provide: getRepositoryToken(Store),
          useValue: storeRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a category', async () => {
      storeRepositoryMock.findOne.mockResolvedValue({
        id: 's1',
        owner_id: 'u1',
      });
      categoryRepositoryMock.create.mockImplementation((c) => c);
      categoryRepositoryMock.save.mockImplementation(async (c) => ({
        id: 'c1',
        ...c,
      }));

      const result = await service.create(
        { name: 'Coffee', storeId: 's1' },
        'u1',
      );

      expect(result.id).toBe('c1');
      expect(result.name).toBe('Coffee');
    });

    it('should throw BadRequestException when name is missing', async () => {
      await expect(
        service.create({ name: '', storeId: 's1' }, 'u1'),
      ).rejects.toThrow('name and storeId are required');
    });
  });

  describe('findByStoreId', () => {
    it('should return only active categories ordered by sortOrder', async () => {
      categoryRepositoryMock.find.mockResolvedValue([
        { id: 'c1', name: 'Coffee', isActive: true, sortOrder: 0 },
      ]);

      const result = await service.findByStoreId('s1');

      expect(categoryRepositoryMock.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { store: { id: 's1' }, isActive: true },
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('should throw BadRequestException when storeId is missing', async () => {
      await expect(service.findByStoreId('  ')).rejects.toThrow(
        'storeId is required',
      );
    });
  });

  describe('update', () => {
    it('should update name and trim it', async () => {
      categoryRepositoryMock.findOne.mockResolvedValue({
        id: 'c1',
        name: 'Coffee',
        store: { id: 's1', owner_id: 'u1' },
      });
      storeRepositoryMock.findOne.mockResolvedValue({
        id: 's1',
        owner_id: 'u1',
      });
      categoryRepositoryMock.save.mockImplementation(async (c) => c);

      const result = await service.update('c1', { name: '  Espresso  ' }, 'u1');

      expect(result.name).toBe('Espresso');
    });

    it('should throw NotFoundException when category does not exist', async () => {
      categoryRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.update('missing', { name: 'x' }, 'u1'),
      ).rejects.toThrow('Category #missing not found');
    });
  });

  describe('remove', () => {
    it('should soft-delete by setting isActive to false', async () => {
      categoryRepositoryMock.findOne.mockResolvedValue({
        id: 'c1',
        name: 'Coffee',
        isActive: true,
        store: { id: 's1', owner_id: 'u1' },
      });
      storeRepositoryMock.findOne.mockResolvedValue({
        id: 's1',
        owner_id: 'u1',
      });
      categoryRepositoryMock.save.mockImplementation(async (c) => c);

      const result = await service.remove('c1', 'u1');

      expect(categoryRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'c1', isActive: false }),
      );
      expect(result.message).toContain('deactivated');
    });

    it('should throw ForbiddenException when user does not own the store', async () => {
      categoryRepositoryMock.findOne.mockResolvedValue({
        id: 'c1',
        store: { id: 's1' },
      });
      storeRepositoryMock.findOne.mockResolvedValue({
        id: 's1',
        owner_id: 'someone-else',
      });

      await expect(service.remove('c1', 'u1')).rejects.toThrow(
        'You do not own this store',
      );
    });
  });
});
