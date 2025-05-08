import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/entiry/order.entity';
import { Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dot';
import { OrderGateway } from './order.gateway';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private readonly orderGateway: OrderGateway, // inject
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const order = this.orderRepository.create(createOrderDto);
    const savedOrder = await this.orderRepository.save(order);
    // 🔔 Broadcast to client
    this.orderGateway.notifyNewOrder(savedOrder);
    return savedOrder;
  }

  findAll() {
    return this.orderRepository.find();
  }
  async update(id: number, data: Partial<Order>) {
    const order = await this.orderRepository.findOneBy({ id });
    if (!order) throw new NotFoundException(`Order ID ${id} not found`);

    Object.assign(order, data);
    const updated = await this.orderRepository.save(order);
    this.orderGateway.notifyOrderUpdated(updated); // 🔔 แจ้งผ่าน WebSocket
    return updated;
  }
  async remove(id: number) {
    const order = await this.orderRepository.findOneBy({ id });
    if (!order) throw new NotFoundException(`Order ID ${id} not found`);

    await this.orderRepository.remove(order);

    // 🔔 แจ้งผ่าน WebSocket
    this.orderGateway.notifyOrderDeleted(id);

    return { success: true, id };
  }
}
