import { Test, TestingModule } from '@nestjs/testing';
import { QuickNoteController } from './quick-note.controller';
import { QuickNoteService } from './quick-note.service';

describe('QuickNoteController', () => {
  let controller: QuickNoteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuickNoteController],
      providers: [QuickNoteService],
    }).compile();

    controller = module.get<QuickNoteController>(QuickNoteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
