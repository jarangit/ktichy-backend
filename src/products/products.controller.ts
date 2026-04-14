import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-menu.dto';
import { UpdateProductDto } from './dto/update-menu.dto';
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  @Get('restaurant/:restaurantId')
  findByRestaurantId(@Param('restaurantId') restaurantId: string) {
    return this.productService.findByRestaurantId(restaurantId);
  }

  @Get('store/:storeId')
  findByStoreId(@Param('storeId') storeId: string) {
    return this.productService.findByStoreId(storeId);
  }
}
