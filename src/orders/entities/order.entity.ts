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

  @Column({
    type: 'enum',
    enum: OrderType,
    nullable: true,
  })
  orderType?: OrderType;

  @Column({ nullable: true })
  tableNumber?: string;

  @Column({ nullable: true })
  customerName?: string;

  @Column({ nullable: true })
  deliveryPlatform?: string;

  @Column({ nullable: true })
  deliveryOrderNumber?: string;

  @Column({ default: false })
  isWaitingInStore?: boolean;

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

  // @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
  //   cascade: true,
  // })
  // items: OrderItem[];

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = nanoid10();
  }
}
