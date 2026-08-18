import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { JwtAuthGuard } from '../auth/jwt-auth-guard';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.devicesService.create(createDeviceDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('store/:storeId')
  findByStoreId(@Param('storeId') storeId: string) {
    return this.devicesService.findByStoreId(storeId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.devicesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.devicesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
    @Req() req: any,
  ) {
    return this.devicesService.update(id, updateDeviceDto, req.user?.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.devicesService.remove(id, req.user?.sub);
  }
}
