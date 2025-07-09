import { Test, TestingModule } from '@nestjs/testing';
import { OrderStationItemService } from './order-station-item.service';

describe('OrderStationItemService', () => {
  let service: OrderStationItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderStationItemService],
    }).compile();

    service = module.get<OrderStationItemService>(OrderStationItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
