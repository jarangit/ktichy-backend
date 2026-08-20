import { Controller, Get, Post, Patch, Param, Delete } from '@nestjs/common';
import { UserIdentitiesService } from './user_identities.service';

@Controller('user-identities')
export class UserIdentitiesController {
  constructor(private readonly userIdentitiesService: UserIdentitiesService) {}

  @Post()
  create() {
    return this.userIdentitiesService.create();
  }

  @Get()
  findAll() {
    return this.userIdentitiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userIdentitiesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string) {
    return this.userIdentitiesService.update(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userIdentitiesService.remove(+id);
  }
}
