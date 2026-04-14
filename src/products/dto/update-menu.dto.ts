import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-menu.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
