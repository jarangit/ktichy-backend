import { Test, TestingModule } from '@nestjs/testing';
import { UserIdentitiesService } from './user_identities.service';

describe('UserIdentitiesService', () => {
  let service: UserIdentitiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserIdentitiesService],
    }).compile();

    service = module.get<UserIdentitiesService>(UserIdentitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
