import { Test, TestingModule } from '@nestjs/testing';
import { DevicesService } from './devices.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { BadRequestException } from '@nestjs/common';

// Mock repository
const mockDeviceRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
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
});
