import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Store } from '../stores/entities/store.entity';
import { ReportFilterDto } from './dto/report-filter.dto';

interface ReportItem {
  productId?: string;
  name?: string;
  price?: number;
  quantity: number;
  total: number;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  private async assertStoreOwnership(storeId: string, userId?: string) {
    if (!userId) return;
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });
    if (!store) {
      throw new BadRequestException(`Store #${storeId} not found`);
    }
    if (store.owner_id !== userId) {
      throw new BadRequestException(
        `User #${userId} is not the owner of store #${storeId}`,
      );
    }
  }

  async generate(filter: ReportFilterDto, userId?: string) {
    const { storeId } = filter;
    if (!storeId?.trim()) {
      throw new BadRequestException('storeId is required');
    }

    await this.assertStoreOwnership(storeId.trim(), userId);

    const { start, end } = this.resolveRange(filter);

    const transactions = await this.transactionRepository.find({
      where: {
        storeId: storeId.trim(),
        createdAt: Between(start, end),
      },
    });

    const summary = this.buildSummary(transactions);
    const topProducts = this.buildTopProducts(transactions);
    const paymentBreakdown = this.buildPaymentBreakdown(transactions);
    const deliveryProviderBreakdown =
      this.buildDeliveryProviderBreakdown(transactions);

    if (filter.preset === 'month') {
      const calendarDays = this.buildCalendarDays(transactions, start, end);
      return {
        summary,
        topProducts,
        paymentBreakdown,
        deliveryProviderBreakdown,
        calendarDays,
      };
    }

    return {
      summary,
      topProducts,
      paymentBreakdown,
      deliveryProviderBreakdown,
    };
  }

  private resolveRange(filter: ReportFilterDto): {
    start: Date;
    end: Date;
  } {
    const now = new Date();

    if (filter.preset === 'today') {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    if (filter.preset === 'week') {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    // month
    const [year, month] = (filter.month ?? this.currentMonth())
      .split('-')
      .map(Number);
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { start, end };
  }

  private currentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private buildSummary(transactions: Transaction[]) {
    const totalRevenue = transactions.reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0,
    );
    const deliveryRevenue = transactions
      .filter((t) => t.orderType === 'DELIVERY')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalOrders = transactions.length;

    return {
      totalRevenue: this.round2(totalRevenue),
      totalOrders,
      averageOrderValue: totalOrders
        ? this.round2(totalRevenue / totalOrders)
        : 0,
      deliveryRevenue: this.round2(deliveryRevenue),
    };
  }

  private buildTopProducts(transactions: Transaction[]) {
    const map = new Map<
      string,
      { productId: string; name: string; quantitySold: number; revenue: number }
    >();

    for (const t of transactions) {
      for (const item of (t.items ?? []) as ReportItem[]) {
        const id = item.productId ?? `unknown-${item.name}`;
        const current = map.get(id) ?? {
          productId: id,
          name: item.name ?? 'Unknown',
          quantitySold: 0,
          revenue: 0,
        };
        current.quantitySold += item.quantity ?? 0;
        current.revenue += Number(item.total ?? 0);
        map.set(id, current);
      }
    }

    return [...map.values()]
      .map((p) => ({ ...p, revenue: this.round2(p.revenue) }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);
  }

  private buildPaymentBreakdown(transactions: Transaction[]) {
    const map = new Map<string, number>();
    for (const t of transactions) {
      const method =
        t.method === 'DELIVERY_PLATFORM'
          ? (t.deliveryPlatform ?? 'DELIVERY_PLATFORM')
          : t.method;
      map.set(method, (map.get(method) ?? 0) + Number(t.amount || 0));
    }
    return [...map.entries()].map(([method, amount]) => ({
      method,
      amount: this.round2(amount),
    }));
  }

  private buildDeliveryProviderBreakdown(transactions: Transaction[]) {
    const map = new Map<
      string,
      { provider: string; amount: number; orders: number }
    >();

    for (const t of transactions) {
      if (t.orderType !== 'DELIVERY' || !t.deliveryPlatform) continue;
      const current = map.get(t.deliveryPlatform) ?? {
        provider: t.deliveryPlatform,
        amount: 0,
        orders: 0,
      };
      current.amount += Number(t.amount || 0);
      current.orders += 1;
      map.set(t.deliveryPlatform, current);
    }

    return [...map.values()].map((p) => ({
      ...p,
      amount: this.round2(p.amount),
    }));
  }

  private buildCalendarDays(
    transactions: Transaction[],
    start: Date,
    end: Date,
  ) {
    const days: {
      date: string;
      revenue: number;
      orders: number;
      hourlyOrders: { hour: number; orders: number }[];
      topProducts: {
        productId: string;
        name: string;
        quantitySold: number;
        revenue: number;
      }[];
      paymentBreakdown: { method: string; amount: number }[];
      deliveryProviderBreakdown: {
        provider: string;
        amount: number;
        orders: number;
      }[];
    }[] = [];

    const cursor = new Date(start);
    while (cursor <= end) {
      const dateKey = this.toDateKey(cursor);
      const dayTx = transactions.filter(
        (t) => this.toDateKey(new Date(t.createdAt)) === dateKey,
      );

      const summary = this.buildSummary(dayTx);
      const hourly = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        orders: dayTx.filter((t) => new Date(t.createdAt).getHours() === hour)
          .length,
      }));

      days.push({
        date: dateKey,
        revenue: summary.totalRevenue,
        orders: summary.totalOrders,
        hourlyOrders: hourly,
        topProducts: this.buildTopProducts(dayTx),
        paymentBreakdown: this.buildPaymentBreakdown(dayTx),
        deliveryProviderBreakdown: this.buildDeliveryProviderBreakdown(dayTx),
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return days;
  }

  private toDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
