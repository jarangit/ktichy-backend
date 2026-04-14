import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}
  create(createCategoryDto: CreateCategoryDto) {
    const name = createCategoryDto.name?.trim();
    const storeId = createCategoryDto.storeId?.trim();

    if (!name || !storeId) {
      throw new BadRequestException('name and storeId are required');
    }

    const category = this.categoryRepository.create({
      name,
      isActive: createCategoryDto.isActive ?? true,
      sortOrder: createCategoryDto.sortOrder ?? 0,
      store: { id: storeId },
    });
    return this.categoryRepository.save(category);
  }

  findAll() {
    return `This action returns all category`;
  }

  findOne(id: number) {
    return `This action returns a #${id} category`;
  }

  update(id: number, updateCategoryDto: UpdateCategoryDto) {
    void updateCategoryDto;
    return `This action updates a #${id} category`;
  }

  remove(id: number) {
    return `This action removes a #${id} category`;
  }
}
