import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  BeforeInsert,
  JoinColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Store } from '../../stores/entities/store.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { nanoid10 } from '../../utils/nanoid';

export enum OrderStatus {
  NEW = 'NEW',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum OrderType {
  DINE_IN = 'DINE_IN',
  TOGO = 'TOGO',
  DELIVERY = 'DELIVERY',
}

@Entity()
export class Order {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id: string;

  @Column()
  orderNumber: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.NEW,
  })
  status: OrderStatus;

  @Column({ type: 'enum', enum: OrderType, default: OrderType.DINE_IN })
  orderType: OrderType;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tableNumber: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deliveryPlatform: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deliveryOrderNumber: string | null;

  @Column({ default: false })
  isWaitingInStore: boolean;

  @Column({ default: false })
  isArchived: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Store, (store) => store.orders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  items: OrderItem[];

  @OneToMany(() => Payment, (payment) => payment.order)
  payments: Payment[];

  // @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
  //   cascade: true,
  // })
  // items: OrderItem[];

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = nanoid10();
  }
}
