import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { Payment, PaymentMethod } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const paymentRepositoryMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const orderRepositoryMock = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(Payment),
          useValue: paymentRepositoryMock,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('pay', () => {
    it('should throw NotFoundException when order does not exist', async () => {
      orderRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.pay('missing', { method: PaymentMethod.CASH, amount: 100 }),
      ).rejects.toThrow('Order #missing not found');
    });

    it('should throw BadRequestException when order already paid', async () => {
      orderRepositoryMock.findOne.mockResolvedValue({ id: 'o1' });
      paymentRepositoryMock.findOne.mockResolvedValue({ id: 'pay1' });

      await expect(
        service.pay('o1', { method: PaymentMethod.QR, amount: 100 }),
      ).rejects.toThrow('has already been paid');
    });

    it('should compute change and store receivedAmount for CASH', async () => {
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

      const result = await service.pay('o1', {
        method: PaymentMethod.CASH,
        amount: 500,
        receivedAmount: 1000,
      });

      expect(result.payment.receiptId).toBe('A-001');
      expect(result.payment.change).toBe(500);
      expect(result.payment.receivedAmount).toBe(1000);
      expect(result.payment.store).toEqual({ id: 's1' });
    });

    it('should keep change at 0 and receivedAmount null for QR', async () => {
      orderRepositoryMock.findOne.mockResolvedValue({
        id: 'o1',
        orderNumber: 'A-002',
        store: { id: 's1' },
      });
      paymentRepositoryMock.findOne.mockResolvedValue(null);
      paymentRepositoryMock.create.mockImplementation((p) => p);
      paymentRepositoryMock.save.mockImplementation(async (p) => ({
        id: 'pay2',
        ...p,
      }));

      const result = await service.pay('o1', {
        method: PaymentMethod.QR,
        amount: 300,
      });

      expect(result.payment.change).toBe(0);
      expect(result.payment.receivedAmount).toBeNull();
      expect(result.payment.method).toBe(PaymentMethod.QR);
    });
  });
});
