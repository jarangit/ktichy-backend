import { Restaurant } from '@entities/restaurant.entity';
import { Station } from '@entities/station.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PairingCodeStatus {
  PENDING = 'PENDING',
  EXPIRED = 'EXPIRED',
  CLOSED = 'CLOSED',
}

@Entity()
@Index(['storeId'])
export class PairingCode {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  store: Restaurant;

  @OneToOne(() => Station, (station) => station.pairingCodes, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  station: Station;

  @Column({ name: 'store_id', type: 'int' })
  storeId: number;

  @Column({ name: 'station_id', type: 'int', nullable: true })
  stationId: number;

  @Column({ type: 'varchar', length: 32, unique: true })
  code: string;

  @Column({
    type: 'enum',
    enum: PairingCodeStatus,
    default: PairingCodeStatus.PENDING,
  })
  status: PairingCodeStatus;

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt?: Date;

  @Column({ name: 'created_by', type: 'int' })
  createdBy: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
