import { Injectable } from '@nestjs/common';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { stat } from 'fs';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly menuRepository: Repository<Product>,
  ) {}
  async create(createMenuDto: CreateMenuDto, userId: number) {
    const { restaurantId, stationId, name } = createMenuDto;

    const restaurant: any = await this.menuRepository.manager.findOne(
      'Restaurant',
      {
        where: { id: createMenuDto.restaurantId },
      },
    );
    const station: any = await this.menuRepository.manager.findOne('Station', {
      where: { id: createMenuDto.stationId },
    });
    if (!station) {
      throw new Error(`Station #${createMenuDto.stationId} not found`);
    }
    if (!restaurant) {
      throw new Error(`Restaurant #${createMenuDto.restaurantId} not found`);
    }
    // Check if the user is the owner of the restaurant
    if (restaurant.owner_id !== userId) {
      throw new Error(
        `User #${userId} is not the owner of restaurant #${restaurantId}`,
      );
    }
    if (station.restaurantId !== restaurantId) {
      throw new Error(
        `Station #${stationId} does not belong to restaurant #${restaurantId}`,
      );
    }

    // Create a new menu with the restaurant relation
    const menu = this.menuRepository.create({
      ...createMenuDto,
      restaurant,
      station
    });
    return await this.menuRepository.save(menu);
  }

  findAll() {
    return `This action returns all menus`;
  }

  findOne(id: number) {
    return `This action returns a #${id} menu`;
  }

  async update(id: number, updateMenuDto: UpdateMenuDto) {
    await this.menuRepository.update(id, updateMenuDto);
    return this.menuRepository.findOneBy({ id });
  }

  async remove(id: number) {
    await this.menuRepository.delete(id);
    return { message: `Menu #${id} has been removed` };
  }

  async findByRestaurantId(restaurantId: number) {
    const menus = await this.menuRepository.find({
      where: { restaurant: { id: restaurantId } },
    });
    if (menus.length === 0) {
      throw new Error(`No menus found for restaurant #${restaurantId}`);
    }
    return menus;
  }
}
