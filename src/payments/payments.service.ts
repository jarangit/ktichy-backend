import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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

  async pay(
    orderId: string,
    createPaymentDto: CreatePaymentDto,
  ): Promise<{ order: Order; payment: Payment }> {
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

    const isCash = createPaymentDto.method === PaymentMethod.CASH;
    const change = isCash
      ? Math.max(
          0,
          (createPaymentDto.receivedAmount ?? 0) - createPaymentDto.amount,
        )
      : 0;

    const payment = this.paymentRepository.create({
      order,
      store: order.store,
      method: createPaymentDto.method,
      amount: createPaymentDto.amount,
      receivedAmount: isCash ? (createPaymentDto.receivedAmount ?? null) : null,
      change: isCash ? change : 0,
      receiptId: order.orderNumber,
    });

    const saved = await this.paymentRepository.save(payment);

    return { order, payment: saved };
  }
}
