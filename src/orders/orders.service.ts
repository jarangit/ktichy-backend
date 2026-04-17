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
import { OrderItem } from './entities/order-item.entity';
import { OrderStationItem } from '../order-station-item/entities/order-station-item.entity';
import { Store } from '../stores/entities/store.entity';

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
    const { products, storeId, orderNumber } = createOrderDto;
    const normalizedStoreId = storeId?.trim();

    if (!products || !products.length) {
      throw new BadRequestException(
        'At least one product is required to create an order',
      );
    }
    if (!normalizedStoreId) {
      throw new BadRequestException('storeId is required to create an order');
    }
    const store = await this.orderRepository.manager.findOne(Store, {
      where: { id: normalizedStoreId },
    });

    if (!store) {
      throw new NotFoundException(`Store #${normalizedStoreId} not found`);
    }

    // Initialize order
    const order = this.orderRepository.create({
      orderNumber,
      store,
      items: [],
    });

    // Process each product in the order
    for (const item of products) {
      // Validate product item
      if (!item.productId || !item.quantity) {
        throw new BadRequestException('Product ID and quantity are required');
      }

      // Find product with station relation
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
        relations: ['station'],
      });

      if (!product) {
        throw new NotFoundException(`Product #${item.productId} not found`);
      }

      // Create order item
      const orderItem = this.orderItemRepository.create({
        product,
        quantity: item.quantity,
      });

      // Create station item for this order item
      const stationItems = this.orderStationItemRepository.create({
        station: product.station,
        status: 'pending',
      });

      orderItem.stationItems = [stationItems];
      order.items.push(orderItem);
    }

    return await this.orderRepository.save(order);
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['store', 'items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.orderRepository.findOneBy({ id });

    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    Object.assign(order, updateOrderDto);
    return this.orderRepository.save(order);
  }

  async remove({
    orderId,
    userId,
  }: {
    orderId: string;
    userId: string;
  }): Promise<{ message: string }> {
    // Find order with all required relations
    const order = await this.orderRepository.findOne({
      where: {
        id: orderId,
        store: {
          owner: { id: userId },
        },
      },
      relations: ['store', 'store.owner', 'items', 'items.stationItems'],
    });

    if (!order) {
      throw new NotFoundException(`Order #${orderId} not found`);
    }

    await this.orderRepository.remove(order);

    return { message: `Order #${orderId} has been removed` };
  }

  async findByRestaurantId(restaurantId: string): Promise<Order[]> {
    return this.findByStoreId(restaurantId);
  }

  async findByStoreId(storeId: string): Promise<Order[]> {
    const normalizedStoreId = storeId?.trim();
    if (!normalizedStoreId) {
      throw new BadRequestException('storeId is required');
    }

    const orders = await this.orderRepository.find({
      where: { store: { id: normalizedStoreId } },
    });

    if (!orders.length) {
      throw new NotFoundException(
        `No orders found for store #${normalizedStoreId}`,
      );
    }

    return orders;
  }

  async findByStationId(stationId: string): Promise<Order[]> {
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
