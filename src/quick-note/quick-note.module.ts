import { Module } from '@nestjs/common';
import { QuickNoteService } from './quick-note.service';
import { QuickNoteController } from './quick-note.controller';

@Module({
  controllers: [QuickNoteController],
  providers: [QuickNoteService],
})
export class QuickNoteModule {}
