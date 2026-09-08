import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { nanoid10 } from '../../utils/nanoid';
import { Product } from '../../products/entities/product.entity';
import { ModifierGroup } from './modifier-group.entity';

@Entity()
@Unique(['product', 'modifierGroup'])
export class ProductModifierGroup {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => ModifierGroup, (group) => group.productModifierGroups, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'modifierGroupId' })
  modifierGroup: ModifierGroup;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id || !this.id.trim()) this.id = nanoid10();
  }
}
