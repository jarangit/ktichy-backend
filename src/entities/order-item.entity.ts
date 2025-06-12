// src/orders/order-item.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, (order) => order.items)
  order: Order;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ['DRINK', 'FOOD', 'OTHER'],
  })
  type: 'DRINK' | 'FOOD' | 'OTHER';

  @Column({
    type: 'enum',
    enum: ['NEW', 'PREPARING', 'READY'],
    default: 'NEW',
  })
  status: 'NEW' | 'PREPARING' | 'READY';

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
