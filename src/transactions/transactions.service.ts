import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { And, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrdersService } from '../orders/orders.service';

export interface TransactionView {
  id: string;
  orderId: string;
  orderNumber: string;
  storeId?: string;
  status: string;
  type?: string;
  orderType?: string;
  tableNumber?: string | null;
  customerName?: string | null;
  deliveryPlatform?: string | null;
  deliveryOrderNumber?: string | null;
  isWaitingInStore?: boolean;
  method?: string | null;
  receiptId?: string | null;
  amount?: number | null;
  totalAmount: number;
  servedItemCount: number;
  totalItemCount: number;
  items: unknown[];
  products: unknown[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionListFilter {
  status?: string;
  flowStatus?: 'ALL' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  method?: string;
  startDate?: string;
  endDate?: string;
}

export interface TransactionCountsView {
  all: number;
  inProgress: number;
  done: number;
  cancelled: number;
}

const DONE_STATUSES = ['READY', 'COMPLETED'];

const toFlowStatus = (status: string): 'IN_PROGRESS' | 'DONE' | 'CANCELLED' => {
  if (status === 'CANCELLED') return 'CANCELLED';
  if (DONE_STATUSES.includes(status)) return 'DONE';
  return 'IN_PROGRESS';
};

const toTransactionView = (order: Order): TransactionView => {
  const items = (order.items ?? []).map((item) => {
    const price = Number(item.price ?? item.product?.price ?? 0);
    const quantity = item.quantity ?? 1;
    return {
      id: item.id,
      productId: item.product?.id,
      name: item.name ?? item.product?.name,
      price,
      quantity,
      total: price * quantity,
      note: item.notes ?? null,
    };
  });

  const payment = order.payments?.[0];
  const computedTotal = items.reduce((sum, item) => sum + item.total, 0);
  const totalItemCount = (order.items ?? []).reduce(
    (sum, item) => sum + (item.quantity ?? 0),
    0,
  );
  const servedItemCount = (order.items ?? []).reduce((sum, item) => {
    const isServed =
      (item.stationItems ?? []).length > 0 &&
      item.stationItems.every((stationItem) => stationItem.status === 'served');

    return sum + (isServed ? item.quantity ?? 0 : 0);
  }, 0);

  return {
    id: order.id,
    orderId: order.id,
    orderNumber: order.orderNumber,
    storeId: order.store?.id,
    status: order.status,
    type: order.orderType,
    orderType: order.orderType,
    tableNumber: order.tableNumber,
    customerName: order.customerName,
    deliveryPlatform: order.deliveryPlatform,
    deliveryOrderNumber: order.deliveryOrderNumber,
    isWaitingInStore: order.isWaitingInStore,
    method: payment?.method ?? null,
    receiptId: payment?.receiptId ?? null,
    amount: payment ? Number(payment.amount) : null,
    totalAmount: payment ? Number(payment.amount) : computedTotal,
    servedItemCount,
    totalItemCount,
    items,
    products: items,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly ordersService: OrdersService,
  ) {}

  async findByStoreId(
    storeId: string,
    filter: TransactionListFilter = {},
  ): Promise<TransactionView[]> {
    const where: Record<string, unknown> = { store: { id: storeId } };

    if (filter.startDate) {
      const start = MoreThanOrEqual(new Date(filter.startDate));
      const end = filter.endDate
        ? LessThanOrEqual(new Date(filter.endDate))
        : undefined;
      where.createdAt = end ? And(start, end) : start;
    } else if (filter.endDate) {
      where.createdAt = LessThanOrEqual(new Date(filter.endDate));
    }

    const orders = await this.orderRepository.find({
      where,
      relations: ['store', 'items', 'items.product', 'items.stationItems', 'payments'],
      order: { createdAt: 'DESC' },
    });

    let views = orders.map(toTransactionView);

    if (filter.method) {
      const method = filter.method.toUpperCase();
      views = views.filter((v) => v.method === method);
    }

    if (filter.status) {
      const status = filter.status.toUpperCase();
      views = views.filter((v) => v.status === status);
    }

    if (filter.flowStatus) {
      switch (filter.flowStatus) {
        case 'DONE':
          views = views.filter((v) => DONE_STATUSES.includes(v.status));
          break;
        case 'CANCELLED':
          views = views.filter((v) => v.status === 'CANCELLED');
          break;
        case 'IN_PROGRESS':
          views = views.filter(
            (v) => !DONE_STATUSES.includes(v.status) && v.status !== 'CANCELLED',
          );
          break;
        case 'ALL':
        default:
          break;
      }
    }

    return views;
  }

  async getCountsByStoreId(storeId: string): Promise<TransactionCountsView> {
    const orders = await this.orderRepository.find({
      where: { store: { id: storeId } },
      select: ['id', 'status'],
      relations: ['store'],
    });

    return orders.reduce<TransactionCountsView>(
      (counts, order) => {
        const flowStatus = toFlowStatus(order.status);
        counts.all += 1;
        if (flowStatus === 'IN_PROGRESS') counts.inProgress += 1;
        else if (flowStatus === 'DONE') counts.done += 1;
        else counts.cancelled += 1;
        return counts;
      },
      { all: 0, inProgress: 0, done: 0, cancelled: 0 },
    );
  }

  async findOne(id: string): Promise<TransactionView> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['store', 'items', 'items.product', 'items.stationItems', 'payments'],
    });

    if (!order) {
      throw new NotFoundException(`Transaction #${id} not found`);
    }

    return toTransactionView(order);
  }

  async update(id: string, updateDto: Record<string, unknown>) {
    const order = await this.ordersService.update(id, updateDto);
    return toTransactionView(order);
  }
}
