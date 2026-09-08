import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ModifierSelectionType } from '../entities/modifier-group.entity';

export class CreateModifierGroupDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(ModifierSelectionType)
  selectionType: ModifierSelectionType;

  @IsOptional()
  @IsInt()
  @Min(0)
  minSelect?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxSelect?: number;
}
