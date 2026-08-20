// src/orders/order-item.entity.ts
import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';
import { OrderStationItem } from '../../order-station-item/entities/order-station-item.entity';
import { nanoid10 } from '../../utils/nanoid';

@Entity()
export class OrderItem {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id: string;

  @Column({
    type: 'enum',
    enum: ['NEW', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'],
    default: 'NEW',
  })
  status: 'NEW' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

  @ManyToOne(() => Product)
  product: Product;

  @Column({ nullable: true })
  name: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value === null ? null : Number(value)),
    },
  })
  price: number;

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

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = nanoid10();
  }
}
