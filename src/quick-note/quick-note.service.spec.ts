import { Test, TestingModule } from '@nestjs/testing';
import { QuickNoteService } from './quick-note.service';

describe('QuickNoteService', () => {
  let service: QuickNoteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuickNoteService],
    }).compile();

    service = module.get<QuickNoteService>(QuickNoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
