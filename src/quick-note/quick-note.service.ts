import { Injectable } from '@nestjs/common';
import { CreateQuickNoteDto } from './dto/create-quick-note.dto';
import { UpdateQuickNoteDto } from './dto/update-quick-note.dto';

@Injectable()
export class QuickNoteService {
  create(createQuickNoteDto: CreateQuickNoteDto) {
    return 'This action adds a new quickNote';
  }

  findAll() {
    return `This action returns all quickNote`;
  }

  findOne(id: number) {
    return `This action returns a #${id} quickNote`;
  }

  update(id: number, updateQuickNoteDto: UpdateQuickNoteDto) {
    return `This action updates a #${id} quickNote`;
  }

  remove(id: number) {
    return `This action removes a #${id} quickNote`;
  }
}
