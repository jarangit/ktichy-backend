import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-menu.dto';
import { UpdateProductDto } from './dto/update-menu.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityTarget,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { Product } from './entities/product.entity';
import { nanoid10 } from '../utils/nanoid';
import { Store } from '../stores/entities/store.entity';
import { Station } from '../stations/entities/station.entity';
import { Category } from '../category/entities/category.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}
  async create(createProductDto: CreateProductDto, userId: string) {
    const { stationId } = createProductDto;
    const storeId = createProductDto.storeId?.trim();

    if (!storeId) {
      throw new BadRequestException('storeId is required');
    }

    const store: any = await this.productRepository.manager.findOne(Store, {
      where: { id: storeId },
    });
    const station: any = await this.productRepository.manager.findOne(Station, {
      where: { id: createProductDto.stationId },
    });
    if (!station) {
      throw new NotFoundException(
        `Station #${createProductDto.stationId} not found`,
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

    const product = this.productRepository.create({
      id: nanoid10(),
      ...createProductDto,
      store,
      station,
    });
    return await this.productRepository.save(product);
  }

  findAll() {
    return `This action returns all products`;
  }

  findOne(id: string) {
    return `This action returns a #${id} product`;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { stationId, categoryId, storeId } = updateProductDto;
    const store = storeId
      ? await this.findByIdOrFail(Store, storeId, 'Store')
      : undefined;
    const station = stationId
      ? await this.findByIdOrFail(Station, stationId, 'Station')
      : undefined;
    const category = categoryId
      ? await this.findByIdOrFail(Category, categoryId, 'Category')
      : undefined;
    const product = await this.findByIdOrFail(Product, id, 'Product');
    const updated = this.productRepository.merge(product, {
      ...updateProductDto,
      store,
      station,
      category,
    });
    await this.productRepository.save(updated);
    return this.productRepository.findOneBy({ id });
  }

  async remove(id: string) {
    await this.productRepository.delete(id);
    return { message: `Product #${id} has been removed` };
  }

  async findByRestaurantId(restaurantId: string) {
    return this.findByStoreId(restaurantId);
  }

  async findByStoreId(storeId: string) {
    const normalizedStoreId = storeId?.trim();
    if (!normalizedStoreId) {
      throw new BadRequestException('storeId is required');
    }

    const products = await this.productRepository.find({
      where: { store: { id: normalizedStoreId } },
    });
    if (products.length === 0) {
      throw new NotFoundException(
        `No products found for store #${normalizedStoreId}`,
      );
    }
    return products;
  }

  private async findByIdOrFail<Entity extends ObjectLiteral>(
    target: EntityTarget<Entity>,
    id: string,
    entityName: string,
  ): Promise<Entity> {
    const entity = await this.productRepository.manager.findOne(target, {
      where: { id } as unknown as FindOptionsWhere<Entity>,
    });

    if (!entity) {
      throw new NotFoundException(`${entityName} #${id} not found`);
    }

    return entity;
  }
}
