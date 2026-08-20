import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QuickNoteService } from './quick-note.service';
import { QuickNote } from './entities/quick-note.entity';
import { Store } from '../stores/entities/store.entity';

describe('QuickNoteService', () => {
  let service: QuickNoteService;

  const quickNoteRepositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const storeRepositoryMock = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuickNoteService,
        {
          provide: getRepositoryToken(QuickNote),
          useValue: quickNoteRepositoryMock,
        },
        {
          provide: getRepositoryToken(Store),
          useValue: storeRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<QuickNoteService>(QuickNoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a quick note with the next sortOrder', async () => {
      storeRepositoryMock.findOne.mockResolvedValue({
        id: 's1',
        owner_id: 'u1',
      });
      quickNoteRepositoryMock.find.mockResolvedValue([{ sortOrder: 2 }]);
      quickNoteRepositoryMock.create.mockImplementation((p) => p);
      quickNoteRepositoryMock.save.mockImplementation(async (p) => ({
        id: 'qn1',
        ...p,
      }));

      const result = await service.create(
        { storeId: 's1', text: 'less ice' },
        'u1',
      );

      expect(result.id).toBe('qn1');
      expect(result.text).toBe('less ice');
      expect(result.sortOrder).toBe(3);
    });

    it('should throw BadRequestException when text is empty', async () => {
      storeRepositoryMock.findOne.mockResolvedValue({
        id: 's1',
        owner_id: 'u1',
      });

      await expect(
        service.create({ storeId: 's1', text: '   ' }, 'u1'),
      ).rejects.toThrow('text cannot be empty');
    });

    it('should throw ForbiddenException when user does not own the store', async () => {
      storeRepositoryMock.findOne.mockResolvedValue({
        id: 's1',
        owner_id: 'someone-else',
      });

      await expect(
        service.create({ storeId: 's1', text: 'less ice' }, 'u1'),
      ).rejects.toThrow('You do not own this store');
    });
  });

  describe('remove', () => {
    it('should prevent deleting the last quick note', async () => {
      storeRepositoryMock.findOne.mockResolvedValue({
        id: 's1',
        owner_id: 'u1',
      });
      quickNoteRepositoryMock.findOne.mockResolvedValue({
        id: 'qn1',
        store: { id: 's1', owner_id: 'u1' },
      });
      quickNoteRepositoryMock.count.mockResolvedValue(1);

      await expect(service.remove('qn1', 'u1')).rejects.toThrow(
        'Cannot delete the last quick note',
      );
    });

    it('should remove the quick note when there is more than one', async () => {
      storeRepositoryMock.findOne.mockResolvedValue({
        id: 's1',
        owner_id: 'u1',
      });
      quickNoteRepositoryMock.findOne.mockResolvedValue({
        id: 'qn1',
        store: { id: 's1', owner_id: 'u1' },
      });
      quickNoteRepositoryMock.count.mockResolvedValue(2);
      quickNoteRepositoryMock.remove.mockResolvedValue({ id: 'qn1' });

      const result = await service.remove('qn1', 'u1');

      expect(result.message).toContain('has been removed');
    });

    it('should throw NotFoundException when note does not exist', async () => {
      quickNoteRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.remove('missing', 'u1')).rejects.toThrow(
        'Quick note #missing not found',
      );
    });
  });

  describe('replace', () => {
    it('should replace all quick notes for the store', async () => {
      storeRepositoryMock.findOne.mockResolvedValue({
        id: 's1',
        owner_id: 'u1',
      });
      quickNoteRepositoryMock.createQueryBuilder.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      });
      quickNoteRepositoryMock.create.mockImplementation((p) => p);
      quickNoteRepositoryMock.save.mockImplementation(async (notes) => notes);
      quickNoteRepositoryMock.find.mockResolvedValue([
        { id: 'qn1', text: 'no onion', sortOrder: 0 },
        { id: 'qn2', text: 'less ice', sortOrder: 1 },
      ]);

      const result = await service.replace(
        's1',
        ['no onion', 'less ice'],
        'u1',
      );

      expect(result).toHaveLength(2);
      expect(quickNoteRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'no onion', sortOrder: 0 }),
      );
    });

    it('should throw BadRequestException when all notes are blank', async () => {
      storeRepositoryMock.findOne.mockResolvedValue({
        id: 's1',
        owner_id: 'u1',
      });

      await expect(service.replace('s1', ['  ', ''], 'u1')).rejects.toThrow(
        'notes cannot be empty',
      );
    });
  });
});
