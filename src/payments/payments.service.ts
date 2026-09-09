import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { CreatePaymentDto } from './dto/create-payment.dto';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  private toCents(value: number): number {
    return Math.round(Number(value) * 100);
  }

  private calculateOrderTotal(order: Order): number {
    const items = order.items ?? [];
    if (!items.length) {
      throw new BadRequestException(
        `Order #${order.id} has no items to pay for`,
      );
    }
    return items.reduce(
      (sum, item) => sum + Number(item.price ?? 0) * (item.quantity ?? 0),
      0,
    );
  }

  private createReceiptToken(): string {
    return `rcpt_${randomBytes(24).toString('base64url')}`;
  }

  private createReceiptExpiresAt(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return expiresAt;
  }

  private createReceiptUrl(receiptToken: string): string {
    const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173';
    return `${clientUrl.replace(/\/$/, '')}/receipt/${receiptToken}`;
  }

  async pay(
    orderId: string,
    createPaymentDto: CreatePaymentDto,
  ): Promise<{
    order: Order;
    payment: Payment;
    receipt: { token: string; url: string; expiresAt: Date };
  }> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['store', 'items'],
    });

    if (!order) {
      throw new NotFoundException(`Order #${orderId} not found`);
    }

    const existing = await this.paymentRepository.findOne({
      where: { order: { id: orderId }, status: PaymentStatus.PAID },
    });
    if (existing) {
      throw new BadRequestException(`Order #${orderId} has already been paid`);
    }

    // Backend-owned total: never trust the client amount.
    // OrderItem.price is already the final unit price snapshot
    // (base price + modifier adjustments) at order time.
    const expectedAmount = this.calculateOrderTotal(order);

    if (
      createPaymentDto.amount !== undefined &&
      this.toCents(createPaymentDto.amount) !== this.toCents(expectedAmount)
    ) {
      throw new BadRequestException(
        `Payment amount ${createPaymentDto.amount} does not match order total ${expectedAmount}`,
      );
    }

    const isCash = createPaymentDto.method === PaymentMethod.CASH;
    if (isCash && createPaymentDto.receivedAmount === undefined) {
      throw new BadRequestException(
        'receivedAmount is required for CASH payments',
      );
    }
    if (
      isCash &&
      this.toCents(createPaymentDto.receivedAmount ?? 0) <
        this.toCents(expectedAmount)
    ) {
      throw new BadRequestException(
        'receivedAmount must be greater than or equal to order total',
      );
    }

    const change = isCash
      ? (createPaymentDto.receivedAmount ?? 0) - expectedAmount
      : 0;

    const payment = this.paymentRepository.create({
      order,
      store: order.store,
      method: createPaymentDto.method,
      amount: expectedAmount,
      receivedAmount: isCash ? (createPaymentDto.receivedAmount ?? null) : null,
      change: isCash ? change : 0,
      receiptId: order.orderNumber,
      receiptToken: this.createReceiptToken(),
      receiptExpiresAt: this.createReceiptExpiresAt(),
    });

    const saved = await this.paymentRepository.save(payment);

    return {
      order,
      payment: saved,
      receipt: {
        token: saved.receiptToken,
        url: this.createReceiptUrl(saved.receiptToken),
        expiresAt: saved.receiptExpiresAt,
      },
    };
  }
}
