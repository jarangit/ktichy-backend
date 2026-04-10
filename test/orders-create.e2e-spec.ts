import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { OrdersController } from '../src/orders/orders.controller';
import { OrdersService } from '../src/orders/orders.service';
import { Order } from '../src/orders/entities/order.entity';
import { Product } from '../src/products/entities/product.entity';
import { OrderItem } from '../src/orders/entities/order-item.entity';
import { OrderStationItem } from '../src/order-station-item/entities/order-station-item.entity';
import { Store } from '../src/stores/entities/store.entity';
import { JwtAuthGuard } from '../src/auth/jwt-auth-guard';
import { JwtService } from '@nestjs/jwt';

describe('Orders Create API (e2e)', () => {
  let app: INestApplication;

  const orderRepositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
    manager: {
      findOne: jest.fn(),
    },
  };

  const productRepositoryMock = {
    findOne: jest.fn(),
  };

  const orderItemRepositoryMock = {
    create: jest.fn(),
  };

  const orderStationItemRepositoryMock = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepositoryMock,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: productRepositoryMock,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: orderItemRepositoryMock,
        },
        {
          provide: getRepositoryToken(OrderStationItem),
          useValue: orderStationItemRepositoryMock,
        },
        {
          provide: JwtAuthGuard,
          useValue: {
            canActivate: () => true,
          },
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
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

  it('POST /api/v1/orders should create order successfully', async () => {
    const store = { id: 'store123' } as Store;
    const station = { id: 'station123' } as any;
    const product = { id: 'product123', station } as Product;

    orderRepositoryMock.create.mockReturnValue({ items: [] });
    orderRepositoryMock.manager.findOne.mockResolvedValue(store);
    productRepositoryMock.findOne.mockResolvedValue(product);

    orderStationItemRepositoryMock.create.mockImplementation((payload) => ({
      id: 'osi123',
      ...payload,
    }));

    orderItemRepositoryMock.create.mockImplementation((payload) => ({
      id: 'item123',
      ...payload,
      stationItems: [],
    }));

    orderRepositoryMock.save.mockImplementation(async (payload) => ({
      id: 'order123',
      status: 'NEW',
      ...payload,
    }));

    const response = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .send({
        storeId: 'store123',
        orderNumber: 'A-001',
        products: [{ productId: 'product123', quantity: 2 }],
      })
      .expect(201);

    expect(response.body.id).toBe('order123');
    expect(response.body.orderNumber).toBe('A-001');
    expect(response.body.items).toHaveLength(1);
    expect(productRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: 'product123' },
      relations: ['station'],
    });
  });

  it('POST /api/v1/orders should return 400 when products is empty', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/orders')
      .send({
        storeId: 'store123',
        orderNumber: 'A-001',
        products: [],
      })
      .expect(400);
  });

  it('POST /api/v1/orders should return 400 when storeId is missing', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/orders')
      .send({
        orderNumber: 'A-001',
        products: [{ productId: 'product123', quantity: 1 }],
      })
      .expect(400);
  });

  it('POST /api/v1/orders should return 400 when productId or quantity is missing', async () => {
    orderRepositoryMock.create.mockReturnValue({ items: [] });
    orderRepositoryMock.manager.findOne.mockResolvedValue({ id: 'store123' });

    await request(app.getHttpServer())
      .post('/api/v1/orders')
      .send({
        storeId: 'store123',
        orderNumber: 'A-001',
        products: [{ productId: 'product123' }],
      })
      .expect(400);
  });
});
