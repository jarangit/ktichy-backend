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
