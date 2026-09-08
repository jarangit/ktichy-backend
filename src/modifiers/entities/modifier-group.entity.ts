import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { nanoid10 } from '../../utils/nanoid';
import { Store } from '../../stores/entities/store.entity';
import { ModifierOption } from './modifier-option.entity';
import { ProductModifierGroup } from './product-modifier-group.entity';

export enum ModifierSelectionType {
  SINGLE = 'SINGLE',
  MULTIPLE = 'MULTIPLE',
}

@Entity()
export class ModifierGroup {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ModifierSelectionType,
    default: ModifierSelectionType.SINGLE,
  })
  selectionType: ModifierSelectionType;

  @Column({ type: 'int', default: 1 })
  minSelect: number;

  @Column({ type: 'int', default: 1 })
  maxSelect: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => ModifierOption, (option) => option.modifierGroup, {
    cascade: true,
  })
  options: ModifierOption[];

  @OneToMany(() => ProductModifierGroup, (link) => link.modifierGroup)
  productModifierGroups: ProductModifierGroup[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id || !this.id.trim()) this.id = nanoid10();
  }
}
