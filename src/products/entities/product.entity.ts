// src/menu/menu.entity.ts
import { Restaurant } from '../../entities/restaurant.entity';
import { Station } from '../../entities/station.entity';
import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { nanoid10 } from '../../utils/nanoid';

@Entity()
export class Product {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id: string;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  restaurant: Restaurant;

  @ManyToOne(() => Station, (station) => station.products, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  station: Station;

  @Column()
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id || !this.id.trim()) this.id = nanoid10();
  }
}
