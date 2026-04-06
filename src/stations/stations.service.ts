/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { Station } from './entities/station.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { OrderStationItem } from '../order-station-item/entities/order-station-item.entity';

@Injectable()
export class StationsService {
  constructor(
    @InjectRepository(Station)
    private stationRepository: Repository<Station>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(OrderStationItem)
    private orderStationItemRepository: Repository<OrderStationItem>,
  ) {}
  create(createStationDto: CreateStationDto) {
    const storeId = createStationDto.storeId;
    if (!storeId) {
      throw new BadRequestException('storeId is required');
    }

    const station = this.stationRepository.create({
      ...createStationDto,
    });
    return this.stationRepository.save(station);
  }

  findAll() {
    return `This action returns all stations`;
  }

  async findOne({
    id,
    userId,
    deviceId,
  }: {
    id: string;
    userId?: string;
    deviceId?: string;
  }) {
    if (userId) {
      const station = await this.stationRepository.findOne({
        where: { id, store: { owner_id: userId } },
      });
      if (!station) {
        throw new Error(`Station with ID ${id} not found for user ${userId}`);
      }
      return station;
    }
    if (deviceId) {
      const station = await this.stationRepository.findOne({
        where: { id, devices: { id: deviceId } },
      });
      if (!station) {
        throw new Error(
          `Station with ID ${id} not found for device ${deviceId}`,
        );
      }
      return station;
    }
  }

  async update(id: string, updateStationDto: UpdateStationDto) {
    const storeId = updateStationDto.storeId;
    const payload =
      typeof storeId === 'string' ? { ...updateStationDto } : updateStationDto;

    await this.stationRepository.update(id, payload);
    return this.stationRepository.findOneBy({ id });
  }
  async remove(id: string, force: boolean = false) {
    const station = await this.stationRepository.findOne({
      where: { id },
      relations: [
        'products',
        'orderStationItems',
        'orderStationItems.orderItem',
        'orderStationItems.orderItem.order',
      ],
    });

    if (!station) {
      throw new NotFoundException(`Station #${id} not found`);
    }

    // ตรวจสอบว่ามี active orders หรือไม่

    if (!force && station.orderStationItems?.length > 0) {
      throw new BadRequestException(
        `Cannot delete station. There are ${station.orderStationItems.length} pending orders. Use force=true to delete anyway.`,
      );
    }

    if (!force && station.products?.length > 0) {
      throw new BadRequestException(
        `Cannot delete station. There are ${station.products.length} products associated with this station. Use force=true to delete anyway.`,
      );
    }

    // ลบ Station
    await this.stationRepository.remove(station);

    return {
      message: `Station #${id} has been removed successfully`,
      deletedProducts: station.products?.length || 0,
      deletedOrderStationItems: station.orderStationItems?.length || 0,
    };
  }
  async findByRestaurantId(restaurantId: string) {
    return this.findByStoreId(restaurantId);
  }

  async findByStoreId(storeId: string) {
    return this.stationRepository.find({
      where: { store: { id: storeId } },
    });
  }
}
