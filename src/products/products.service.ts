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
  private readonly productRelations = {
    store: true,
    station: true,
    category: true,
  } as const;

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /** Flatten a loaded Product into the shape the POS/settings UI expects. */
  private toView(product: Product) {
    return {
      id: product.id,
      name: product.name,
      isActive: product.isActive,
      isBestSeller: product.isBestSeller,
      price: Number(product.price),
      cost: product.cost != null ? Number(product.cost) : null,
      imageUrl: product.imageUrl,
      storeId: product.store?.id ?? null,
      stationId: product.station?.id ?? null,
      categoryId: product.category?.id ?? null,
      categoryName: product.category?.name ?? null,
      stationName: product.station?.name ?? null,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private async findByIdWithRelations(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: this.productRelations,
    });
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }
    return product;
  }

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

    let category: any;
    if (createProductDto.categoryId) {
      category = await this.productRepository.manager.findOne(Category, {
        where: { id: createProductDto.categoryId },
        relations: { store: true },
      });
      if (!category) {
        throw new NotFoundException(
          `Category #${createProductDto.categoryId} not found`,
        );
      }
      if (category.store?.id !== storeId) {
        throw new BadRequestException(
          `Category #${createProductDto.categoryId} does not belong to store #${storeId}`,
        );
      }
    }

    const product = this.productRepository.create({
      id: nanoid10(),
      ...createProductDto,
      store,
      station,
      category,
    });
    const saved = await this.productRepository.save(product);
    const created = await this.findByIdWithRelations(saved.id);
    return this.toView(created);
  }

  findAll() {
    return `This action returns all products`;
  }

  async findByCategoryId(categoryId: string) {
    const products = await this.productRepository.find({
      where: { category: { id: categoryId } },
      relations: this.productRelations,
    });
    return products.map((product) => this.toView(product));
  }

  findOne(id: string) {
    return `This action returns a #${id} product`;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const relations = await this.resolveRelations(updateProductDto);
    const product = await this.findByIdOrFail(Product, id, 'Product');
    const updated = this.productRepository.merge(product, {
      ...updateProductDto,
      ...relations,
    });
    await this.productRepository.save(updated);
    const result = await this.findByIdWithRelations(id);
    return this.toView(result);
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
      relations: this.productRelations,
    });
    if (products.length === 0) {
      throw new NotFoundException(
        `No products found for store #${normalizedStoreId}`,
      );
    }
    return products.map((product) => this.toView(product));
  }
  private readonly productRelationResolvers = {
    storeId: {
      entity: Store,
      relation: 'store',
      label: 'Store',
    },
    stationId: {
      entity: Station,
      relation: 'station',
      label: 'Station',
    },
    categoryId: {
      entity: Category,
      relation: 'category',
      label: 'Category',
    },
  } as const;

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
  private async resolveRelations(updateProductDto: UpdateProductDto) {
    const relations: Record<string, unknown> = {};

    for (const [dtoField, config] of Object.entries(
      this.productRelationResolvers,
    )) {
      const id = updateProductDto[dtoField];

      if (!id) {
        continue;
      }

      relations[config.relation] = await this.findByIdOrFail(
        config.entity,
        id,
        config.label,
      );
    }

    return relations;
  }
}
