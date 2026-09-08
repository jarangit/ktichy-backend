import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth-guard';
import { ModifiersService } from './modifiers.service';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { UpdateModifierGroupDto } from './dto/update-modifier-group.dto';
import { CreateModifierOptionDto } from './dto/create-modifier-option.dto';
import { UpdateModifierOptionDto } from './dto/update-modifier-option.dto';
import { AssignModifierGroupDto } from './dto/assign-modifier-group.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class ModifiersController {
  constructor(private readonly modifiersService: ModifiersService) {}

  @Post('modifier-groups')
  createGroup(@Body() dto: CreateModifierGroupDto, @Req() req: any) {
    return this.modifiersService.createGroup(dto, req.user?.sub);
  }

  @Get('modifier-groups')
  listGroups(@Query('storeId') storeId: string, @Req() req: any) {
    return this.modifiersService.listGroups(storeId, req.user?.sub);
  }

  @Get('modifier-groups/:id')
  getGroup(@Param('id') id: string, @Req() req: any) {
    return this.modifiersService.getGroup(id, req.user?.sub);
  }

  @Patch('modifier-groups/:id')
  updateGroup(
    @Param('id') id: string,
    @Body() dto: UpdateModifierGroupDto,
    @Req() req: any,
  ) {
    return this.modifiersService.updateGroup(id, dto, req.user?.sub);
  }

  @Delete('modifier-groups/:id')
  deactivateGroup(@Param('id') id: string, @Req() req: any) {
    return this.modifiersService.deactivateGroup(id, req.user?.sub);
  }

  @Post('modifier-groups/:groupId/options')
  createOption(
    @Param('groupId') groupId: string,
    @Body() dto: CreateModifierOptionDto,
    @Req() req: any,
  ) {
    return this.modifiersService.createOption(groupId, dto, req.user?.sub);
  }

  @Patch('modifier-options/:id')
  updateOption(
    @Param('id') id: string,
    @Body() dto: UpdateModifierOptionDto,
    @Req() req: any,
  ) {
    return this.modifiersService.updateOption(id, dto, req.user?.sub);
  }

  @Delete('modifier-options/:id')
  deactivateOption(@Param('id') id: string, @Req() req: any) {
    return this.modifiersService.deactivateOption(id, req.user?.sub);
  }

  @Post('products/:productId/modifier-groups')
  assignGroup(
    @Param('productId') productId: string,
    @Body() dto: AssignModifierGroupDto,
    @Req() req: any,
  ) {
    return this.modifiersService.assignGroupToProduct(
      productId,
      dto.modifierGroupId,
      dto.sortOrder,
      req.user?.sub,
    );
  }

  @Delete('products/:productId/modifier-groups/:modifierGroupId')
  removeGroup(
    @Param('productId') productId: string,
    @Param('modifierGroupId') modifierGroupId: string,
    @Req() req: any,
  ) {
    return this.modifiersService.removeGroupFromProduct(
      productId,
      modifierGroupId,
      req.user?.sub,
    );
  }
}
