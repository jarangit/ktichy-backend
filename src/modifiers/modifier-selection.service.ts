import { BadRequestException, Injectable } from '@nestjs/common';
import { Product } from '../products/entities/product.entity';

export interface ModifierSelectionInput {
  modifierGroupId: string;
  modifierOptionIds: string[];
}

export interface ModifierSelectionSnapshot {
  modifierGroupId: string;
  modifierGroupName: string;
  modifierOptionId: string;
  modifierOptionName: string;
  priceAdjustment: number;
}

export interface ModifierSelectionResult {
  basePrice: number;
  modifierTotal: number;
  finalUnitPrice: number;
  selections: ModifierSelectionSnapshot[];
}

interface LoadedGroup {
  id: string;
  name: string;
  selectionType: string;
  minSelect: number;
  maxSelect: number;
  isActive: boolean;
  options: {
    id: string;
    name: string;
    priceAdjustment: number;
    isAvailable: boolean;
  }[];
}

/** Pure validation + pricing logic, reusable by the future Order phase. */
@Injectable()
export class ModifierSelectionService {
  validateAndCalculate(
    product: Pick<Product, 'id' | 'price'> & {
      productModifierGroups?: {
        sortOrder: number;
        modifierGroup?: LoadedGroup | null;
      }[];
    },
    selections: ModifierSelectionInput[] = [],
  ): ModifierSelectionResult {
    const basePrice = Number(product.price ?? 0);
    const groups = (product.productModifierGroups ?? [])
      .map((link) => link.modifierGroup)
      .filter((g): g is LoadedGroup => !!g && g.isActive);

    const groupById = new Map(groups.map((g) => [g.id, g]));
    const seenGroups = new Set<string>();
    const snapshots: ModifierSelectionSnapshot[] = [];

    for (const selection of selections ?? []) {
      if (seenGroups.has(selection.modifierGroupId)) {
        throw new BadRequestException(
          `Modifier group #${selection.modifierGroupId} is selected more than once`,
        );
      }
      seenGroups.add(selection.modifierGroupId);

      const group = groupById.get(selection.modifierGroupId);
      if (!group) {
        throw new BadRequestException(
          `Modifier group #${selection.modifierGroupId} is not assigned to product #${product.id}`,
        );
      }

      const optionIds = selection.modifierOptionIds ?? [];
      if (new Set(optionIds).size !== optionIds.length) {
        throw new BadRequestException(
          `Modifier group #${group.id} contains duplicate options`,
        );
      }
      if (group.selectionType === 'SINGLE' && optionIds.length > 1) {
        throw new BadRequestException(
          `Modifier group #${group.id} allows a single selection`,
        );
      }
      if (
        optionIds.length < group.minSelect ||
        optionIds.length > group.maxSelect
      ) {
        throw new BadRequestException(
          `Modifier group #${group.id} requires between ${group.minSelect} and ${group.maxSelect} selections`,
        );
      }

      const optionById = new Map(group.options.map((o) => [o.id, o]));
      for (const optionId of optionIds) {
        const option = optionById.get(optionId);
        if (!option) {
          throw new BadRequestException(
            `Modifier option #${optionId} does not belong to group #${group.id}`,
          );
        }
        if (!option.isAvailable) {
          throw new BadRequestException(
            `Modifier option #${optionId} is not available`,
          );
        }
        snapshots.push({
          modifierGroupId: group.id,
          modifierGroupName: group.name,
          modifierOptionId: option.id,
          modifierOptionName: option.name,
          priceAdjustment: Number(option.priceAdjustment ?? 0),
        });
      }
    }

    // Required groups (minSelect > 0) must be present in the selection.
    for (const group of groups) {
      if (group.minSelect > 0 && !seenGroups.has(group.id)) {
        throw new BadRequestException(
          `Modifier group #${group.id} requires at least ${group.minSelect} selection(s)`,
        );
      }
    }

    const modifierTotal = snapshots.reduce(
      (sum, s) => sum + Number(s.priceAdjustment ?? 0),
      0,
    );

    return {
      basePrice,
      modifierTotal,
      finalUnitPrice: basePrice + modifierTotal,
      selections: snapshots,
    };
  }
}
