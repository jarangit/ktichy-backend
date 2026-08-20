import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  BeforeInsert,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { Store } from '../../stores/entities/store.entity';
import { nanoid10 } from '../../utils/nanoid';

export enum TransactionMethod {
  CASH = 'CASH',
  QR = 'QR',
  DELIVERY_PLATFORM = 'DELIVERY_PLATFORM',
}

export interface TransactionItemSnapshot {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  note?: string;
}

@Entity()
export class Transaction {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id: string;

  @OneToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'varchar', length: 10 })
  orderId: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @Column({ type: 'varchar', length: 10 })
  storeId: string;

  @Column({
    type: 'enum',
    enum: TransactionMethod,
  })
  method: TransactionMethod;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value === null ? null : Number(value)),
    },
  })
  amount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value === null ? null : Number(value)),
    },
  })
  receivedAmount?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value === null ? null : Number(value)),
    },
  })
  change?: number;

  @Column({ unique: true })
  receiptId: string;

  @Column()
  orderNumber: string;

  @Column({ nullable: true })
  orderType?: string;

  @Column({ nullable: true })
  tableNumber?: string;

  @Column({ nullable: true })
  customerName?: string;

  @Column({ nullable: true })
  deliveryPlatform?: string;

  @Column({ nullable: true })
  deliveryOrderNumber?: string;

  @Column({ type: 'json', nullable: true })
  items: TransactionItemSnapshot[];

  @Column({ type: 'varchar', length: 30, default: 'NEW' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = nanoid10();
  }
}
