import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateQuickNoteDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  text: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
