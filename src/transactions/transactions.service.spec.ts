import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { Order } from '../orders/entities/order.entity';
import { OrdersService } from '../orders/orders.service';

describe('TransactionsService', () => {
  let service: TransactionsService;

  const orderRepositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const ordersServiceMock = {
    update: jest.fn(),
  };

  const baseOrder = {
    id: 'o1',
    orderNumber: 'A-001',
    status: 'READY',
    orderType: 'DINE_IN',
    tableNumber: 'T1',
    customerName: null,
    deliveryPlatform: null,
    deliveryOrderNumber: null,
    isWaitingInStore: false,
    store: { id: 's1' },
    createdAt: new Date('2026-08-18T10:00:00Z'),
    updatedAt: new Date('2026-08-18T10:00:00Z'),
    items: [
      {
        id: 'i1',
        product: { id: 'p1' },
        stationItems: [{ status: 'served' }],
        name: 'Coffee',
        price: 50,
        quantity: 2,
        notes: null,
      },
    ],
    payments: [{ method: 'QR', amount: 100, receiptId: 'A-001' }],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepositoryMock,
        },
        {
          provide: OrdersService,
          useValue: ordersServiceMock,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByStoreId', () => {
    it('should map orders with payment and item snapshots', async () => {
      orderRepositoryMock.find.mockResolvedValue([baseOrder]);

      const result = await service.findByStoreId('s1');

      expect(result).toHaveLength(1);
      expect(result[0].method).toBe('QR');
      expect(result[0].receiptId).toBe('A-001');
      expect(result[0].totalAmount).toBe(100);
      expect(result[0].servedItemCount).toBe(2);
      expect(result[0].totalItemCount).toBe(2);
      expect(result[0].items[0]).toEqual({
        id: 'i1',
        productId: 'p1',
        name: 'Coffee',
        price: 50,
        quantity: 2,
        total: 100,
        note: null,
      });
    });

    it('should compute total from items when no payment exists', async () => {
      orderRepositoryMock.find.mockResolvedValue([
        { ...baseOrder, payments: [] },
      ]);

      const result = await service.findByStoreId('s1');

      expect(result[0].method).toBeNull();
      expect(result[0].totalAmount).toBe(100);
    });

    it('should keep served count at zero when items are not fully served', async () => {
      orderRepositoryMock.find.mockResolvedValue([
        {
          ...baseOrder,
          items: [
            {
              ...baseOrder.items[0],
              stationItems: [{ status: 'complete' }],
            },
          ],
        },
      ]);

      const result = await service.findByStoreId('s1');

      expect(result[0].servedItemCount).toBe(0);
      expect(result[0].totalItemCount).toBe(2);
    });

    it('should return an empty array when the store has no orders', async () => {
      orderRepositoryMock.find.mockResolvedValue([]);

      const result = await service.findByStoreId('s1');

      expect(result).toEqual([]);
    });

    it('should filter by payment method', async () => {
      orderRepositoryMock.find.mockResolvedValue([baseOrder]);

      const result = await service.findByStoreId('s1', { method: 'CASH' });

      expect(result).toEqual([]);
    });

    it('should filter done flow status using READY and COMPLETED', async () => {
      orderRepositoryMock.find.mockResolvedValue([
        baseOrder,
        { ...baseOrder, id: 'o2', status: 'COMPLETED' },
        { ...baseOrder, id: 'o3', status: 'PREPARING' },
      ]);

      const result = await service.findByStoreId('s1', { flowStatus: 'DONE' });

      expect(result.map((item) => item.id)).toEqual(['o1', 'o2']);
    });

    it('should filter in progress flow status', async () => {
      orderRepositoryMock.find.mockResolvedValue([
        { ...baseOrder, id: 'o1', status: 'PREPARING' },
        { ...baseOrder, id: 'o2', status: 'READY' },
        { ...baseOrder, id: 'o3', status: 'CANCELLED' },
      ]);

      const result = await service.findByStoreId('s1', {
        flowStatus: 'IN_PROGRESS',
      });

      expect(result.map((item) => item.id)).toEqual(['o1']);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when missing', async () => {
      orderRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.findOne('x')).rejects.toThrow(
        'Transaction #x not found',
      );
    });

    it('should return the mapped transaction', async () => {
      orderRepositoryMock.findOne.mockResolvedValue(baseOrder);

      const result = await service.findOne('o1');

      expect(result.orderNumber).toBe('A-001');
      expect(result.totalAmount).toBe(100);
    });
  });

  describe('getCountsByStoreId', () => {
    it('should aggregate counts by flow status', async () => {
      orderRepositoryMock.find.mockResolvedValue([
        { id: 'o1', status: 'PREPARING' },
        { id: 'o2', status: 'READY' },
        { id: 'o3', status: 'COMPLETED' },
        { id: 'o4', status: 'CANCELLED' },
      ]);

      const result = await service.getCountsByStoreId('s1');

      expect(result).toEqual({
        all: 4,
        inProgress: 1,
        done: 2,
        cancelled: 1,
      });
    });
  });

  describe('update', () => {
    it('should delegate to OrdersService and map the result', async () => {
      ordersServiceMock.update.mockResolvedValue(baseOrder);

      const result = await service.update('o1', { status: 'READY' });

      expect(ordersServiceMock.update).toHaveBeenCalledWith('o1', {
        status: 'READY',
      });
      expect(result.id).toBe('o1');
    });
  });
});
