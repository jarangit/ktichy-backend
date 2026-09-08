import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { nanoid10 } from '../utils/nanoid';
import { Product } from '../products/entities/product.entity';
import { Store } from '../stores/entities/store.entity';
import {
  ModifierGroup,
  ModifierSelectionType,
} from './entities/modifier-group.entity';
import { ModifierOption } from './entities/modifier-option.entity';
import { ProductModifierGroup } from './entities/product-modifier-group.entity';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { UpdateModifierGroupDto } from './dto/update-modifier-group.dto';
import { CreateModifierOptionDto } from './dto/create-modifier-option.dto';
import { UpdateModifierOptionDto } from './dto/update-modifier-option.dto';

@Injectable()
export class ModifiersService {
  constructor(
    @InjectRepository(ModifierGroup)
    private readonly groupRepository: Repository<ModifierGroup>,
    @InjectRepository(ModifierOption)
    private readonly optionRepository: Repository<ModifierOption>,
    @InjectRepository(ProductModifierGroup)
    private readonly linkRepository: Repository<ProductModifierGroup>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  private toGroupView(group: ModifierGroup) {
    return {
      id: group.id,
      storeId: group.store?.id ?? null,
      name: group.name,
      selectionType: group.selectionType,
      minSelect: group.minSelect,
      maxSelect: group.maxSelect,
      isActive: group.isActive,
      options: (group.options ?? [])
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((o) => this.toOptionView(o)),
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  private toOptionView(option: ModifierOption) {
    return {
      id: option.id,
      modifierGroupId:
        (option as { modifierGroup?: ModifierGroup }).modifierGroup?.id ?? null,
      name: option.name,
      priceAdjustment: Number(option.priceAdjustment ?? 0),
      sortOrder: option.sortOrder,
      isAvailable: option.isAvailable,
      createdAt: option.createdAt,
      updatedAt: option.updatedAt,
    };
  }

  private validateSelectionBounds(
    selectionType: ModifierSelectionType,
    minSelect: number,
    maxSelect: number,
  ) {
    if (minSelect < 0 || maxSelect < 0) {
      throw new BadRequestException('minSelect and maxSelect must be >= 0');
    }
    if (minSelect > maxSelect) {
      throw new BadRequestException('minSelect must not exceed maxSelect');
    }
    if (selectionType === ModifierSelectionType.SINGLE && maxSelect > 1) {
      throw new BadRequestException('SINGLE groups must have maxSelect <= 1');
    }
  }

  private async findOwnedStore(storeId: string, userId: string) {
    const store = await this.groupRepository.manager.findOne(Store, {
      where: { id: storeId },
    });
    if (!store) throw new NotFoundException(`Store #${storeId} not found`);
    if ((store as { owner_id?: string }).owner_id !== userId) {
      throw new ForbiddenException(
        `User #${userId} is not the owner of store #${storeId}`,
      );
    }
    return store;
  }

  private async findGroupWithRelations(id: string) {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: { store: true, options: true },
    });
    if (!group) throw new NotFoundException(`Modifier group #${id} not found`);
    return group;
  }

  private assertGroupOwner(group: ModifierGroup, userId: string) {
    const ownerId = (group.store as unknown as { owner_id?: string })?.owner_id;
    if (ownerId && ownerId !== userId) {
      throw new ForbiddenException(
        `User #${userId} does not have access to modifier group #${group.id}`,
      );
    }
  }

  async createGroup(dto: CreateModifierGroupDto, userId: string) {
    const storeId = dto.storeId?.trim();
    if (!storeId) throw new BadRequestException('storeId is required');
    const store = await this.findOwnedStore(storeId, userId);

    const selectionType = dto.selectionType ?? ModifierSelectionType.SINGLE;
    const minSelect =
      dto.minSelect ?? (selectionType === ModifierSelectionType.SINGLE ? 1 : 0);
    const maxSelect =
      dto.maxSelect ?? (selectionType === ModifierSelectionType.SINGLE ? 1 : 0);
    this.validateSelectionBounds(selectionType, minSelect, maxSelect);

    const group = this.groupRepository.create({
      id: nanoid10(),
      store,
      name: dto.name.trim(),
      selectionType,
      minSelect,
      maxSelect,
      isActive: true,
    });
    const saved = await this.groupRepository.save(group);
    return this.toGroupView(await this.findGroupWithRelations(saved.id));
  }

  async listGroups(storeId: string, userId: string) {
    const normalized = storeId?.trim();
    if (!normalized) throw new BadRequestException('storeId is required');
    await this.findOwnedStore(normalized, userId);
    const groups = await this.groupRepository.find({
      where: { store: { id: normalized } },
      relations: { store: true, options: true },
      order: { name: 'ASC' },
    });
    return groups.map((g) => this.toGroupView(g));
  }

  async getGroup(id: string, userId: string) {
    const group = await this.findGroupWithRelations(id);
    this.assertGroupOwner(group, userId);
    return this.toGroupView(group);
  }

  async updateGroup(id: string, dto: UpdateModifierGroupDto, userId: string) {
    const group = await this.findGroupWithRelations(id);
    this.assertGroupOwner(group, userId);

    if (dto.storeId && dto.storeId !== group.store?.id) {
      throw new BadRequestException(
        'Moving a group between stores is not allowed',
      );
    }

    const selectionType = dto.selectionType ?? group.selectionType;
    const minSelect = dto.minSelect ?? group.minSelect;
    const maxSelect = dto.maxSelect ?? group.maxSelect;
    this.validateSelectionBounds(selectionType, minSelect, maxSelect);

    if (dto.name !== undefined) group.name = dto.name.trim();
    group.selectionType = selectionType;
    group.minSelect = minSelect;
    group.maxSelect = maxSelect;

    await this.groupRepository.save(group);
    return this.toGroupView(await this.findGroupWithRelations(id));
  }

  async deactivateGroup(id: string, userId: string) {
    const group = await this.findGroupWithRelations(id);
    this.assertGroupOwner(group, userId);
    group.isActive = false;
    await this.groupRepository.save(group);
    return { message: `Modifier group #${id} has been deactivated` };
  }

  async createOption(
    groupId: string,
    dto: CreateModifierOptionDto,
    userId: string,
  ) {
    const group = await this.findGroupWithRelations(groupId);
    this.assertGroupOwner(group, userId);

    const option = this.optionRepository.create({
      id: nanoid10(),
      modifierGroup: group,
      name: dto.name.trim(),
      priceAdjustment: dto.priceAdjustment ?? 0,
      sortOrder: dto.sortOrder ?? 0,
      isAvailable: dto.isAvailable ?? true,
    });
    const saved = await this.optionRepository.save(option);
    const loaded = await this.optionRepository.findOne({
      where: { id: saved.id },
      relations: { modifierGroup: true },
    });
    return this.toOptionView(loaded!);
  }

  async updateOption(id: string, dto: UpdateModifierOptionDto, userId: string) {
    const option = await this.optionRepository.findOne({
      where: { id },
      relations: { modifierGroup: { store: true, options: true } },
    });
    if (!option)
      throw new NotFoundException(`Modifier option #${id} not found`);
    this.assertGroupOwner(option.modifierGroup, userId);

    if (dto.name !== undefined) option.name = dto.name.trim();
    if (dto.priceAdjustment !== undefined)
      option.priceAdjustment = dto.priceAdjustment;
    if (dto.sortOrder !== undefined) option.sortOrder = dto.sortOrder;
    if (dto.isAvailable !== undefined) {
      if (dto.isAvailable === false) {
        const activeCount = (option.modifierGroup.options ?? []).filter(
          (o) => o.isAvailable && o.id !== option.id,
        ).length;
        if (activeCount < option.modifierGroup.minSelect) {
          throw new BadRequestException(
            `Cannot disable option: group requires at least ${option.modifierGroup.minSelect} active option(s)`,
          );
        }
      }
      option.isAvailable = dto.isAvailable;
    }

    await this.optionRepository.save(option);
    const loaded = await this.optionRepository.findOne({
      where: { id },
      relations: { modifierGroup: true },
    });
    return this.toOptionView(loaded!);
  }

  async deactivateOption(id: string, userId: string) {
    return this.updateOption(id, { isAvailable: false }, userId).then(() => ({
      message: `Modifier option #${id} has been deactivated`,
    }));
  }

  async assignGroupToProduct(
    productId: string,
    modifierGroupId: string,
    sortOrder: number | undefined,
    userId: string,
  ) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: { store: true },
    });
    if (!product)
      throw new NotFoundException(`Product #${productId} not found`);
    const ownerId = (product.store as unknown as { owner_id?: string })
      ?.owner_id;
    if (!ownerId || ownerId !== userId) {
      throw new ForbiddenException(
        `User #${userId} does not have access to product #${productId}`,
      );
    }

    const group = await this.findGroupWithRelations(modifierGroupId);
    this.assertGroupOwner(group, userId);
    if (!group.isActive) {
      throw new BadRequestException(
        `Modifier group #${modifierGroupId} is not active`,
      );
    }
    if (group.store?.id !== product.store?.id) {
      throw new BadRequestException(
        `Modifier group #${modifierGroupId} does not belong to the product's store`,
      );
    }

    const existing = await this.linkRepository.findOne({
      where: {
        product: { id: productId },
        modifierGroup: { id: modifierGroupId },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Modifier group #${modifierGroupId} is already assigned to product #${productId}`,
      );
    }

    const link = this.linkRepository.create({
      id: nanoid10(),
      product,
      modifierGroup: group,
      sortOrder: sortOrder ?? 0,
    });
    const saved = await this.linkRepository.save(link);
    return {
      id: saved.id,
      productId,
      modifierGroupId,
      sortOrder: saved.sortOrder,
    };
  }

  async removeGroupFromProduct(
    productId: string,
    modifierGroupId: string,
    userId: string,
  ) {
    const link = await this.linkRepository.findOne({
      where: {
        product: { id: productId },
        modifierGroup: { id: modifierGroupId },
      },
      relations: { product: { store: true } },
    });
    if (!link) {
      throw new NotFoundException(
        `Modifier group #${modifierGroupId} is not assigned to product #${productId}`,
      );
    }
    const ownerId = (link.product.store as unknown as { owner_id?: string })
      ?.owner_id;
    if (!ownerId || ownerId !== userId) {
      throw new ForbiddenException(
        `User #${userId} does not have access to product #${productId}`,
      );
    }
    await this.linkRepository.remove(link);
    return {
      message: `Modifier group #${modifierGroupId} removed from product #${productId}`,
    };
  }
}
