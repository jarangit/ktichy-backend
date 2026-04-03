// src/menu/menu.entity.ts
import { Store } from '../../entities/store.entity';
import { Station } from '../../entities/station.entity';
import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { nanoid10 } from '../../utils/nanoid';

@Entity()
export class Product {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @ManyToOne(() => Station, (station) => station.products, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  station: Station;

  @Column()
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id || !this.id.trim()) this.id = nanoid10();
  }
}
