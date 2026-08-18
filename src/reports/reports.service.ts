import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { OrderType } from '../orders/entities/order.entity';
import { ReportFilterDto, ReportPreset } from './dto/report-filter.dto';

interface TopProduct {
  productId: string;
  name: string;
  quantitySold: number;
  revenue: number;
}

interface PaymentBreakdown {
  method: string;
  amount: number;
}

interface DeliveryProviderBreakdown {
  provider: string;
  amount: number;
  orders: number;
}

interface HourlyOrderPoint {
  hour: number;
  orders: number;
}

interface CalendarDay {
  date: string;
  revenue: number;
  orders: number;
  hourlyOrders: HourlyOrderPoint[];
  topProducts: TopProduct[];
  paymentBreakdown: PaymentBreakdown[];
  deliveryProviderBreakdown: DeliveryProviderBreakdown[];
}

const pad = (n: number) => String(n).padStart(2, '0');

const toDayKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const toHour = (d: Date) => d.getHours();

const sumAmount = (payments: Payment[]) =>
  payments.reduce((sum, p) => sum + Number(p.amount), 0);

function aggregateTopProducts(payments: Payment[]): TopProduct[] {
  const map = new Map<string, TopProduct>();
  for (const payment of payments) {
    for (const item of payment.order?.items ?? []) {
      const key = item.product?.id ?? item.name ?? 'unknown';
      const name = item.name ?? item.product?.name ?? `Product #${key}`;
      const price = Number(item.price ?? 0);
      const quantity = item.quantity ?? 1;
      const current = map.get(key) ?? {
        productId: key,
        name,
        quantitySold: 0,
        revenue: 0,
      };
      current.quantitySold += quantity;
      current.revenue += price * quantity;
      map.set(key, current);
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
}

function aggregatePaymentBreakdown(payments: Payment[]): PaymentBreakdown[] {
  const map = new Map<string, PaymentBreakdown>();
  for (const payment of payments) {
    const method = payment.method;
    const current = map.get(method) ?? { method, amount: 0 };
    current.amount += Number(payment.amount);
    map.set(method, current);
  }
  return [...map.values()];
}

function aggregateDeliveryProviders(
  payments: Payment[],
): DeliveryProviderBreakdown[] {
  const map = new Map<string, DeliveryProviderBreakdown>();
  for (const payment of payments) {
    if (payment.order?.orderType !== OrderType.DELIVERY) continue;
    const provider = payment.order.deliveryPlatform ?? 'Unknown';
    const current = map.get(provider) ?? { provider, amount: 0, orders: 0 };
    current.amount += Number(payment.amount);
    current.orders += 1;
    map.set(provider, current);
  }
  return [...map.values()];
}

function aggregateHourlyOrders(payments: Payment[]): HourlyOrderPoint[] {
  const map = new Map<number, number>();
  for (const payment of payments) {
    const hour = toHour(payment.createdAt);
    map.set(hour, (map.get(hour) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([hour, orders]) => ({ hour, orders }));
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async getReportData(filter: ReportFilterDto) {
    const { start, end } = this.resolveRange(filter.preset, filter.month);

    const payments = await this.paymentRepository.find({
      where: {
        store: { id: filter.storeId },
        status: PaymentStatus.PAID,
        createdAt: Between(start, end),
      },
      relations: ['order', 'order.items', 'order.items.product'],
    });

    const totalRevenue = sumAmount(payments);
    const paidOrderIds = new Set(
      payments.map((p) => p.order?.id).filter(Boolean),
    );
    const totalOrders = paidOrderIds.size;
    const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
    const deliveryRevenue = payments
      .filter((p) => p.order?.orderType === OrderType.DELIVERY)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const data: Record<string, unknown> = {
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        deliveryRevenue,
      },
      topProducts: aggregateTopProducts(payments),
      paymentBreakdown: aggregatePaymentBreakdown(payments),
    };

    if (filter.preset === ReportPreset.MONTH) {
      data.calendarDays = this.buildCalendarDays(payments, start, end);
    }

    return data;
  }

  private resolveRange(preset: ReportPreset, month?: string) {
    const now = new Date();

    if (preset === ReportPreset.TODAY) {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { start, end: now };
    }

    if (preset === ReportPreset.WEEK) {
      const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 6,
      );
      return { start, end: now };
    }

    const [year, mon] = (month ?? '').split('-').map(Number) as
      | [number, number]
      | [];
    const y = year ?? now.getFullYear();
    const m = mon ?? now.getMonth() + 1;
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);
    return { start, end };
  }

  private buildCalendarDays(
    payments: Payment[],
    start: Date,
    end: Date,
  ): CalendarDay[] {
    const byDay = new Map<string, Payment[]>();
    for (const payment of payments) {
      const key = toDayKey(payment.createdAt);
      const list = byDay.get(key) ?? [];
      list.push(payment);
      byDay.set(key, list);
    }

    const days: CalendarDay[] = [];
    const cursor = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
    );
    const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    while (cursor <= last) {
      const key = toDayKey(cursor);
      const dayPayments = byDay.get(key) ?? [];
      days.push({
        date: key,
        revenue: sumAmount(dayPayments),
        orders: new Set(dayPayments.map((p) => p.order?.id)).size,
        hourlyOrders: aggregateHourlyOrders(dayPayments),
        topProducts: aggregateTopProducts(dayPayments),
        paymentBreakdown: aggregatePaymentBreakdown(dayPayments),
        deliveryProviderBreakdown: aggregateDeliveryProviders(dayPayments),
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return days;
  }
}
