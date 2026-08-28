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

    it('should filter by search on orderNumber (case-insensitive)', async () => {
      orderRepositoryMock.find.mockResolvedValue([
        baseOrder,
        { ...baseOrder, id: 'o2', orderNumber: 'B-999' },
        { ...baseOrder, id: 'o3', orderNumber: 'a-002' },
      ]);

      const result = await service.findByStoreId('s1', { search: 'a-00' });

      expect(result.map((item) => item.id).sort()).toEqual(['o1', 'o3']);
    });

    it('should filter by orderType', async () => {
      orderRepositoryMock.find.mockResolvedValue([
        baseOrder,
        { ...baseOrder, id: 'o2', orderType: 'TOGO' },
        { ...baseOrder, id: 'o3', orderType: 'DELIVERY' },
      ]);

      const result = await service.findByStoreId('s1', {
        orderType: 'DINE_IN',
      });

      expect(result.map((item) => item.id)).toEqual(['o1']);
    });

    it('should filter by method case-insensitive via uppercase normalization', async () => {
      orderRepositoryMock.find.mockResolvedValue([baseOrder]);

      const result = await service.findByStoreId('s1', { method: 'qr' as any });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('o1');
    });

    it('should combine search, orderType and method filters', async () => {
      orderRepositoryMock.find.mockResolvedValue([
        baseOrder,
        {
          ...baseOrder,
          id: 'o2',
          orderNumber: 'A-002',
          orderType: 'DINE_IN',
          payments: [{ method: 'CASH', amount: 50, receiptId: 'A-002' }],
        },
        {
          ...baseOrder,
          id: 'o3',
          orderNumber: 'A-003',
          orderType: 'TOGO',
          payments: [{ method: 'QR', amount: 50, receiptId: 'A-003' }],
        },
      ]);

      const result = await service.findByStoreId('s1', {
        search: 'A-00',
        orderType: 'DINE_IN',
        method: 'QR',
      });

      expect(result.map((item) => item.id)).toEqual(['o1']);
    });

    it('should pass date range to repository where clause', async () => {
      orderRepositoryMock.find.mockResolvedValue([baseOrder]);

      await service.findByStoreId('s1', {
        startDate: '2026-08-18T00:00:00.000Z',
        endDate: '2026-08-19T00:00:00.000Z',
      });

      expect(orderRepositoryMock.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            store: { id: 's1' },
          }),
        }),
      );
      const where = orderRepositoryMock.find.mock.calls[0][0].where;
      expect(where.createdAt).toBeDefined();
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
        { ...baseOrder, id: 'o1', status: 'PREPARING', orderNumber: 'A-001' },
        { ...baseOrder, id: 'o2', status: 'READY', orderNumber: 'A-002' },
        { ...baseOrder, id: 'o3', status: 'COMPLETED', orderNumber: 'A-003' },
        { ...baseOrder, id: 'o4', status: 'CANCELLED', orderNumber: 'A-004' },
      ]);

      const result = await service.getCountsByStoreId('s1');

      expect(result).toEqual({
        all: 4,
        inProgress: 1,
        done: 2,
        cancelled: 1,
      });
    });

    it('should respect search filter when counting', async () => {
      orderRepositoryMock.find.mockResolvedValue([
        { ...baseOrder, id: 'o1', orderNumber: 'A-001', status: 'PREPARING' },
        { ...baseOrder, id: 'o2', orderNumber: 'B-001', status: 'READY' },
        { ...baseOrder, id: 'o3', orderNumber: 'A-002', status: 'COMPLETED' },
      ]);

      const result = await service.getCountsByStoreId('s1', { search: 'A-00' });

      expect(result.all).toBe(2);
      expect(result.inProgress).toBe(1);
      expect(result.done).toBe(1);
      expect(result.cancelled).toBe(0);
    });

    it('should respect method and orderType filters when counting', async () => {
      orderRepositoryMock.find.mockResolvedValue([
        baseOrder, // DINE_IN, QR
        {
          ...baseOrder,
          id: 'o2',
          orderType: 'TOGO',
          payments: [{ method: 'CASH', amount: 100, receiptId: 'A-002' }],
          orderNumber: 'A-002',
          status: 'READY',
        },
        {
          ...baseOrder,
          id: 'o3',
          orderType: 'DINE_IN',
          payments: [{ method: 'QR', amount: 100, receiptId: 'A-003' }],
          orderNumber: 'A-003',
          status: 'CANCELLED',
        },
      ]);

      const result = await service.getCountsByStoreId('s1', {
        orderType: 'DINE_IN',
        method: 'QR',
      });

      expect(result).toEqual({
        all: 2,
        inProgress: 0,
        done: 1,
        cancelled: 1,
      });
    });

    it('should respect flowStatus filter when counting', async () => {
      orderRepositoryMock.find.mockResolvedValue([
        { ...baseOrder, id: 'o1', status: 'PREPARING', orderNumber: 'A-001' },
        { ...baseOrder, id: 'o2', status: 'READY', orderNumber: 'A-002' },
        { ...baseOrder, id: 'o3', status: 'CANCELLED', orderNumber: 'A-003' },
      ]);

      const result = await service.getCountsByStoreId('s1', {
        flowStatus: 'DONE',
      });

      expect(result).toEqual({
        all: 1,
        inProgress: 0,
        done: 1,
        cancelled: 0,
      });
    });

    it('should share filter logic with findByStoreId (counts matches list length)', async () => {
      const orders = [
        baseOrder,
        { ...baseOrder, id: 'o2', orderNumber: 'A-002', status: 'PREPARING' },
        { ...baseOrder, id: 'o3', orderNumber: 'B-001', status: 'READY' },
      ];
      orderRepositoryMock.find.mockResolvedValue(orders);

      const filter = { search: 'A-00', flowStatus: 'IN_PROGRESS' as const };
      const list = await service.findByStoreId('s1', filter);
      orderRepositoryMock.find.mockResolvedValue(orders);
      const counts = await service.getCountsByStoreId('s1', filter);

      expect(counts.all).toBe(list.length);
    });
  });

  describe('update', () => {
    it('should delegate to OrdersService and map the result', async () => {
      ordersServiceMock.update.mockResolvedValue(baseOrder);

      const result = await service.update('o1', { status: 'READY' } as any);

      expect(ordersServiceMock.update).toHaveBeenCalledWith('o1', {
        status: 'READY',
      });
      expect(result.id).toBe('o1');
    });

    it('should delegate tableNumber and products patch', async () => {
      ordersServiceMock.update.mockResolvedValue({
        ...baseOrder,
        tableNumber: 'A12',
      });

      const payload = {
        tableNumber: 'A12',
        products: [{ productId: 'p1', quantity: 2, note: 'less ice' }],
      } as any;

      const result = await service.update('o1', payload);

      expect(ordersServiceMock.update).toHaveBeenCalledWith('o1', payload);
      expect(result.tableNumber).toBe('A12');
    });
  });
});
