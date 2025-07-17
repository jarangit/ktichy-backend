// src/orders/order-item.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { OrderStationItem } from 'order-station-item/entities/order-station-item.entity';

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ['NEW', 'PREPARING', 'READY'],
    default: 'NEW',
  })
  status: 'NEW' | 'PREPARING' | 'READY';

  @ManyToOne(() => Product)
  product: Product;

  @OneToMany(() => OrderStationItem, (osi) => osi.orderItem, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  stationItems: OrderStationItem[];

  @ManyToOne(() => Order, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  order: Order;

  @Column({ nullable: true })
  notes: string;

  @Column()
  quantity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
