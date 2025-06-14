// src/restaurants/restaurant.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Station } from './station.entity';
import { User } from './user.entity';
import { Order } from 'orders/entities/order.entity';

@Entity()
export class Restaurant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => User, (user) => user.restaurants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column()
  owner_id: number;

  @OneToMany(() => Station, (station) => station.restaurant)
  stations: Station[];

  @OneToMany(() => Order, (order) => order.restaurant)
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
