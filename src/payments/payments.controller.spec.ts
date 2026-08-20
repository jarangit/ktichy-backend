import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentMethod } from './entities/payment.entity';

describe('PaymentsController', () => {
  let controller: PaymentsController;

  const paymentsServiceMock = {
    pay: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: paymentsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate pay to the service', () => {
    const dto = { method: PaymentMethod.QR, amount: 120 };
    controller.pay('o1', dto);
    expect(paymentsServiceMock.pay).toHaveBeenCalledWith('o1', dto);
  });
});
