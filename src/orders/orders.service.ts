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
import { Product } from '../products/entities/product.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderStationItem } from 'order-station-item/entities/order-station-item.entity';

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
    const data = {
      orderNumber: createOrderDto.orderNumber,
      restaurant,
      items: order.items,
    };

    return await this.orderRepository.save(data);
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

  async remove({
    orderId,
    userId,
  }: {
    orderId: number;
    userId: number;
  }): Promise<{ message: string }> {
    const order = await this.orderRepository.findOne({
      where: {
        id: orderId,
        restaurant: {
          owner: { id: userId },
        },
      },
      relations: [
        'restaurant',
        'restaurant.owner',
        'items',
        'items.stationItems',
      ],
    });

    if (!order) throw new NotFoundException(`Order #${orderId} not found`);

    // ลบ OrderStationItems ก่อน
    for (const item of order.items) {
      if (item.stationItems?.length) {
        await this.orderStationItemRepository.remove(item.stationItems);
      }
    }

    // ลบ OrderItems
    if (order.items?.length) {
      await this.orderItemRepository.remove(order.items);
    }

    // ลบ Order
    await this.orderRepository.remove(order);

    return { message: `Order #${orderId} has been removed` };
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

  async findByStationId(stationId: number): Promise<Order[]> {
    const orders = await this.orderRepository.find({
      where: { items: { stationItems: { station: { id: stationId } } } },
      relations: ['items', 'items.product'],
    });
    if (!orders.length) {
      throw new NotFoundException(`No orders found for station #${stationId}`);
    }
    return orders;
  }
}
