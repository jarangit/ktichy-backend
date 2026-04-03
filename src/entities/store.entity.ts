import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { Station } from './station.entity';
import { User } from './user.entity';
import { Order } from '../orders/entities/order.entity';
import { nanoid10 } from '../utils/nanoid';

@Entity({ name: 'store' })
export class Store {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => User, (user) => user.stores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ type: 'varchar', length: 10 })
  owner_id: string;

  @OneToMany(() => Station, (station) => station.store)
  stations: Station[];

  @OneToMany(() => Order, (order) => order.store)
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = nanoid10();
  }
}
