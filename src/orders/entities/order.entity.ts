import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { OrderItem } from '@entities/order-item.entity';
import { Restaurant } from '@entities/restaurant.entity';

export enum OrderStatus {
  NEW = 'NEW',
  PREPARING = 'PREPARING',
  READY = 'READY',
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

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

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.orders, {
    onDelete: 'CASCADE',
  })
  restaurant: Restaurant;

  // @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
  //   cascade: true,
  // })
  // items: OrderItem[];
}
