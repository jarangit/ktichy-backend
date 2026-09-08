import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ModifierGroup } from './entities/modifier-group.entity';
import { ModifierOption } from './entities/modifier-option.entity';
import { ProductModifierGroup } from './entities/product-modifier-group.entity';
import { Product } from '../products/entities/product.entity';
import { ModifiersService } from './modifiers.service';
import { ModifierSelectionService } from './modifier-selection.service';
import { ModifiersController } from './modifiers.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ModifierGroup,
      ModifierOption,
      ProductModifierGroup,
      Product,
    ]),
    JwtModule,
  ],
  controllers: [ModifiersController],
  providers: [ModifiersService, ModifierSelectionService],
  exports: [ModifiersService, ModifierSelectionService],
})
export class ModifiersModule {}
