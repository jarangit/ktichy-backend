import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateOrderStationItemDto } from './dto/update-order-station-item.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderStationItem } from './entities/order-station-item.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { Order, OrderStatus } from '../orders/entities/order.entity';

@Injectable()
export class OrderStationItemService {
  constructor(
    @InjectRepository(OrderStationItem)
    private readonly orderStationItemRepository: Repository<OrderStationItem>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    private readonly realtimeGateway: RealtimeGateway,
  ) {}
  create() {
    return 'This action adds a new orderStationItem';
  }

  async findAll() {
    // api for find all order station items
    return await this.orderStationItemRepository.find({
      relations: ['station', 'orderItem'],
    });
  }

  findOne(id: string) {
    return `This action returns a #${id} orderStationItem`;
  }
  findByStation(stationId: string) {
    // api for find all order station items by station id
    return this.orderStationItemRepository.find({
      where: { station: { id: stationId } },
      relations: ['orderItem', 'orderItem.product', 'orderItem.order'],
    });
  }

  async update(
    id: string,
    updateOrderStationItemDto: UpdateOrderStationItemDto,
  ) {
    const { status, stationId, orderItemId } = updateOrderStationItemDto;
    if (!id || !status || !stationId || !orderItemId) {
      throw new NotFoundException(
        'id, status, stationId, and orderItemId are required to update order station item',
      );
    }
    const station = await this.orderStationItemRepository.manager.findOne(
      'Station',
      {
        where: { id: stationId },
      },
    );
    if (!station) {
      throw new NotFoundException(`Station #${stationId} not found`);
    }
    const orderItem = await this.orderStationItemRepository.findOne({
      where: { id },
      relations: ['orderItem', 'orderItem.order'],
    });
    if (!orderItem) {
      throw new NotFoundException(`Order station item #${id} not found`);
    }

    orderItem.status = status as OrderStationItem['status'];
    const savedOrderStationItem =
      await this.orderStationItemRepository.save(orderItem);

    this.realtimeGateway.emitOrderStationItemUpdated({
      orderStationItemId: savedOrderStationItem.id,
      stationId,
      status: orderItem.status,
    });

    await this.syncOrderCompletion(orderItem.orderItem.order.id);

    return savedOrderStationItem;
  }

  remove(id: string) {
    return `This action removes a #${id} orderStationItem`;
  }

  private async syncOrderCompletion(orderId: string) {
    const stationItems = await this.orderStationItemRepository.find({
      where: { orderItem: { order: { id: orderId } } },
      relations: ['orderItem', 'orderItem.order', 'orderItem.order.store'],
    });

    if (stationItems.length === 0) {
      return;
    }

    const order = stationItems[0]?.orderItem?.order;
    if (!order) {
      return;
    }

    const isCompleted = stationItems.every((item) => item.status === 'served');
    if (!isCompleted || order.status === OrderStatus.COMPLETED) {
      return;
    }

    order.status = OrderStatus.COMPLETED;
    await this.orderRepository.save(order);

    this.realtimeGateway.emitOrderUpdated({
      orderId: order.id,
      storeId: order.store.id,
    });
  }
}
