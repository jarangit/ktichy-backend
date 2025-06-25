import { Injectable } from '@nestjs/common';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly menuRepository: Repository<Product>,
  ) {}
  async create(createMenuDto: CreateMenuDto) {
    const restaurant = await this.menuRepository.manager.findOne('Restaurant', {
      where: { id: createMenuDto.restaurantId },
    });
    if (!restaurant) {
      throw new Error(`Restaurant #${createMenuDto.restaurantId} not found`);
    }

    // Create a new menu with the restaurant relation
    const menu = this.menuRepository.create({
      ...createMenuDto,
      restaurant,
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
