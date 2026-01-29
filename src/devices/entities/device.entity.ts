import { Restaurant } from '@entities/restaurant.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  store: Restaurant;

  @Column()
  deviceName: string;

  @Column()
  fingerprint: string;
}
