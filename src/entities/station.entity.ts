// src/stations/station.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';

@Entity()
export class Station {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.stations)
  restaurant: Restaurant;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ['DRINK', 'FOOD', 'OTHER'],
  })
  type: 'DRINK' | 'FOOD' | 'OTHER';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
