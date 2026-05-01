import { PartialType } from '@nestjs/mapped-types';
import { CreateUserIdentityDto } from './create-user_identity.dto';

export class UpdateUserIdentityDto extends PartialType(CreateUserIdentityDto) {}
