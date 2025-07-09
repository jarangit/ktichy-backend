import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrderStationItemService } from './order-station-item.service';
import { CreateOrderStationItemDto } from './dto/create-order-station-item.dto';
import { UpdateOrderStationItemDto } from './dto/update-order-station-item.dto';

@Controller('order-station-item')
export class OrderStationItemController {
  constructor(private readonly orderStationItemService: OrderStationItemService) {}

  @Post()
  create(@Body() createOrderStationItemDto: CreateOrderStationItemDto) {
    return this.orderStationItemService.create(createOrderStationItemDto);
  }

  @Get()
  findAll() {
    return this.orderStationItemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderStationItemService.findOne(+id);
  }

  @Get('station/:stationId')
  findByStation(@Param('stationId') stationId: string) {
    return this.orderStationItemService.findByStation(+stationId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderStationItemDto: UpdateOrderStationItemDto) {
    return this.orderStationItemService.update(+id, updateOrderStationItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderStationItemService.remove(+id);
  }
}
