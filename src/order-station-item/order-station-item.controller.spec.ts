import { Test, TestingModule } from '@nestjs/testing';
import { OrderStationItemController } from './order-station-item.controller';
import { OrderStationItemService } from './order-station-item.service';

describe('OrderStationItemController', () => {
  let controller: OrderStationItemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderStationItemController],
      providers: [OrderStationItemService],
    }).compile();

    controller = module.get<OrderStationItemController>(OrderStationItemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
