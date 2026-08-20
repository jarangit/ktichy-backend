import { Injectable } from '@nestjs/common';

@Injectable()
export class UserIdentitiesService {
  create() {
    return 'This action adds a new userIdentity';
  }

  findAll() {
    return `This action returns all userIdentities`;
  }

  findOne(id: number) {
    return `This action returns a #${id} userIdentity`;
  }

  update(id: number) {
    return `This action updates a #${id} userIdentity`;
  }

  remove(id: number) {
    return `This action removes a #${id} userIdentity`;
  }
}
