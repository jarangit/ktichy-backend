import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CreateStorePinDto } from './dto/create-store-pin.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Store } from './entities/store.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
  ) {}

  async create(createStoreDto: CreateStoreDto, ownerId?: string) {
    // Prefer ownerId from JWT (req.user.sub); fallback to body for backward compat
    const effectiveOwnerId = ownerId ?? createStoreDto.userId;
    if (!effectiveOwnerId) {
      throw new BadRequestException('Owner is required');
    }
    const { name } = createStoreDto;

    const store = this.storeRepository.create({
      name,
      owner_id: effectiveOwnerId,
    });

    return this.storeRepository.save(store);
  }

  /**
   * Set PIN for a store (first-time setup). write-before-settings.
   * Only owner can set; fails if PIN already exists (v1: no overwrite via this endpoint).
   */
  async setPin(storeId: string, dto: CreateStorePinDto, userId: string) {
    const store = await this.storeRepository.findOne({
      where: { id: storeId, owner_id: userId },
    });
    if (!store) {
      throw new BadRequestException({
        message: 'Store not found or you are not the owner',
        errorCode: 'STORE_NOT_FOUND',
      });
    }

    const existing = await this.storeRepository
      .createQueryBuilder('store')
      .addSelect('store.pinHash')
      .where('store.id = :id', { id: storeId })
      .getOne();

    if (existing?.pinHash) {
      throw new BadRequestException({
        message: 'Store PIN already set',
        errorCode: 'STORE_PIN_ALREADY_SET',
      });
    }

    const pinHash = await bcrypt.hash(dto.pin, 10);
    await this.storeRepository.update(storeId, { pinHash } as any);
    const updated = await this.storeRepository.findOne({ where: { id: storeId } });
    return updated;
  }

  findAll() {
    return `This action returns all stores`;
  }

  async findOne(id: string, userId: string, isDevice = false) {
    try {
      const store = await this.storeRepository.findOne({
        where: isDevice ? { id } : { id, owner_id: userId },
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

  async update(id: string, updateStoreDto: UpdateStoreDto, userId?: string) {
    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    const store = await this.storeRepository.findOne({
      where: { id, owner_id: userId },
    });

    if (!store) {
      throw new BadRequestException('Store not found or you are not the owner');
    }

    // Enforce PIN for all writes (write-before-settings)
    const { pin, ...payload } = updateStoreDto as UpdateStoreDto & { pin?: string };

    // Fetch pinHash explicitly (select: false on entity)
    const withHash = await this.storeRepository
      .createQueryBuilder('store')
      .addSelect('store.pinHash')
      .where('store.id = :id', { id })
      .getOne();

    if (!withHash?.pinHash) {
      throw new BadRequestException({
        message: 'Store PIN must be set before updating settings',
        errorCode: 'STORE_PIN_REQUIRED',
      });
    }

    if (!pin) {
      throw new BadRequestException({
        message: 'PIN is required for this operation',
        errorCode: 'STORE_PIN_REQUIRED',
      });
    }

    const isValid = await bcrypt.compare(pin, withHash.pinHash);
    if (!isValid) {
      throw new BadRequestException({
        message: 'Invalid PIN',
        errorCode: 'INVALID_STORE_PIN',
      });
    }

    // Strip pin and disallow owner hijack via payload
    const { userId: _ignoredUserId, pin: _ignoredPin, ...safePayload } = payload as any;
    Object.assign(store, safePayload);
    return await this.storeRepository.save(store);
  }

  async remove(id: string, userId: string) {
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

  async findByUserId(userId: string) {
    return this.storeRepository.find({ where: { owner: { id: userId } } });
  }
}
