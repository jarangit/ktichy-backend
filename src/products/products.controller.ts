import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-menu.dto';
import { UpdateProductDto } from './dto/update-menu.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { ProductService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth-guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createProductDto: CreateProductDto, @Req() req: any) {
    const userId = req.user?.sub;
    return this.productService.create(createProductDto, userId);
  }

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Get('category/:id')
  findByCategoryId(
    @Param('id') categoryId: string,
    @Query() query: GetProductsQueryDto,
  ) {
    return this.productService.findByCategoryId(categoryId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Req() req: any,
  ) {
    return this.productService.update(id, updateProductDto, req.user?.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.productService.remove(id, req.user?.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/restore')
  restore(@Param('id') id: string, @Req() req: any) {
    return this.productService.restore(id, req.user?.sub);
  }

  @Get('restaurant/:restaurantId')
  findByRestaurantId(
    @Param('restaurantId') restaurantId: string,
    @Query() query: GetProductsQueryDto,
  ) {
    return this.productService.findByRestaurantId(restaurantId, query);
  }

  @Get('store/:storeId')
  findByStoreId(
    @Param('storeId') storeId: string,
    @Query() query: GetProductsQueryDto,
  ) {
    return this.productService.findByStoreId(storeId, query);
  }
}
