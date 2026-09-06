import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../payments/entities/payment.entity';

@Injectable()
export class PublicReceiptsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async findByToken(receiptToken: string) {
    const payment = await this.paymentRepository.findOne({
      where: { receiptToken },
      relations: ['store', 'order', 'order.items'],
    });

    if (!payment) {
      throw new HttpException(
        { code: 'RECEIPT_NOT_FOUND', message: 'Receipt not found' },
        HttpStatus.NOT_FOUND,
      );
    }

    if (payment.receiptExpiresAt.getTime() <= Date.now()) {
      throw new HttpException(
        {
          code: 'RECEIPT_EXPIRED',
          message: 'Receipt link has expired',
          expiredAt: payment.receiptExpiresAt,
        },
        HttpStatus.GONE,
      );
    }

    const order = payment.order;
    const items = order.items ?? [];
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0,
    );

    return {
      receiptId: payment.receiptId,
      receiptToken: payment.receiptToken,
      orderId: order.id,
      orderNumber: order.orderNumber,
      storeName: payment.store.name,
      status: order.status,
      orderType: order.orderType,
      tableNumber: order.tableNumber ?? undefined,
      items: items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price),
        total: Number(item.price) * item.quantity,
        note: item.notes ?? undefined,
      })),
      subtotal,
      totalAmount: Number(payment.amount),
      paymentMethod: payment.method,
      paidAt: payment.createdAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      expiresAt: payment.receiptExpiresAt,
    };
  }
}
