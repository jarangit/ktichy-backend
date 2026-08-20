import {
  BadRequestException,
  ForbiddenException,
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
import { UploadsService } from '../uploads/uploads.service';

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
    private readonly uploadsService: UploadsService,
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

  private async findOwnedProductWithRelations(id: string, userId: string) {
    const product = await this.findByIdWithRelations(id);
    const ownerId = (product.store as { owner_id?: string } | null)?.owner_id;

    if (!ownerId || ownerId !== userId) {
      throw new ForbiddenException(
        `User #${userId} does not have access to product #${id}`,
      );
    }

    return product;
  }

  private async findOwnedStore(id: string, userId: string) {
    const store: any = await this.findByIdOrFail(Store, id, 'Store');

    if (store.owner_id !== userId) {
      throw new ForbiddenException(
        `User #${userId} is not the owner of store #${id}`,
      );
    }

    return store;
  }

  private async findCategoryInStore(categoryId: string, storeId: string) {
    const category: any = await this.productRepository.manager.findOne(
      Category,
      {
        where: { id: categoryId },
        relations: { store: true },
      },
    );

    if (!category) {
      throw new NotFoundException(`Category #${categoryId} not found`);
    }

    if (category.store?.id !== storeId) {
      throw new BadRequestException(
        `Category #${categoryId} does not belong to store #${storeId}`,
      );
    }

    return category;
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

  async findOne(id: string) {
    const product = await this.findByIdWithRelations(id);
    return this.toView(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto, userId: string) {
    const product = await this.findOwnedProductWithRelations(id, userId);
    const previousImageUrl = product.imageUrl;
    const relations = await this.resolveRelations(
      updateProductDto,
      userId,
      product.store?.id,
    );
    const updated = this.productRepository.merge(product, {
      ...updateProductDto,
      ...relations,
    });
    await this.productRepository.save(updated);
    const result = await this.findByIdWithRelations(id);

    if (
      previousImageUrl &&
      previousImageUrl !== result.imageUrl &&
      !this.isProductUsingImage(previousImageUrl, result)
    ) {
      await this.uploadsService.deleteProductImageByUrl(previousImageUrl);
    }

    return this.toView(result);
  }

  async remove(id: string, userId: string) {
    const product = await this.findOwnedProductWithRelations(id, userId);
    await this.productRepository.delete(id);

    if (product.imageUrl) {
      await this.uploadsService.deleteProductImageByUrl(product.imageUrl);
    }

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

  private isProductUsingImage(
    imageUrl: string,
    product: { imageUrl?: string | null },
  ) {
    return product.imageUrl === imageUrl;
  }

  private async resolveRelations(
    updateProductDto: UpdateProductDto,
    userId: string,
    currentStoreId?: string | null,
  ) {
    const relations: Record<string, unknown> = {};

    let targetStoreId = currentStoreId ?? null;

    if (updateProductDto.storeId) {
      const store = await this.findOwnedStore(updateProductDto.storeId, userId);
      relations.store = store;
      targetStoreId = store.id;
    }

    if (updateProductDto.stationId) {
      const station: any = await this.findByIdOrFail(
        Station,
        updateProductDto.stationId,
        'Station',
      );

      if (targetStoreId && station.storeId !== targetStoreId) {
        throw new BadRequestException(
          `Station #${updateProductDto.stationId} does not belong to store #${targetStoreId}`,
        );
      }

      relations.station = station;
    }

    if (updateProductDto.categoryId) {
      if (!targetStoreId) {
        throw new BadRequestException(
          'storeId is required when assigning a category',
        );
      }

      relations.category = await this.findCategoryInStore(
        updateProductDto.categoryId,
        targetStoreId,
      );
    }

    return relations;
  }
}
