import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Store } from '../stores/entities/store.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Store]), JwtModule],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
