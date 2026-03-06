import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderStationItem } from '../order-station-item/entities/order-station-item.entity';

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {},
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: {},
        },
        {
          provide: getRepositoryToken(OrderStationItem),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
