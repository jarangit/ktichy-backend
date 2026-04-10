import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { Store } from '../src/stores/entities/store.entity';
import { Station } from '../src/stations/entities/station.entity';
import { Product } from '../src/products/entities/product.entity';
import { Order } from '../src/orders/entities/order.entity';
import { OrderItem } from '../src/orders/entities/order-item.entity';
import { OrderStationItem } from '../src/order-station-item/entities/order-station-item.entity';

jest.setTimeout(30000);

describe('Orders Create API (e2e, real DB)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let userRepo: Repository<User>;
  let storeRepo: Repository<Store>;
  let stationRepo: Repository<Station>;
  let productRepo: Repository<Product>;
  let orderRepo: Repository<Order>;
  let orderItemRepo: Repository<OrderItem>;
  let orderStationItemRepo: Repository<OrderStationItem>;

  let seededUser: User;
  let seededStore: Store;
  let seededStation: Station;
  let seededProduct: Product;

  beforeAll(async () => {
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '3366';
    process.env.DB_USER = 'root';
    process.env.DB_PASS = 'password';
    process.env.DB_NAME = 'kitchy_db';

    const { AppModule } = await import('../src/app.module');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    dataSource = app.get(DataSource);
    userRepo = dataSource.getRepository(User);
    storeRepo = dataSource.getRepository(Store);
    stationRepo = dataSource.getRepository(Station);
    productRepo = dataSource.getRepository(Product);
    orderRepo = dataSource.getRepository(Order);
    orderItemRepo = dataSource.getRepository(OrderItem);
    orderStationItemRepo = dataSource.getRepository(OrderStationItem);
  });

  beforeEach(async () => {
    const unique = Date.now().toString().slice(-8);

    seededUser = await userRepo.save(
      userRepo.create({
        email: `orders-db-${unique}@test.local`,
        passwordHash: 'hash-for-test',
      }),
    );

    seededStore = await storeRepo.save(
      storeRepo.create({
        name: `Store-${unique}`,
        owner_id: seededUser.id,
      }),
    );

    seededStation = await stationRepo.save(
      stationRepo.create({
        name: 'Grill',
        color: 'blue',
        storeId: seededStore.id,
      }),
    );

    seededProduct = await productRepo.save(
      productRepo.create({
        name: `Product-${unique}`,
        store: seededStore,
        station: seededStation,
      }),
    );
  });

  afterEach(async () => {
    if (seededUser?.id) {
      // Deleting owner cascades to store, station, product, and created orders/items.
      await userRepo.delete(seededUser.id);
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('POST /api/v1/orders should persist order and related items to DB', async () => {
    const payload = {
      storeId: seededStore.id,
      orderNumber: `ORD-${Date.now()}`,
      products: [{ productId: seededProduct.id, quantity: 2 }],
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .send(payload)
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.orderNumber).toBe(payload.orderNumber);

    const savedOrder = await orderRepo.findOne({
      where: { id: response.body.id },
      relations: ['store', 'items', 'items.product', 'items.stationItems'],
    });

    expect(savedOrder).toBeTruthy();
    expect(savedOrder?.store?.id).toBe(seededStore.id);
    expect(savedOrder?.items).toHaveLength(1);
    expect(savedOrder?.items[0].product.id).toBe(seededProduct.id);
    expect(savedOrder?.items[0].quantity).toBe(2);
    expect(savedOrder?.items[0].stationItems).toHaveLength(1);
    expect(savedOrder?.items[0].stationItems[0].status).toBe('pending');

    const dbOrderItems = await orderItemRepo.find({
      where: { order: { id: response.body.id } },
      relations: ['order'],
    });
    expect(dbOrderItems.length).toBeGreaterThan(0);

    const dbStationItems = await orderStationItemRepo.find({
      where: { orderItem: { id: dbOrderItems[0].id } },
      relations: ['orderItem'],
    });
    expect(dbStationItems.length).toBeGreaterThan(0);
  });
});
