import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { QuickNoteService } from './quick-note.service';
import { CreateQuickNoteDto } from './dto/create-quick-note.dto';
import { UpdateQuickNoteDto } from './dto/update-quick-note.dto';

@Controller('quick-note')
export class QuickNoteController {
  constructor(private readonly quickNoteService: QuickNoteService) {}

  @Post()
  create(@Body() createQuickNoteDto: CreateQuickNoteDto) {
    return this.quickNoteService.create(createQuickNoteDto);
  }

  @Get()
  findAll() {
    return this.quickNoteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quickNoteService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQuickNoteDto: UpdateQuickNoteDto) {
    return this.quickNoteService.update(+id, updateQuickNoteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quickNoteService.remove(+id);
  }
}
