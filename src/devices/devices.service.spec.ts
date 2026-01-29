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
    mockDeviceRepository.create.mockReturnValue({
      deviceName: '123',
      fingerprint: 'fingerprint',
    });
    mockDeviceRepository.save.mockResolvedValue({
      id: '1',
      deviceName: '123',
      fingerprint: 'fingerprint',
    });
    const result = await service.create({
      deviceName: '123',
      fingerprint: 'fingerprint',
      storeId: 'storeId',
      stationId: 'stationId',
    });
    expect(result.id).toBe('1');
    expect(result.deviceName).toBe('123');
    expect(result.fingerprint).toBe('fingerprint');
  });

  it.each([
    {
      field: 'deviceName',
      data: {
        deviceName: '',
        fingerprint: '123',
        storeId: 'storeId',
        stationId: 'stationId',
      },
    },
    {
      field: 'fingerprint',
      data: {
        deviceName: 'data',
        fingerprint: '',
        storeId: 'storeId',
        stationId: 'stationId',
      },
    },
    {
      field: 'storeId',
      data: {
        deviceName: 'data',
        fingerprint: '123',
        storeId: '',
        stationId: 'stationId',
      },
    },
    {
      field: 'stationId',
      data: {
        deviceName: 'data',
        fingerprint: '123',
        storeId: 'storeId',
        stationId: '',
      },
    },
  ])(
    'should throw BadRequestException when $field is empty',
    async ({ data }) => {
      await expect(service.create(data)).rejects.toThrow(BadRequestException);
    },
  );
});
