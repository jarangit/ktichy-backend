import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { PaymentsController } from '../src/payments/payments.controller';
import { PaymentsService } from '../src/payments/payments.service';
import { TransactionsController } from '../src/transactions/transactions.controller';
import { TransactionsService } from '../src/transactions/transactions.service';
import { ReportsController } from '../src/reports/reports.controller';
import { ReportsService } from '../src/reports/reports.service';
import {
  Payment,
  PaymentMethod,
} from '../src/payments/entities/payment.entity';
import { Order } from '../src/orders/entities/order.entity';
import { OrdersService } from '../src/orders/orders.service';

describe('POS flow API (e2e)', () => {
  let app: INestApplication;

  const paymentRepositoryMock = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const orderRepositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const ordersServiceMock = {
    update: jest.fn(),
  };

  const order = {
    id: 'o1',
    orderNumber: 'A-001',
    status: 'READY',
    orderType: 'DINE_IN',
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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        PaymentsController,
        TransactionsController,
        ReportsController,
      ],
      providers: [
        PaymentsService,
        TransactionsService,
        ReportsService,
        {
          provide: getRepositoryToken(Payment),
          useValue: paymentRepositoryMock,
        },
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

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('POST /api/v1/orders/:id/pay records a payment', async () => {
    orderRepositoryMock.findOne.mockResolvedValue({
      id: 'o1',
      orderNumber: 'A-001',
      store: { id: 's1' },
    });
    paymentRepositoryMock.findOne.mockResolvedValue(null);
    paymentRepositoryMock.create.mockImplementation((p) => p);
    paymentRepositoryMock.save.mockImplementation(async (p) => ({
      id: 'pay1',
      ...p,
    }));

    const response = await request(app.getHttpServer())
      .post('/api/v1/orders/o1/pay')
      .send({ method: PaymentMethod.QR, amount: 100 })
      .expect(201);

    expect(response.body.payment.receiptId).toBe('A-001');
    expect(response.body.payment.method).toBe(PaymentMethod.QR);
  });

  it('GET /api/v1/transactions?storeId= lists enriched orders', async () => {
    orderRepositoryMock.find.mockResolvedValue([order]);

    const response = await request(app.getHttpServer())
      .get('/api/v1/transactions')
      .query({ storeId: 's1' })
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].orderNumber).toBe('A-001');
    expect(response.body[0].items[0].name).toBe('Coffee');
  });

  it('GET /api/v1/transactions/:id returns a single transaction', async () => {
    orderRepositoryMock.findOne.mockResolvedValue(order);

    const response = await request(app.getHttpServer())
      .get('/api/v1/transactions/o1')
      .expect(200);

    expect(response.body.id).toBe('o1');
    expect(response.body.totalAmount).toBe(100);
  });

  it('PATCH /api/v1/transactions/:id updates an order', async () => {
    ordersServiceMock.update.mockResolvedValue(order);

    const response = await request(app.getHttpServer())
      .patch('/api/v1/transactions/o1')
      .send({ status: 'READY' })
      .expect(200);

    expect(ordersServiceMock.update).toHaveBeenCalledWith('o1', {
      status: 'READY',
    });
    expect(response.body.id).toBe('o1');
  });

  it('GET /api/v1/reports returns report data', async () => {
    paymentRepositoryMock.find.mockResolvedValue([]);

    const response = await request(app.getHttpServer())
      .get('/api/v1/reports')
      .query({ storeId: 's1', preset: 'today' })
      .expect(200);

    expect(response.body.summary.totalRevenue).toBe(0);
    expect(response.body.topProducts).toEqual([]);
  });
});
