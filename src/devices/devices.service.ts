import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDeviceDto, CreateDeviceResponse } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { Repository } from 'typeorm/repository/Repository';
import { Device, DeviceStatus } from './entities/device.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Station } from '../stations/entities/station.entity';
import { Store } from '../stores/entities/store.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(Station)
    private readonly stationRepository: Repository<Station>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}
  async create(
    createDeviceDto: CreateDeviceDto,
  ): Promise<CreateDeviceResponse> {
    const hasStoreId = Object.prototype.hasOwnProperty.call(
      createDeviceDto,
      'storeId',
    );
    const hasStationId = Object.prototype.hasOwnProperty.call(
      createDeviceDto,
      'stationId',
    );
    const storeId = createDeviceDto.storeId?.trim();
    const stationId = createDeviceDto.stationId?.trim();

    if (!createDeviceDto.deviceId) {
      throw new BadRequestException('deviceId is required');
    }
    if (hasStoreId && !storeId) {
      throw new BadRequestException('storeId cannot be empty');
    }
    if (hasStationId && !stationId) {
      throw new BadRequestException('stationId cannot be empty');
    }
    if (storeId && !stationId) {
      throw new BadRequestException(
        'stationId is required when pairing device to store',
      );
    }

    const existing = await this.deviceRepository.findOne({
      where: { deviceId: createDeviceDto.deviceId },
    });

    if (existing) {
      throw new BadRequestException('deviceId already exists');
    }

    const device = this.deviceRepository.create({
      ...createDeviceDto,
      storeId,
      stationId,
      status: storeId ? DeviceStatus.PAIRED : DeviceStatus.UNPAIRED,
      lastSeenAt: new Date(),
      store: storeId ? ({ id: storeId } as any) : undefined,
      station: stationId ? ({ id: stationId } as any) : undefined,
    });
    return await this.deviceRepository.save(device);
  }

  findAll() {
    return this.deviceRepository.find({
      relations: ['store', 'station'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStoreId(storeId: string) {
    const normalizedStoreId = storeId?.trim();
    if (!normalizedStoreId) {
      throw new BadRequestException('storeId is required');
    }

    return this.deviceRepository.find({
      where: { storeId: normalizedStoreId },
      relations: ['station'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const device = await this.deviceRepository.findOne({
      where: { id },
      relations: ['store', 'station'],
    });
    if (!device) {
      throw new NotFoundException(`Device #${id} not found`);
    }
    return device;
  }

  async update(id: string, dto: UpdateDeviceDto, userId: string) {
    const device = await this.deviceRepository.findOne({
      where: { id },
      relations: ['store'],
    });
    if (!device) {
      throw new NotFoundException(`Device #${id} not found`);
    }
    this.assertOwnership(device, userId);

    const { alias, deviceName, appVersion, status, storeId, stationId } = dto;

    let targetStoreId = device.storeId;
    if (storeId !== undefined) {
      const normalizedStoreId = storeId.trim();
      if (!normalizedStoreId) {
        throw new BadRequestException('storeId cannot be empty');
      }
      const store = await this.storeRepository.findOne({
        where: { id: normalizedStoreId },
      });
      if (!store) {
        throw new NotFoundException(`Store #${normalizedStoreId} not found`);
      }
      targetStoreId = normalizedStoreId;
    }

    let targetStationId = device.stationId;
    if (stationId !== undefined) {
      const normalizedStationId = stationId.trim();
      if (!normalizedStationId) {
        throw new BadRequestException('stationId cannot be empty');
      }
      const station = await this.stationRepository.findOne({
        where: { id: normalizedStationId },
      });
      if (!station) {
        throw new NotFoundException(
          `Station #${normalizedStationId} not found`,
        );
      }
      if (station.storeId !== targetStoreId) {
        throw new BadRequestException(
          'Station does not belong to the device store',
        );
      }
      targetStationId = normalizedStationId;
    }

    if (alias !== undefined) device.alias = alias;
    if (deviceName !== undefined) device.deviceName = deviceName;
    if (appVersion !== undefined) device.appVersion = appVersion;
    if (status !== undefined) device.status = status;
    if (storeId !== undefined) {
      device.storeId = targetStoreId;
      device.store = { id: targetStoreId } as any;
    }
    if (stationId !== undefined) {
      device.stationId = targetStationId;
      device.station = { id: targetStationId } as any;
    }

    return this.deviceRepository.save(device);
  }

  async remove(id: string, userId: string) {
    const device = await this.deviceRepository.findOne({
      where: { id },
      relations: ['store'],
    });
    if (!device) {
      throw new NotFoundException(`Device #${id} not found`);
    }
    this.assertOwnership(device, userId);

    await this.deviceRepository.delete(id);
    return { message: `Device #${id} has been removed` };
  }

  private assertOwnership(device: Device, userId: string) {
    if (!device.store || device.store.owner_id !== userId) {
      throw new ForbiddenException('You are not the owner of this device');
    }
  }
}
