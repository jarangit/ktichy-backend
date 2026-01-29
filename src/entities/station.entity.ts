// src/stations/station.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { Product } from '../products/entities/product.entity';
import { OrderStationItem } from '../order-station-item/entities/order-station-item.entity';
import { PairingCode } from '../pairing-codes/entities/pairing-code.entity';

@Entity()
export class Station {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.stations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @OneToMany(() => Product, (product) => product.station, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  products: Product[];

  @OneToOne(() => PairingCode, (pairingCode) => pairingCode.station)
  pairingCodes: PairingCode;

  @OneToMany(
    () => OrderStationItem,
    (orderStationItem) => orderStationItem.station,
    {
      cascade: true,
      onDelete: 'CASCADE',
    },
  )
  orderStationItems: OrderStationItem[];

  @Column()
  restaurantId: number;

  @Column()
  name: string;

  @Column()
  color: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
