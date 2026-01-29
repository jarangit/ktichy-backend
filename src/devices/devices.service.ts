import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDeviceDto, CreateDeviceResponse } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { Repository } from 'typeorm/repository/Repository';
import { Device } from './entities/device.entity';
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
    const { deviceName, fingerprint, storeId, stationId } = createDeviceDto;
    if (!deviceName || !fingerprint || !storeId || !stationId) {
      throw new BadRequestException(
        'Device name or fingerprint cannot be empty',
      );
    }
    const device = this.deviceRepository.create({ ...createDeviceDto });
    return await this.deviceRepository.save(device);
  }

  findAll() {
    return `This action returns all devices`;
  }

  findOne(id: number) {
    return `This action returns a #${id} device`;
  }

  update(id: number, updateDeviceDto: UpdateDeviceDto) {
    console.log(updateDeviceDto);
    return `This action updates a #${id} device`;
  }

  remove(id: number) {
    return `This action removes a #${id} device`;
  }
}
