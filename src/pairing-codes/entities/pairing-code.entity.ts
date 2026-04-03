import { Store } from '@entities/store.entity';
import { Station } from '@entities/station.entity';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { nanoid10 } from '../../utils/nanoid';

export enum PairingCodeStatus {
  PENDING = 'PENDING',
  EXPIRED = 'EXPIRED',
  CLOSED = 'CLOSED',
}

@Entity()
@Index(['storeId'])
export class PairingCode {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  store: Store;

  @OneToOne(() => Station, (station) => station.pairingCodes, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  station: Station;

  @Column({ name: 'store_id', type: 'varchar', length: 10 })
  storeId: string;

  @Column({ name: 'station_id', type: 'varchar', length: 10, nullable: true })
  stationId: string;

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

  @Column({ name: 'created_by', type: 'varchar', length: 10 })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = nanoid10();
  }
}
