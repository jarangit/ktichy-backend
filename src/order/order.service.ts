import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderGateway } from './order.gateway';
import { Order } from 'entities/order-entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private readonly orderGateway: OrderGateway,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const order = this.orderRepository.create(createOrderDto);
    const savedOrder = await this.orderRepository.save(order);

    // 🔔 Broadcast to client
    this.orderGateway.notifyNewOrder(savedOrder);

    return savedOrder;
  }

  findAll(filters: {
    status?: 'PENDING' | 'COMPLETE';
    type?: 'TOGO' | 'DINEIN';
    createdAtSort?: 'ASC' | 'DESC';
    includeArchived?: boolean;
  }) {
    const {
      status,
      type,
      createdAtSort = 'ASC',
      includeArchived = false,
    } = filters;
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (!includeArchived) where.isArchived = false;
    return this.orderRepository.find({
      where,
      order: {
        createdAt: createdAtSort,
      },
    });
  }

  async update(id: number, data: Partial<Order>) {
    const order = await this.orderRepository.findOneBy({ id });

    if (!order) {
      throw new NotFoundException(`Order ID ${id} not found`);
    }

    Object.assign(order, data);
    const updated = await this.orderRepository.save(order);

    // 🔔 แจ้งผ่าน WebSocket
    this.orderGateway.notifyOrderUpdated(updated);

    return updated;
  }

  async updateStatus(id: number, status: Order['status']) {
    const order = await this.orderRepository.findOneBy({ id });

    if (!order) {
      throw new NotFoundException(`Order ID ${id} not found`);
    }

    order.status = status;
    const updated = await this.orderRepository.save(order);

    // 🔔 แจ้งผ่าน WebSocket
    this.orderGateway.notifyOrderUpdated(updated);

    return updated;
  }

  async remove(id: number) {
    const order = await this.orderRepository.findOneBy({ id });

    if (!order) {
      throw new NotFoundException(`Order ID ${id} not found`);
    }

    await this.orderRepository.remove(order);

    // 🔔 แจ้งผ่าน WebSocket
    this.orderGateway.notifyOrderDeleted(id);

    return { success: true, id };
  }
  async clearByType(type: Order['type']) {
    const orders = await this.orderRepository.findBy({ type });

    if (orders.length === 0) {
      throw new NotFoundException(`No orders found for type ${type}`);
    }

    await this.orderRepository.remove(orders);

    // 🔔 แจ้งผ่าน WebSocket
    // this.orderGateway.notifyOrdersCleared(type);

    return { success: true, type };
  }

  async clearAll() {
    const orders = await this.orderRepository.find({
      where: { isArchived: false },
    });

    if (orders.length === 0) {
      throw new NotFoundException(`No orders found`);
    }

    for (const order of orders) {
      order.isArchived = true;
      order.archivedAt = new Date();
    }
    await this.orderRepository.save(orders);

    return { success: true, type: 'ALL' };
  }
}
