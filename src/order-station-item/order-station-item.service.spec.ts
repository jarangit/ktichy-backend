import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderStationItemService } from './order-station-item.service';
import { OrderStationItem } from './entities/order-station-item.entity';

describe('OrderStationItemService', () => {
  let service: OrderStationItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderStationItemService,
        {
          provide: getRepositoryToken(OrderStationItem),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<OrderStationItemService>(OrderStationItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
