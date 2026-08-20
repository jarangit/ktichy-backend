import { Test, TestingModule } from '@nestjs/testing';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { JwtService } from '@nestjs/jwt';

describe('DevicesController', () => {
  let controller: DevicesController;
  let service: DevicesService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByStoreId: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DevicesController],
      providers: [
        {
          provide: DevicesService,
          useValue: mockService,
        },
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn(), sign: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<DevicesController>(DevicesController);
    service = module.get<DevicesService>(DevicesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create should delegate to service', () => {
    const dto = { deviceId: 'dv_1' } as any;
    controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('findAll should delegate to service', () => {
    controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
  });

  it('findByStoreId should delegate to service', () => {
    controller.findByStoreId('store-1');
    expect(service.findByStoreId).toHaveBeenCalledWith('store-1');
  });

  it('findOne should delegate to service', () => {
    controller.findOne('d1');
    expect(service.findOne).toHaveBeenCalledWith('d1');
  });

  it('update should delegate to service with user id', () => {
    const req = { user: { sub: 'user-1' } };
    controller.update('d1', { alias: 'A' } as any, req);
    expect(service.update).toHaveBeenCalledWith('d1', { alias: 'A' }, 'user-1');
  });

  it('remove should delegate to service with user id', () => {
    const req = { user: { sub: 'user-1' } };
    controller.remove('d1', req);
    expect(service.remove).toHaveBeenCalledWith('d1', 'user-1');
  });
});
