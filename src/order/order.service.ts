import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderGateway } from './order.gateway';
import { Order } from 'entities/order.entity';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private readonly orderGateway: OrderGateway,
  ) {}
}
