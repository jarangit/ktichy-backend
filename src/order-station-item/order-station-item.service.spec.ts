import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderStationItemService } from './order-station-item.service';
import { OrderStationItem } from './entities/order-station-item.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { Order, OrderStatus } from '../orders/entities/order.entity';

describe('OrderStationItemService', () => {
  let service: OrderStationItemService;
  const orderStationItemRepository = {
    manager: {
      findOne: jest.fn(),
    },
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
  };
  const orderRepository = {
    save: jest.fn(),
  };
  const realtimeGateway = {
    emitOrderStationItemUpdated: jest.fn(),
    emitOrderUpdated: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderStationItemService,
        {
          provide: getRepositoryToken(OrderStationItem),
          useValue: orderStationItemRepository,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepository,
        },
        {
          provide: RealtimeGateway,
          useValue: realtimeGateway,
        },
      ],
    }).compile();

    service = module.get<OrderStationItemService>(OrderStationItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('marks order completed when the last station item is served', async () => {
    const order = {
      id: 'order-1',
      status: OrderStatus.READY,
      store: { id: 'store-1' },
    } as Order;
    const stationItem = {
      id: 'osi-1',
      status: 'complete',
      orderItem: { order },
    } as any;

    orderStationItemRepository.manager.findOne.mockResolvedValue({ id: 'station-1' });
    orderStationItemRepository.findOne.mockResolvedValue(stationItem);
    orderStationItemRepository.save.mockImplementation(async (value) => value);
    orderStationItemRepository.find.mockResolvedValue([
      {
        id: 'osi-1',
        status: 'served',
        orderItem: { order },
      },
      {
        id: 'osi-2',
        status: 'served',
        orderItem: { order },
      },
    ]);

    await service.update('osi-1', {
      status: 'served' as any,
      stationId: 'station-1',
      orderItemId: 'item-1',
    });

    expect(orderRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: OrderStatus.COMPLETED }),
    );
    expect(realtimeGateway.emitOrderUpdated).toHaveBeenCalledWith({
      orderId: 'order-1',
      storeId: 'store-1',
    });
  });

  it('does not complete order when any station item is not served', async () => {
    const order = {
      id: 'order-1',
      status: OrderStatus.READY,
      store: { id: 'store-1' },
    } as Order;
    const stationItem = {
      id: 'osi-1',
      status: 'complete',
      orderItem: { order },
    } as any;

    orderStationItemRepository.manager.findOne.mockResolvedValue({ id: 'station-1' });
    orderStationItemRepository.findOne.mockResolvedValue(stationItem);
    orderStationItemRepository.save.mockImplementation(async (value) => value);
    orderStationItemRepository.find.mockResolvedValue([
      {
        id: 'osi-1',
        status: 'served',
        orderItem: { order },
      },
      {
        id: 'osi-2',
        status: 'complete',
        orderItem: { order },
      },
    ]);

    await service.update('osi-1', {
      status: 'served' as any,
      stationId: 'station-1',
      orderItemId: 'item-1',
    });

    expect(orderRepository.save).not.toHaveBeenCalled();
    expect(realtimeGateway.emitOrderUpdated).not.toHaveBeenCalled();
  });
});
