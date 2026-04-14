export class CreateCategoryDto {
  name: string;
  isActive?: boolean;
  sortOrder?: number;
  storeId: string;
}
