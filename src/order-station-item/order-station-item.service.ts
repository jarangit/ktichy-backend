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

  findOne(id: number) {
    return `This action returns a #${id} orderStationItem`;
  }
  findByStation(stationId: number) {
    // api for find all order station items by station id
    return this.orderStationItemRepository.find({
      where: { station: { id: stationId } },
      relations: ['orderItem', 'orderItem.product', 'orderItem.order'],
    });
  }

  update(id: number, updateOrderStationItemDto: UpdateOrderStationItemDto) {
    return `This action updates a #${id} orderStationItem`;
  }

  remove(id: number) {
    return `This action removes a #${id} orderStationItem`;
  }
}
