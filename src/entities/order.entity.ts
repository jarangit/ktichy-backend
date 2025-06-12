// src/orders/order.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Restaurant } from './restaurant.entity';

export enum OrderType {
  TOGO = 'TOGO',
  DINEIN = 'DINEIN',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETED',
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.orders)
  restaurant: Restaurant;

  @Column()
  orderNumber: string;

  @Column({
    type: 'enum',
    enum: ['NEW', 'PREPARING', 'READY'],
    default: 'NEW',
  })
  status: 'NEW' | 'PREPARING' | 'READY';

  @Column({ default: false })
  isArchived: boolean;

  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
