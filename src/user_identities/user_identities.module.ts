import { Module } from '@nestjs/common';
import { UserIdentitiesService } from './user_identities.service';
import { UserIdentitiesController } from './user_identities.controller';

@Module({
  controllers: [UserIdentitiesController],
  providers: [UserIdentitiesService],
})
export class UserIdentitiesModule {}
