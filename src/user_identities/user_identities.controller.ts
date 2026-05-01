import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserIdentitiesService } from './user_identities.service';
import { CreateUserIdentityDto } from './dto/create-user_identity.dto';
import { UpdateUserIdentityDto } from './dto/update-user_identity.dto';

@Controller('user-identities')
export class UserIdentitiesController {
  constructor(private readonly userIdentitiesService: UserIdentitiesService) {}

  @Post()
  create(@Body() createUserIdentityDto: CreateUserIdentityDto) {
    return this.userIdentitiesService.create(createUserIdentityDto);
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
  update(@Param('id') id: string, @Body() updateUserIdentityDto: UpdateUserIdentityDto) {
    return this.userIdentitiesService.update(+id, updateUserIdentityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userIdentitiesService.remove(+id);
  }
}
