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
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { ProductService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth-guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createMenuDto: CreateMenuDto, @Req() req: any) {
    const userId = req.user?.sub;
    return this.productService.create(createMenuDto, userId);
  }

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto) {
    return this.productService.update(+id, updateMenuDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(+id);
  }

  @Get('restaurant/:restaurantId')
  findByRestaurantId(@Param('restaurantId') restaurantId: number) {
    return this.productService.findByRestaurantId(+restaurantId);
  }
}
