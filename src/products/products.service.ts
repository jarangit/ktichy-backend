import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { nanoid10 } from '../utils/nanoid';
import { Store } from '../stores/entities/store.entity';
import { Station } from '../stations/entities/station.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly menuRepository: Repository<Product>,
  ) {}
  async create(createMenuDto: CreateMenuDto, userId: string) {
    const { stationId } = createMenuDto;
    const storeId = createMenuDto.storeId;

    if (!storeId) {
      throw new BadRequestException('storeId is required');
    }

    const store: any = await this.menuRepository.manager.findOne(Store, {
      where: { id: storeId },
    });
    const station: any = await this.menuRepository.manager.findOne(Station, {
      where: { id: createMenuDto.stationId },
    });
    if (!station) {
      throw new NotFoundException(
        `Station #${createMenuDto.stationId} not found`,
      );
    }
    if (!store) {
      throw new NotFoundException(`Store #${storeId} not found`);
    }
    if (store.owner_id !== userId) {
      throw new BadRequestException(
        `User #${userId} is not the owner of store #${storeId}`,
      );
    }
    if (station.storeId !== storeId) {
      throw new BadRequestException(
        `Station #${stationId} does not belong to store #${storeId}`,
      );
    }

    const menu = this.menuRepository.create({
      id: nanoid10(),
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

  async findByRestaurantId(restaurantId: string) {
    return this.findByStoreId(restaurantId);
  }

  async findByStoreId(storeId: string) {
    const menus = await this.menuRepository.find({
      where: { store: { id: storeId } },
    });
    if (menus.length === 0) {
      throw new NotFoundException(`No menus found for store #${storeId}`);
    }
    return menus;
  }
}
