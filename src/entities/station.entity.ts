// src/stations/station.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';

@Entity()
export class Station {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.stations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @Column()
  restaurantId: number;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
