import { Test, TestingModule } from '@nestjs/testing';
import { UserIdentitiesController } from './user_identities.controller';
import { UserIdentitiesService } from './user_identities.service';

describe('UserIdentitiesController', () => {
  let controller: UserIdentitiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserIdentitiesController],
      providers: [UserIdentitiesService],
    }).compile();

    controller = module.get<UserIdentitiesController>(UserIdentitiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
