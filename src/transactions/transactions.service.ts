import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { Store } from '../stores/entities/store.entity';
import { nanoid16 } from '../utils/nanoid';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  private async assertStoreOwnership(storeId: string, userId?: string) {
    if (!userId) return;
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });
    if (!store) {
      throw new NotFoundException(`Store #${storeId} not found`);
    }
    if (store.owner_id !== userId) {
      throw new BadRequestException(
        `User #${userId} is not the owner of store #${storeId}`,
      );
    }
  }

  async createFromOrder(
    order: Order,
    dto: CreatePaymentDto,
  ): Promise<Transaction> {
    const existing = await this.transactionRepository.findOne({
      where: { orderId: order.id },
    });
    if (existing) {
      throw new BadRequestException(`Order #${order.id} has already been paid`);
    }

    const items = (order.items ?? []).map((item) => {
      const price = item.price ?? item.product?.price ?? 0;
      return {
        productId: item.product?.id,
        name: item.name ?? item.product?.name ?? 'Unknown',
        price,
        quantity: item.quantity,
        total: price * item.quantity,
        note: item.notes ?? undefined,
      };
    });

    const amount = dto.amount ?? items.reduce((sum, i) => sum + i.total, 0);
    const receivedAmount = dto.receivedAmount;
    const change =
      receivedAmount !== undefined && receivedAmount > amount
        ? Number((receivedAmount - amount).toFixed(2))
        : undefined;

    const transaction = this.transactionRepository.create({
      orderId: order.id,
      storeId: order.store?.id,
      method: dto.method,
      amount,
      receivedAmount,
      change,
      receiptId: `REC-${nanoid16()}`,
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      tableNumber: order.tableNumber,
      customerName: order.customerName,
      deliveryPlatform: order.deliveryPlatform,
      deliveryOrderNumber: order.deliveryOrderNumber,
      items,
      status: order.status,
    });

    return this.transactionRepository.save(transaction);
  }

  async findByStoreId(
    storeId: string,
    userId?: string,
  ): Promise<Transaction[]> {
    const normalizedStoreId = storeId?.trim();
    if (!normalizedStoreId) {
      throw new BadRequestException('storeId is required');
    }

    await this.assertStoreOwnership(normalizedStoreId, userId);

    return this.transactionRepository.find({
      where: { storeId: normalizedStoreId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId?: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['order'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction #${id} not found`);
    }

    await this.assertStoreOwnership(transaction.storeId, userId);

    return transaction;
  }

  async update(
    id: string,
    updateTransactionDto: UpdateTransactionDto,
    userId?: string,
  ): Promise<Transaction> {
    const transaction = await this.findOne(id, userId);
    const { products, ...fields } = updateTransactionDto;

    // Sync order side first
    if (
      fields.status ||
      fields.tableNumber ||
      fields.customerName ||
      products
    ) {
      const order = await this.orderRepository.findOne({
        where: { id: transaction.orderId },
        relations: ['items'],
      });
      if (!order) {
        throw new NotFoundException(`Order #${transaction.orderId} not found`);
      }

      if (fields.status) order.status = fields.status;
      if (fields.tableNumber !== undefined) {
        order.tableNumber = fields.tableNumber;
      }
      if (fields.customerName !== undefined) {
        order.customerName = fields.customerName;
      }

      if (products && products.length) {
        const existing = order.items.filter((item) => item.product?.id);
        for (const item of products) {
          const match = existing.find(
            (existingItem) => existingItem.product?.id === item.productId,
          );
          if (match) {
            match.quantity = item.quantity;
          } else {
            const product = await this.productRepository.findOne({
              where: { id: item.productId },
            });
            if (!product) {
              throw new NotFoundException(
                `Product #${item.productId} not found`,
              );
            }
            order.items.push(
              this.orderItemRepository.create({
                product,
                quantity: item.quantity,
                name: product.name,
                price: product.price,
              }),
            );
          }
        }
      }

      await this.orderRepository.save(order);
    }

    // Mirror changes onto the transaction snapshot
    Object.assign(transaction, {
      status: fields.status ?? transaction.status,
      tableNumber:
        fields.tableNumber !== undefined
          ? fields.tableNumber
          : transaction.tableNumber,
      customerName:
        fields.customerName !== undefined
          ? fields.customerName
          : transaction.customerName,
    });

    if (products && products.length) {
      transaction.items = products.map((item) => {
        const existing = transaction.items?.find(
          (snap) => snap.productId === item.productId,
        );
        const price = existing?.price ?? 0;
        return {
          productId: item.productId,
          name: existing?.name ?? 'Unknown',
          price,
          quantity: item.quantity,
          total: price * item.quantity,
          note: existing?.note,
        };
      });
    }

    return this.transactionRepository.save(transaction);
  }
}
