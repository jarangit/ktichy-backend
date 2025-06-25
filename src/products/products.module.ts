import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { ProductService } from './products.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), JwtModule],
  controllers: [ProductsController],
  providers: [ProductService],
})
export class ProductsModule {}
