import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class AssignModifierGroupDto {
  @IsString()
  @IsNotEmpty()
  modifierGroupId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
