import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import { Product } from 'products/entities/product.entity';
import { OrderItem } from '@entities/order-item.entity';
import { OrderStationItem } from '@entities/order-station-item.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,

    @InjectRepository(OrderStationItem)
    private readonly orderStationItemRepository: Repository<OrderStationItem>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const order = this.orderRepository.create();
    order.items = [];
    const { products } = createOrderDto;
    const restaurant = await this.orderRepository.manager.findOne(
      'Restaurant',
      { where: { id: createOrderDto.restaurantId } },
    );
    if (!restaurant) {
      throw new NotFoundException(
        `Restaurant #${createOrderDto.restaurantId} not found`,
      );
    }

    for (const item of products) {
      if (!item.productId || !item.quantity) {
        throw new BadRequestException('Product ID and quantity are required');
      }
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
        relations: ['station'],
      });

      const orderItem = this.orderItemRepository.create({
        product,
        quantity: item.quantity,
      });

      const stationItems = this.orderStationItemRepository.create({
        station: product.station,
        status: 'pending',
      });

      orderItem.stationItems = [stationItems];
      order.items.push(orderItem);
    }

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
