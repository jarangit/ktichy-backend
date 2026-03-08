import { Injectable } from '@nestjs/common';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Store } from '../stores/entities/store.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly menuRepository: Repository<Product>,
  ) {}
  async create(createMenuDto: CreateMenuDto, userId: string) {
    const { stationId } = createMenuDto;
    const { storeId } = createMenuDto;

    if (!storeId) {
      throw new Error('storeId is required');
    }

    const store: any = await this.menuRepository.manager.findOne(Store, {
      where: { id: storeId },
    });
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
      throw new Error(`User #${userId} is not the owner of store #${storeId}`);
    }
    if (station.storeId !== storeId) {
      throw new Error(
        `Station #${stationId} does not belong to store #${storeId}`,
      );
    }

    const menu = this.menuRepository.create({
      ...createMenuDto,
      store,
      station,
    });
    return await this.menuRepository.save(menu);
  }

  findAll() {
    return `This action returns all menus`;
  }

  findOne(id: string) {
    return `This action returns a #${id} menu`;
  }

  async update(id: string, updateMenuDto: UpdateMenuDto) {
    await this.menuRepository.update(id, updateMenuDto);
    return this.menuRepository.findOneBy({ id });
  }

  async remove(id: string) {
    await this.menuRepository.delete(id);
    return { message: `Menu #${id} has been removed` };
  }

  async findByStoreId(storeId: string) {
    const menus = await this.menuRepository.find({
      where: { store: { id: storeId } },
    });
    if (menus.length === 0) {
      throw new Error(`No menus found for store #${storeId}`);
    }
    return menus;
  }
}
