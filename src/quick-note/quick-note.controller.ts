import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { QuickNoteService } from './quick-note.service';
import { CreateQuickNoteDto } from './dto/create-quick-note.dto';
import { UpdateQuickNoteDto } from './dto/update-quick-note.dto';
import { ReplaceQuickNotesDto } from './dto/replace-quick-notes.dto';
import { JwtAuthGuard } from '../auth/jwt-auth-guard';

@Controller('quick-note')
export class QuickNoteController {
  constructor(private readonly quickNoteService: QuickNoteService) {}

  @UseGuards(JwtAuthGuard)
  @Get('store/:storeId')
  findByStoreId(@Param('storeId') storeId: string) {
    return this.quickNoteService.findByStoreId(storeId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('store/:storeId')
  replace(
    @Param('storeId') storeId: string,
    @Body() dto: ReplaceQuickNotesDto,
    @Req() req: any,
  ) {
    return this.quickNoteService.replace(storeId, dto.notes, req.user?.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createQuickNoteDto: CreateQuickNoteDto, @Req() req: any) {
    return this.quickNoteService.create(createQuickNoteDto, req.user?.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateQuickNoteDto: UpdateQuickNoteDto,
    @Req() req: any,
  ) {
    return this.quickNoteService.update(id, updateQuickNoteDto, req.user?.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.quickNoteService.remove(id, req.user?.sub);
  }
}
