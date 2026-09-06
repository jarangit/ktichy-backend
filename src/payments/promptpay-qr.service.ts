import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as QRCode from 'qrcode';
import generatePayload from 'promptpay-qr';
import { Store } from '../stores/entities/store.entity';

export interface PromptpayQrResult {
  qrDataUrl: string | null;
  promptpayId: string | null;
  amount: number;
}

@Injectable()
export class PromptpayQrService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  async generate(
    storeId: string,
    amount: number,
    userId?: string,
  ): Promise<PromptpayQrResult> {
    const store = await this.storeRepository.findOne({
      where: userId ? { id: storeId, owner_id: userId } : { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found or you are not the owner');
    }

    const rawPromptpayId = store.settings?.promptpay;
    const promptpayId =
      typeof rawPromptpayId === 'string' ? rawPromptpayId.trim() : '';

    if (!promptpayId) {
      return { qrDataUrl: null, promptpayId: null, amount };
    }

    const payload = generatePayload(promptpayId, { amount });
    const qrDataUrl = await QRCode.toDataURL(payload, {
      width: 256,
      margin: 2,
    });

    return { qrDataUrl, promptpayId, amount };
  }
}
