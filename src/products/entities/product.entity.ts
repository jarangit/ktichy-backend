// src/menu/menu.entity.ts
import { Restaurant } from '../../entities/restaurant.entity';
import { Station } from '../../entities/station.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  restaurant: Restaurant;

  @ManyToOne(() => Station)
  station: Station;

  @Column()
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
