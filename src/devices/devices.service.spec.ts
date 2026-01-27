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
  // let service: DevicesService;

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

    // service = module.get<DevicesService>(DevicesService);
  });

  it('should be defined', () => {
    // expect(service).toBeDefined();
  });

  it('should be create', async () => {
    const repo = {
      create: jest.fn(),
      save: jest.fn(),
    };
    const service = new DevicesService(repo as any);

    const deviceData = {
      deviceName: '123',
      fingerprint: 'fingerprint',
    };

    repo.create.mockReturnValue(deviceData);
    repo.save.mockResolvedValue({
      ...deviceData,
      id: '1',
    });

    const result = await service.create({
      deviceName: '123',
      fingerprint: 'fingerprint',
    });

    expect(result.id).toBe('1');
    expect(result.deviceName).toBe('123');
    expect(result.fingerprint).toBe('fingerprint');
  });

  it('should error when device name is empty', async () => {
    const repo = { save: jest.fn() };
    const service = new DevicesService(repo as any);
    await expect(
      service.create({ deviceName: '', fingerprint: '123' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should error when fingerprint  is empty', async () => {
    const repo = { save: jest.fn() };
    const service = new DevicesService(repo as any);
    await expect(
      service.create({ deviceName: 'data', fingerprint: '' }),
    ).rejects.toThrow(BadRequestException);
  });
});
