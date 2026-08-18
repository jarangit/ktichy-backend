import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

describe('TransactionsController', () => {
  let controller: TransactionsController;

  const transactionsServiceMock = {
    findByStoreId: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: transactionsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate list to findByStoreId with query filters', () => {
    controller.findByStoreId('s1', { status: 'READY', method: 'QR' });
    expect(transactionsServiceMock.findByStoreId).toHaveBeenCalledWith('s1', {
      status: 'READY',
      method: 'QR',
    });
  });

  it('should delegate detail to findOne', () => {
    controller.findOne('o1');
    expect(transactionsServiceMock.findOne).toHaveBeenCalledWith('o1');
  });

  it('should delegate update to the service', () => {
    const payload = { status: 'CANCELLED' };
    controller.update('o1', payload);
    expect(transactionsServiceMock.update).toHaveBeenCalledWith('o1', payload);
  });
});
