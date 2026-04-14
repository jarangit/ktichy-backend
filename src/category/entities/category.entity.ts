import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { nanoid10 } from '../../utils/nanoid';
import { Store } from '../../stores/entities/store.entity';
import { Product } from '../../products/entities/product.entity';

@Entity()
@Index(['name', 'store'], { unique: true })
export class Category {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id: string;
  @BeforeInsert()
  generateId() {
    if (!this.id || !this.id.trim()) this.id = nanoid10();
  }

  @ManyToOne(() => Store, (store) => store.categories, { onDelete: 'CASCADE' })
  store: Store;

  @OneToMany(() => Product, (product) => product.parentCategory)
  products: Product[];

  @Column()
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
