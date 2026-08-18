import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { QuickNoteService } from './quick-note.service';
import { QuickNoteController } from './quick-note.controller';
import { QuickNote } from './entities/quick-note.entity';
import { Store } from '../stores/entities/store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([QuickNote, Store]), JwtModule],
  controllers: [QuickNoteController],
  providers: [QuickNoteService],
})
export class QuickNoteModule {}
