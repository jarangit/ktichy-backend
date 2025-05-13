import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dot';
import { OrderService } from './order.service';
import { Order } from 'src/entiry/order.entity';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Get()
  findAll(@Body('createdAtSort') createdAtSort?: 'ASC' | 'DESC') {
    return this.orderService.findAll(createdAtSort);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<Order>) {
    return this.orderService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.remove(id);
  }
}
