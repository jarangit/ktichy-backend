import { Injectable } from '@nestjs/common';
import { CreateOrderStationItemDto } from './dto/create-order-station-item.dto';
import { UpdateOrderStationItemDto } from './dto/update-order-station-item.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderStationItem } from './entities/order-station-item.entity';

@Injectable()
export class OrderStationItemService {
  constructor(
    @InjectRepository(OrderStationItem)
    private readonly orderStationItemRepository: Repository<OrderStationItem>,
  ) {}
  create(createOrderStationItemDto: CreateOrderStationItemDto) {
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

  update(id: string, updateOrderStationItemDto: UpdateOrderStationItemDto) {
    return `This action updates a #${id} orderStationItem`;
  }

  remove(id: string) {
    return `This action removes a #${id} orderStationItem`;
  }
}
