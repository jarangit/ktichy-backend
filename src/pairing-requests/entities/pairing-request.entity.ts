import { Device } from '../../devices/entities/device.entity';
import { PairingCode } from '../../pairing-codes/entities/pairing-code.entity';
import { Restaurant } from '@entities/restaurant.entity';
import { Station } from '@entities/station.entity';
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

export enum PairingRequestStatus {
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'pairing_requests' })
export class PairingRequest {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id: string;

  @ManyToOne(() => PairingCode, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pairing_code_id' })
  pairingCode: PairingCode;

  @Column({ name: 'pairing_code_id', type: 'varchar', length: 10 })
  pairingCodeId: string;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Restaurant;

  @Column({ name: 'store_id', type: 'varchar', length: 10 })
  storeId: string;

  @ManyToOne(() => Station, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'station_id' })
  station: Station;

  @Column({ name: 'station_id', type: 'varchar', length: 10, nullable: true })
  stationId?: string;

  @ManyToOne(() => Device, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @Column({ name: 'device_id', type: 'varchar', length: 10 })
  deviceId: string;

  @Column({ name: 'requested_alias', nullable: true })
  requestedAlias?: string;

  @Column({ name: 'requested_fingerprint', nullable: true })
  requestedFingerprint?: string;

  @Column({ name: 'requested_app_version', nullable: true })
  requestedAppVersion?: string;

  @Column({
    type: 'enum',
    enum: PairingRequestStatus,
    default: PairingRequestStatus.WAITING_APPROVAL,
  })
  status: PairingRequestStatus;

  @Column({ name: 'approved_by', type: 'varchar', length: 10, nullable: true })
  approvedBy?: string;

  @Column({ name: 'approved_at', type: 'datetime', nullable: true })
  approvedAt?: Date;

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = nanoid10();
  }
}
