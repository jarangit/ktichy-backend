import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { QuickNoteController } from './quick-note.controller';
import { QuickNoteService } from './quick-note.service';

describe('QuickNoteController', () => {
  let controller: QuickNoteController;

  const quickNoteServiceMock = {
    findByStoreId: jest.fn(),
    replace: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule],
      controllers: [QuickNoteController],
      providers: [
        {
          provide: QuickNoteService,
          useValue: quickNoteServiceMock,
        },
      ],
    }).compile();

    controller = module.get<QuickNoteController>(QuickNoteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate findByStoreId to the service', () => {
    controller.findByStoreId('s1');
    expect(quickNoteServiceMock.findByStoreId).toHaveBeenCalledWith('s1');
  });

  it('should delegate replace to the service with the user id', () => {
    const req = { user: { sub: 'u1' } };
    controller.replace('s1', { notes: ['less ice'] }, req);
    expect(quickNoteServiceMock.replace).toHaveBeenCalledWith(
      's1',
      ['less ice'],
      'u1',
    );
  });

  it('should delegate create to the service with the user id', () => {
    const req = { user: { sub: 'u1' } };
    const dto = { storeId: 's1', text: 'less ice' };
    controller.create(dto, req);
    expect(quickNoteServiceMock.create).toHaveBeenCalledWith(dto, 'u1');
  });

  it('should delegate update to the service with the user id', () => {
    const req = { user: { sub: 'u1' } };
    const dto = { text: 'no onion' };
    controller.update('qn1', dto, req);
    expect(quickNoteServiceMock.update).toHaveBeenCalledWith('qn1', dto, 'u1');
  });

  it('should delegate remove to the service with the user id', () => {
    const req = { user: { sub: 'u1' } };
    controller.remove('qn1', req);
    expect(quickNoteServiceMock.remove).toHaveBeenCalledWith('qn1', 'u1');
  });
});
