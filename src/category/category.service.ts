import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Store } from '../stores/entities/store.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, userId?: string) {
    const { name, storeId, isActive, sortOrder } = createCategoryDto;
    const trimmedName = name?.trim();

    if (!trimmedName || !storeId) {
      throw new BadRequestException('name and storeId are required');
    }

    await this.assertStoreOwnership(storeId, userId);

    const category = this.categoryRepository.create({
      name: trimmedName,
      isActive: isActive ?? true,
      sortOrder: sortOrder ?? 0,
      store: { id: storeId },
    });
    return this.categoryRepository.save(category);
  }

  async findAll(storeId?: string) {
    const where = storeId ? { store: { id: storeId } } : {};
    return this.categoryRepository.find({
      where,
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }

    return category;
  }

  async findByStoreId(storeId: string) {
    const normalizedStoreId = storeId?.trim();
    if (!normalizedStoreId) {
      throw new BadRequestException('storeId is required');
    }

    return this.categoryRepository.find({
      where: { store: { id: normalizedStoreId }, isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    userId?: string,
  ) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: { store: true },
    });

    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }

    await this.assertStoreOwnership(category.store?.id, userId);

    if (updateCategoryDto.name !== undefined) {
      const name = updateCategoryDto.name?.trim();
      if (!name) {
        throw new BadRequestException('name cannot be empty');
      }
      category.name = name;
    }

    if (updateCategoryDto.isActive !== undefined) {
      category.isActive = updateCategoryDto.isActive;
    }

    if (updateCategoryDto.sortOrder !== undefined) {
      category.sortOrder = updateCategoryDto.sortOrder;
    }

    return this.categoryRepository.save(category);
  }

  async remove(id: string, userId?: string) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: { store: true },
    });

    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }

    await this.assertStoreOwnership(category.store?.id, userId);

    category.isActive = false;
    await this.categoryRepository.save(category);

    return { message: `Category #${id} has been deactivated successfully` };
  }

  private async assertStoreOwnership(
    storeId: string | undefined,
    userId?: string,
  ) {
    if (!storeId || !userId) return;

    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });
    if (store && store.owner_id !== userId) {
      throw new ForbiddenException('You do not own this store');
    }
  }
}
