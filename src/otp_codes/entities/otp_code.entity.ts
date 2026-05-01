import { PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

export class OtpCode {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string;
  @Column({ type: 'varchar', length: 20 })
  phoneNumber: string;

  @Column({ type: 'varchar' })
  codeHash: string;

  @Column({ type: 'varchar', default: 'REGISTER' })
  purpose: 'REGISTER' | 'LOGIN';

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ type: 'datetime', nullable: true })
  verifiedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;
}
