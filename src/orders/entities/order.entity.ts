import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Store } from '../../stores/entities/store.entity';
import { nanoid10 } from '../../utils/nanoid';

export enum OrderStatus {
  NEW = 'NEW',
  PREPARING = 'PREPARING',
  READY = 'READY',
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

  @Column({ default: false })
  isArchived: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Store, (store) => store.orders, {
    onDelete: 'CASCADE',
  })
  restaurant: Store;

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
