import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

describe('TransactionsController', () => {
  let controller: TransactionsController;

  const transactionsServiceMock = {
    findByStoreId: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    getCountsByStoreId: jest.fn(),
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
    controller.findByStoreId({
      storeId: 's1',
      status: 'READY',
      method: 'QR' as any,
    } as any);
    expect(transactionsServiceMock.findByStoreId).toHaveBeenCalledWith('s1', {
      status: 'READY',
      method: 'QR',
    });
  });

  it('should delegate list with search, orderType and date filters', () => {
    controller.findByStoreId({
      storeId: 's1',
      search: 'A-00',
      orderType: 'DINE_IN' as any,
      flowStatus: 'IN_PROGRESS',
      startDate: '2026-08-18T00:00:00.000Z',
      endDate: '2026-08-19T00:00:00.000Z',
    } as any);
    expect(transactionsServiceMock.findByStoreId).toHaveBeenCalledWith('s1', {
      search: 'A-00',
      orderType: 'DINE_IN',
      flowStatus: 'IN_PROGRESS',
      startDate: '2026-08-18T00:00:00.000Z',
      endDate: '2026-08-19T00:00:00.000Z',
    });
  });

  it('should delegate counts to getCountsByStoreId with filters', () => {
    controller.getCounts({
      storeId: 's1',
      search: 'A-00',
      method: 'CASH' as any,
      flowStatus: 'DONE',
    } as any);
    expect(transactionsServiceMock.getCountsByStoreId).toHaveBeenCalledWith(
      's1',
      {
        search: 'A-00',
        method: 'CASH',
        flowStatus: 'DONE',
      },
    );
  });

  it('should delegate detail to findOne', () => {
    controller.findOne('o1');
    expect(transactionsServiceMock.findOne).toHaveBeenCalledWith('o1');
  });

  it('should delegate update to the service', () => {
    const payload = { status: 'CANCELLED' } as any;
    controller.update('o1', payload);
    expect(transactionsServiceMock.update).toHaveBeenCalledWith('o1', payload);
  });
});
