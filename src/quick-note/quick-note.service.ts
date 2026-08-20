import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuickNote } from './entities/quick-note.entity';
import { Store } from '../stores/entities/store.entity';
import { CreateQuickNoteDto } from './dto/create-quick-note.dto';
import { UpdateQuickNoteDto } from './dto/update-quick-note.dto';

@Injectable()
export class QuickNoteService {
  constructor(
    @InjectRepository(QuickNote)
    private readonly quickNoteRepository: Repository<QuickNote>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  async create(createQuickNoteDto: CreateQuickNoteDto, userId?: string) {
    const storeId = createQuickNoteDto.storeId?.trim();
    if (!storeId) {
      throw new BadRequestException('storeId is required');
    }

    const text = createQuickNoteDto.text?.trim();
    if (!text) {
      throw new BadRequestException('text cannot be empty');
    }

    await this.assertStoreOwnership(storeId, userId);

    const lastNote = await this.quickNoteRepository.find({
      where: { store: { id: storeId } },
      order: { sortOrder: 'DESC' },
      take: 1,
    });
    const nextSortOrder = (lastNote[0]?.sortOrder ?? -1) + 1;

    const note = this.quickNoteRepository.create({
      store: { id: storeId },
      text,
      sortOrder: createQuickNoteDto.sortOrder ?? nextSortOrder,
    });

    return this.quickNoteRepository.save(note);
  }

  async findByStoreId(storeId: string) {
    const normalizedStoreId = storeId?.trim();
    if (!normalizedStoreId) {
      throw new BadRequestException('storeId is required');
    }

    return this.quickNoteRepository.find({
      where: { store: { id: normalizedStoreId } },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async update(
    id: string,
    updateQuickNoteDto: UpdateQuickNoteDto,
    userId?: string,
  ) {
    const note = await this.quickNoteRepository.findOne({
      where: { id },
      relations: { store: true },
    });

    if (!note) {
      throw new NotFoundException(`Quick note #${id} not found`);
    }

    await this.assertStoreOwnership(note.store?.id, userId);

    if (updateQuickNoteDto.text !== undefined) {
      const text = updateQuickNoteDto.text?.trim();
      if (!text) {
        throw new BadRequestException('text cannot be empty');
      }
      note.text = text;
    }

    if (updateQuickNoteDto.sortOrder !== undefined) {
      note.sortOrder = updateQuickNoteDto.sortOrder;
    }

    return this.quickNoteRepository.save(note);
  }

  async remove(id: string, userId?: string) {
    const note = await this.quickNoteRepository.findOne({
      where: { id },
      relations: { store: true },
    });

    if (!note) {
      throw new NotFoundException(`Quick note #${id} not found`);
    }

    const storeId = note.store?.id;
    await this.assertStoreOwnership(storeId, userId);

    const count = await this.quickNoteRepository.count({
      where: { store: { id: storeId } },
    });

    if (count <= 1) {
      throw new BadRequestException(
        'Cannot delete the last quick note for this store',
      );
    }

    await this.quickNoteRepository.remove(note);

    return { message: `Quick note #${id} has been removed successfully` };
  }

  async replace(storeId: string, notes: string[], userId?: string) {
    const normalizedStoreId = storeId?.trim();
    if (!normalizedStoreId) {
      throw new BadRequestException('storeId is required');
    }

    await this.assertStoreOwnership(normalizedStoreId, userId);

    const trimmed = notes.map((note) => note.trim()).filter(Boolean);
    if (trimmed.length === 0) {
      throw new BadRequestException('notes cannot be empty');
    }

    await this.quickNoteRepository
      .createQueryBuilder()
      .delete()
      .from(QuickNote)
      .where('storeId = :storeId', { storeId: normalizedStoreId })
      .execute();

    if (trimmed.length > 0) {
      const entities = trimmed.map((text, index) =>
        this.quickNoteRepository.create({
          store: { id: normalizedStoreId },
          text,
          sortOrder: index,
        }),
      );
      await this.quickNoteRepository.save(entities);
    }

    return this.findByStoreId(normalizedStoreId);
  }

  private async assertStoreOwnership(
    storeId: string | undefined,
    userId?: string,
  ) {
    if (!storeId || !userId) return;

    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });
    if (store && store.owner_id !== userId) {
      throw new ForbiddenException('You do not own this store');
    }
  }
}
