import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDeviceDto, CreateDeviceResponse } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { Repository } from 'typeorm/repository/Repository';
import { Device, DeviceStatus } from './entities/device.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
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
    return `This action returns all devices`;
  }

  findOne(id: string) {
    return `This action returns a #${id} device`;
  }

  update(id: string, updateDeviceDto: UpdateDeviceDto) {
    console.log(updateDeviceDto);
    return `This action updates a #${id} device`;
  }

  remove(id: string) {
    return `This action removes a #${id} device`;
  }
}
