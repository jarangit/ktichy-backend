import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/entiry/order.entity';
import { Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dot';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  create(createOrderDto: CreateOrderDto) {
    const order = this.orderRepository.create(createOrderDto);
    return this.orderRepository.save(order);
  }

  findAll() {
    return this.orderRepository.find();
  }
  async update(id: number, data: Partial<Order>) {
    const order = await this.orderRepository.findOneBy({ id });
    if (!order) throw new NotFoundException(`Order ID ${id} not found`);

    Object.assign(order, data);
    return this.orderRepository.save(order);
  }
  async remove(id: number) {
    const order = await this.orderRepository.findOneBy({ id });
    if (!order) throw new NotFoundException(`Order ID ${id} not found`);

    return this.orderRepository.remove(order);
  }
}
