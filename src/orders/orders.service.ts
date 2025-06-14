import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const restaurant = await this.orderRepository.manager.findOne(
      'Restaurant',
      { where: { id: createOrderDto.restaurantId } },
    );
    if (!restaurant) {
      throw new NotFoundException(
        `Restaurant #${createOrderDto.restaurantId} not found`,
      );
    }

    const order = this.orderRepository.create({
      ...createOrderDto,
      restaurant,
    });
    return this.orderRepository.save(order);
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find();
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOneBy({ id });
    if (!order) throw new NotFoundException(`Order #${id} not found`);
    return order;
  }

  async update(id: number, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.orderRepository.findOneBy({ id });
    if (!order) throw new NotFoundException(`Order #${id} not found`);
    Object.assign(order, updateOrderDto);
    return this.orderRepository.save(order);
  }

  async remove(id: number): Promise<{ message: string }> {
    const order = await this.orderRepository.findOneBy({ id });
    if (!order) throw new NotFoundException(`Order #${id} not found`);
    await this.orderRepository.delete(id);
    return { message: `Order #${id} has been removed` };
  }

  async findByRestaurantId(restaurantId: number): Promise<Order[]> {
    const orders = await this.orderRepository.find({
      where: { restaurant: { id: restaurantId } },
    });
    if (!orders.length) {
      throw new NotFoundException(
        `No orders found for restaurant #${restaurantId}`,
      );
    }
    return orders;
  }
}
