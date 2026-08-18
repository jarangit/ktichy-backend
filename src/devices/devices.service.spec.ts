import { Test, TestingModule } from '@nestjs/testing';
import { DevicesService } from './devices.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { Station } from '../stations/entities/station.entity';
import { Store } from '../stores/entities/store.entity';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

// Mock repository
const mockDeviceRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockStationRepository = {
  findOne: jest.fn(),
};

const mockStoreRepository = {
  findOne: jest.fn(),
};

describe('DevicesService', () => {
  let service: DevicesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevicesService,
        {
          provide: getRepositoryToken(Device),
          useValue: mockDeviceRepository,
        },
        {
          provide: getRepositoryToken(Station),
          useValue: mockStationRepository,
        },
        {
          provide: getRepositoryToken(Store),
          useValue: mockStoreRepository,
        },
      ],
    }).compile();

    service = module.get<DevicesService>(DevicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be create', async () => {
    mockDeviceRepository.findOne.mockResolvedValue(null);
    mockDeviceRepository.create.mockReturnValue({
      deviceId: 'dv_999',
      deviceName: '123',
      fingerprint: 'fingerprint',
    });
    mockDeviceRepository.save.mockResolvedValue({
      id: '1',
      deviceId: 'dv_999',
      deviceName: '123',
      fingerprint: 'fingerprint',
    });
    const result = await service.create({
      deviceId: 'dv_999',
      deviceName: '123',
      fingerprint: 'fingerprint',
      storeId: 'storeId',
      stationId: 'stationId',
    });
    expect(result.id).toBe('1');
    expect(result.deviceId).toBe('dv_999');
    expect(result.deviceName).toBe('123');
    expect(result.fingerprint).toBe('fingerprint');
  });

  it('should throw BadRequestException when deviceId is missing', async () => {
    await expect(
      service.create({
        deviceName: 'data',
        fingerprint: '123',
        storeId: 'storeId',
        stationId: 'stationId',
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when deviceId already exists', async () => {
    mockDeviceRepository.findOne.mockResolvedValue({
      id: '1',
      deviceId: 'dv_999',
    });

    await expect(
      service.create({
        deviceId: 'dv_999',
        deviceName: 'data',
        fingerprint: '123',
        storeId: 'storeId',
        stationId: 'stationId',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when storeId is provided without stationId', async () => {
    await expect(
      service.create({
        deviceId: 'dv_1000',
        deviceName: 'tablet',
        storeId: 'storeId',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('findByStoreId should query devices by store', async () => {
    mockDeviceRepository.find.mockResolvedValue([{ id: 'd1' }]);
    const result = await service.findByStoreId('store-1');
    expect(mockDeviceRepository.find).toHaveBeenCalledWith({
      where: { storeId: 'store-1' },
      relations: ['station'],
      order: { createdAt: 'DESC' },
    });
    expect(result).toEqual([{ id: 'd1' }]);
  });

  it('findByStoreId should reject empty storeId', async () => {
    await expect(service.findByStoreId('  ')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('findOne should return device with relations', async () => {
    mockDeviceRepository.findOne.mockResolvedValue({ id: 'd1', store: {} });
    const result = await service.findOne('d1');
    expect(result).toEqual({ id: 'd1', store: {} });
  });

  it('findOne should throw NotFoundException for missing device', async () => {
    mockDeviceRepository.findOne.mockResolvedValue(null);
    await expect(service.findOne('d1')).rejects.toThrow(NotFoundException);
  });

  it('update should rename alias for owning user', async () => {
    mockDeviceRepository.findOne.mockResolvedValue({
      id: 'd1',
      storeId: 's1',
      stationId: 'st1',
      store: { owner_id: 'user-1' },
    });
    mockDeviceRepository.save.mockImplementation((device) =>
      Promise.resolve(device),
    );

    const result = await service.update('d1', { alias: 'Screen A' }, 'user-1');
    expect(result.alias).toBe('Screen A');
  });

  it('update should reject non-owner user', async () => {
    mockDeviceRepository.findOne.mockResolvedValue({
      id: 'd1',
      storeId: 's1',
      store: { owner_id: 'user-1' },
    });

    await expect(
      service.update('d1', { alias: 'Screen A' }, 'user-2'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('update should validate station belongs to the device store', async () => {
    mockDeviceRepository.findOne.mockResolvedValue({
      id: 'd1',
      storeId: 's1',
      stationId: 'st1',
      store: { owner_id: 'user-1' },
    });
    mockStationRepository.findOne.mockResolvedValue({
      id: 'st2',
      storeId: 's2',
    });

    await expect(
      service.update('d1', { stationId: 'st2' }, 'user-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('remove should delete device for owning user', async () => {
    mockDeviceRepository.findOne.mockResolvedValue({
      id: 'd1',
      store: { owner_id: 'user-1' },
    });
    mockDeviceRepository.delete.mockResolvedValue({ affected: 1 });

    const result = await service.remove('d1', 'user-1');
    expect(mockDeviceRepository.delete).toHaveBeenCalledWith('d1');
    expect(result.message).toContain('d1');
  });

  it('remove should reject non-owner user', async () => {
    mockDeviceRepository.findOne.mockResolvedValue({
      id: 'd1',
      store: { owner_id: 'user-1' },
    });

    await expect(service.remove('d1', 'user-2')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
