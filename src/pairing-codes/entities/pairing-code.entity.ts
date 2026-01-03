import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
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
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ name: 'store_id', type: 'int' })
  storeId: number;

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
