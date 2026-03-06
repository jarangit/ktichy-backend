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
  async create(createMenuDto: CreateMenuDto, userId: number) {
    const { stationId } = createMenuDto;
    const storeId = createMenuDto.storeId ?? createMenuDto.restaurantId;

    if (!storeId) {
      throw new Error('storeId or restaurantId is required');
    }

    const store: any = await this.menuRepository.manager.findOne(
      'Restaurant',
      {
        where: { id: storeId },
      },
    );
    const station: any = await this.menuRepository.manager.findOne('Station', {
      where: { id: createMenuDto.stationId },
    });
    if (!station) {
      throw new Error(`Station #${createMenuDto.stationId} not found`);
    }
    if (!store) {
      throw new Error(`Store #${storeId} not found`);
    }
    if (store.owner_id !== userId) {
      throw new Error(
        `User #${userId} is not the owner of store #${storeId}`,
      );
    }
    if (station.restaurantId !== storeId) {
      throw new Error(
        `Station #${stationId} does not belong to store #${storeId}`,
      );
    }

    const menu = this.menuRepository.create({
      ...createMenuDto,
      restaurant: store,
      station,
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
    return this.findByStoreId(restaurantId);
  }

  async findByStoreId(storeId: number) {
    const menus = await this.menuRepository.find({
      where: { restaurant: { id: storeId } },
    });
    if (menus.length === 0) {
      throw new Error(`No menus found for store #${storeId}`);
    }
    return menus;
  }
}
