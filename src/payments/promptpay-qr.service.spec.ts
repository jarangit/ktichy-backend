import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PromptpayQrService } from './promptpay-qr.service';
import { Store } from '../stores/entities/store.entity';

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(async () => 'data:image/png;base64,FAKEQR'),
}));

jest.mock('promptpay-qr', () =>
  jest.fn(() => '00020101021129370016A000000677010111...'),
);

describe('PromptpayQrService', () => {
  let service: PromptpayQrService;
  const storeRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromptpayQrService,
        {
          provide: getRepositoryToken(Store),
          useValue: storeRepo,
        },
      ],
    }).compile();

    service = module.get<PromptpayQrService>(PromptpayQrService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('throws NotFoundException when the store is missing or not owned', async () => {
    storeRepo.findOne.mockResolvedValue(null);

    await expect(service.generate('store-1', 100, 'user-1')).rejects.toThrow(
      'Store not found or you are not the owner',
    );
    expect(storeRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'store-1', owner_id: 'user-1' },
    });
  });

  it('returns nulls when the store has no promptpay id', async () => {
    storeRepo.findOne.mockResolvedValue({
      id: 'store-1',
      settings: null,
    });

    const result = await service.generate('store-1', 100, 'user-1');

    expect(result).toEqual({
      qrDataUrl: null,
      promptpayId: null,
      amount: 100,
    });
  });

  it('returns a qr data url when the promptpay id is configured', async () => {
    storeRepo.findOne.mockResolvedValue({
      id: 'store-1',
      settings: { promptpay: ' 0812345678 ' },
    });

    const result = await service.generate('store-1', 100, 'user-1');

    expect(result.qrDataUrl).toBe('data:image/png;base64,FAKEQR');
    expect(result.promptpayId).toBe('0812345678');
    expect(result.amount).toBe(100);
  });
});
