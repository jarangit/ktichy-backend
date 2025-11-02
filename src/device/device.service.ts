import { Injectable } from '@nestjs/common';
import { Device } from './entities/device.enity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
  ) {}
  findAll() {
    const data = this.deviceRepository.find();
    return data;
  }

  findOne(id: string) {
    return this.deviceRepository.findOne({ where: { id } });
  }

  create(createDeviceDto: any) {
    console.log(
      '🚀 ~ DeviceService ~ create ~ createDeviceDto:',
      createDeviceDto,
    );
    const device = this.deviceRepository.create(createDeviceDto);
    return this.deviceRepository.save(device);
  }
}
