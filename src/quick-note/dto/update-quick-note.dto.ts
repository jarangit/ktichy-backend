import { PartialType } from '@nestjs/mapped-types';
import { CreateQuickNoteDto } from './create-quick-note.dto';

export class UpdateQuickNoteDto extends PartialType(CreateQuickNoteDto) {}
