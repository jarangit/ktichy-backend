import { Store } from '../../stores/entities/store.entity';
import { Station } from '../../stations/entities/station.entity';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { nanoid10 } from '../../utils/nanoid';

export enum DeviceStatus {
  UNPAIRED = 'UNPAIRED',
  PENDING = 'PENDING',
  PAIRED = 'PAIRED',
  DISABLED = 'DISABLED',
}

@Entity()
export class Device {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @ManyToOne(() => Station, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'station_id' })
  station: Station;

  @Column({ name: 'device_id', unique: true, type: 'varchar', length: 64 })
  deviceId: string;

  @Column({ name: 'store_id', type: 'varchar', length: 10, nullable: true })
  storeId?: string;

  @Column({ name: 'station_id', type: 'varchar', length: 10, nullable: true })
  stationId?: string;

  @Column({ nullable: true })
  alias?: string;

  @Column({ nullable: true })
  deviceName?: string;

  @Column({ nullable: true })
  fingerprint?: string;

  @Column({ name: 'app_version', nullable: true })
  appVersion?: string;

  @Column({
    type: 'enum',
    enum: DeviceStatus,
    default: DeviceStatus.UNPAIRED,
  })
  status: DeviceStatus;

  @Column({ name: 'last_seen_at', type: 'datetime', nullable: true })
  lastSeenAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = nanoid10();
  }
}
