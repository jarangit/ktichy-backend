import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

describe('CategoryController', () => {
  let controller: CategoryController;

  const categoryServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByStoreId: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule],
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: categoryServiceMock,
        },
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate create to the service with the user id', () => {
    const req = { user: { sub: 'u1' } };
    const dto = { name: 'Coffee', storeId: 's1' };
    controller.create(dto, req);
    expect(categoryServiceMock.create).toHaveBeenCalledWith(dto, 'u1');
  });

  it('should delegate findAll with an optional storeId', () => {
    controller.findAll('s1');
    expect(categoryServiceMock.findAll).toHaveBeenCalledWith('s1');
  });

  it('should delegate findByStoreId to the service', () => {
    controller.findByStoreId('s1');
    expect(categoryServiceMock.findByStoreId).toHaveBeenCalledWith('s1');
  });

  it('should delegate update to the service with the user id', () => {
    const req = { user: { sub: 'u1' } };
    const dto = { name: 'Espresso' };
    controller.update('c1', dto, req);
    expect(categoryServiceMock.update).toHaveBeenCalledWith('c1', dto, 'u1');
  });

  it('should delegate remove to the service with the user id', () => {
    const req = { user: { sub: 'u1' } };
    controller.remove('c1', req);
    expect(categoryServiceMock.remove).toHaveBeenCalledWith('c1', 'u1');
  });
});
