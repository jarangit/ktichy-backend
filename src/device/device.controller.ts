import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DeviceService } from './device.service';

@Controller('device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Get()
  findAll() {
    return this.deviceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deviceService.findOne(id);
  }

  @Post()
  create(@Body() createDeviceDto: any) {
    console.log("🚀 ~ DeviceController ~ create ~ createDeviceDto:", createDeviceDto)
    return this.deviceService.create(createDeviceDto);
  }
}
