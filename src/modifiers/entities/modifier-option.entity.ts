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
import { ModifierGroup } from './modifier-group.entity';

@Entity()
export class ModifierOption {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id: string;

  @ManyToOne(() => ModifierGroup, (group) => group.options, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'modifierGroupId' })
  modifierGroup: ModifierGroup;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceAdjustment: number;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isAvailable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id || !this.id.trim()) this.id = nanoid10();
  }
}
