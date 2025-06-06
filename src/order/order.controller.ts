import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderService } from './order.service';
import { Order } from 'entities/order.entity';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}


  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Get()
  findAll(
    @Query('status') status?: 'PENDING' | 'COMPLETE',
    @Query('type') type?: 'TOGO' | 'DINEIN',
    @Query('createdAtSort') createdAtSort?: 'ASC' | 'DESC',
    @Query('includeArchived') includeArchived?: boolean,
  ) {
    return this.orderService.findAll({
      status,
      type,
      createdAtSort,
      includeArchived,
    });
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<Order>) {
    return this.orderService.update(id, data);
  }

  @Delete('/clear')
  clearByType() {
    return this.orderService.clearAll();
    // return this.orderService.clearByType(type);
  }
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.remove(id);
  }

  @Get('report-monitor')
  reportMonitor() {
    // TODO: create a report for the monitor for only to day and all time
    // TODO: how to auto create data last 3 days
    return this.orderService.getOrderReport();
  }
}
