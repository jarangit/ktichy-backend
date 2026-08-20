import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { Payment } from '../payments/entities/payment.entity';
import { ReportPreset } from './dto/report-filter.dto';

describe('ReportsService', () => {
  let service: ReportsService;

  const paymentRepositoryMock = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(Payment),
          useValue: paymentRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getReportData', () => {
    it('should build summary, topProducts and paymentBreakdown', async () => {
      const now = new Date();
      paymentRepositoryMock.find.mockResolvedValue([
        {
          method: 'QR',
          amount: 200,
          createdAt: now,
          order: {
            id: 'o1',
            orderType: 'DELIVERY',
            deliveryPlatform: 'GrabFood',
            items: [
              {
                product: { id: 'p1' },
                name: 'Krapow',
                price: 100,
                quantity: 2,
              },
            ],
          },
        },
        {
          method: 'CASH',
          amount: 150,
          createdAt: now,
          order: {
            id: 'o2',
            orderType: 'DINE_IN',
            items: [
              {
                product: { id: 'p2' },
                name: 'Somtam',
                price: 150,
                quantity: 1,
              },
            ],
          },
        },
      ]);

      const result = await service.getReportData({
        storeId: 's1',
        preset: ReportPreset.TODAY,
      });

      expect(result.summary).toEqual({
        totalRevenue: 350,
        totalOrders: 2,
        averageOrderValue: 175,
        deliveryRevenue: 200,
      });
      expect(result.topProducts[0]).toEqual({
        productId: 'p1',
        name: 'Krapow',
        quantitySold: 2,
        revenue: 200,
      });
      expect(result.paymentBreakdown).toEqual([
        { method: 'QR', amount: 200 },
        { method: 'CASH', amount: 150 },
      ]);
      expect(result.calendarDays).toBeUndefined();
    });

    it('should build calendarDays for the month preset', async () => {
      paymentRepositoryMock.find.mockResolvedValue([]);

      const result = await service.getReportData({
        storeId: 's1',
        preset: ReportPreset.MONTH,
        month: '2026-08',
      });

      expect(Array.isArray(result.calendarDays)).toBe(true);
      expect(result.calendarDays).toHaveLength(31);
      expect(result.calendarDays[0].date).toBe('2026-08-01');
      expect(result.calendarDays[0].revenue).toBe(0);
      expect(result.calendarDays[0].hourlyOrders).toEqual([]);
    });

    it('should return zeroed summary when there are no payments', async () => {
      paymentRepositoryMock.find.mockResolvedValue([]);

      const result = await service.getReportData({
        storeId: 's1',
        preset: ReportPreset.WEEK,
      });

      expect(result.summary).toEqual({
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        deliveryRevenue: 0,
      });
      expect(result.topProducts).toEqual([]);
      expect(result.paymentBreakdown).toEqual([]);
    });
  });
});
