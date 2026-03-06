import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Store } from '../entities/store.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
  ) {}

  async create(createStoreDto: CreateStoreDto) {
    const { userId, name } = createStoreDto;

    const existing = await this.storeRepository.findOne({
      where: { owner_id: userId },
    });

    const store = this.storeRepository.create({
      name,
      owner_id: userId,
    });

    return this.storeRepository.save(store);
  }

  findAll() {
    return `This action returns all stores`;
  }

  async findOne(id: number, userId: number) {
    try {
      const store = await this.storeRepository.findOne({
        where: { id, owner_id: userId },
      });

      if (!store) {
        throw new BadRequestException({
          message: 'Store not found or you are not the owner',
          errorCode: 'STORE_NOT_FOUND',
        });
      }

      return store;
    } catch (error) {
      throw new BadRequestException({
        message: 'Something went wrong while fetching store',
        errorCode: 'FIND_STORE_FAILED',
        detail: error.message,
      });
    }
  }

  async update(id: number, updateStoreDto: UpdateStoreDto) {
    const store = await this.storeRepository.findOne({
      where: { id },
    });

    if (!store) {
      throw new BadRequestException('Store not found');
    }

    Object.assign(store, updateStoreDto);
    return await this.storeRepository.save(store);
  }

  async remove(id: number, userId: number) {
    const store = await this.storeRepository.findOne({
      where: { id, owner_id: userId },
    });

    if (!store) {
      throw new BadRequestException('Store not found or you are not the owner');
    }

    return this.storeRepository.delete(id).then((result) => {
      if (result.affected === 0) {
        throw new BadRequestException('Store not found');
      }
      return { message: 'Store deleted successfully' };
    });
  }

  async findByUserId(userId: number) {
    return this.storeRepository.find({ where: { owner: { id: userId } } });
  }
}
