import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { Store } from '../../stores/entities/store.entity';
import { nanoid10 } from '../../utils/nanoid';

export enum PaymentMethod {
  CASH = 'CASH',
  QR = 'QR',
  DELIVERY_PLATFORM = 'DELIVERY_PLATFORM',
}

export enum PaymentStatus {
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

@Entity()
export class Payment {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id: string;

  @ManyToOne(() => Order, (order) => order.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  receivedAmount: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  change: number | null;

  @Column({ type: 'varchar', length: 100 })
  receiptId: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PAID })
  status: PaymentStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = nanoid10();
  }
}
