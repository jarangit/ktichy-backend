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
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CreateStorePinDto } from './dto/create-store-pin.dto';
import { JwtAuthGuard } from '../auth/jwt-auth-guard';

@Controller(['stores', 'restaurants'])
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createStoreDto: CreateStoreDto, @Req() req: any) {
    return this.storesService.create(createStoreDto, req.user?.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/pin')
  setPin(
    @Param('id') id: string,
    @Body() dto: CreateStorePinDto,
    @Req() req: any,
  ) {
    return this.storesService.setPin(id, dto, req.user?.sub);
  }

  @Get()
  findAll() {
    return this.storesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.sub ?? req.device?.store;
    const isDevice = Boolean(req.device);
    return this.storesService.findOne(id, userId, isDevice);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.storesService.findByUserId(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateStoreDto,
    @Req() req: any,
  ) {
    return this.storesService.update(id, updateStoreDto, req.user?.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.sub;
    return this.storesService.remove(id, userId);
  }
}
