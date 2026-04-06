import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { StationsService } from './stations.service';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { JwtAuthGuard } from '../auth/jwt-auth-guard';
import { AppJwtPayload } from '../auth/type';

@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Post()
  create(@Body() createStationDto: CreateStationDto) {
    return this.stationsService.create(createStationDto);
  }

  @Get()
  findAll() {
    return this.stationsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('device')
  findByDeviceId(@Req() req: any) {
    const token = req.device;
    const { tokenType } = token as AppJwtPayload;
    if (tokenType !== 'device') {
      throw new Error('Invalid token type');
    }
    if (!token.station) {
      throw new Error('Station ID is required in token');
    }
    return this.stationsService.findOne({
      id: token.station,
      deviceId: token.sub,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') stationId: string, @Req() req: any) {
    const userId = req.user?.sub;
    return this.stationsService.findOne({
      id: stationId,
      userId,
    });
  }

  @Get('restaurant/:restaurantId')
  findByRestaurantId(@Param('restaurantId') restaurantId: string) {
    return this.stationsService.findByRestaurantId(restaurantId);
  }

  @Get('store/:storeId')
  findByStoreId(@Param('storeId') storeId: string) {
    return this.stationsService.findByStoreId(storeId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStationDto: UpdateStationDto) {
    return this.stationsService.update(id, updateStationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stationsService.remove(id);
  }
}
