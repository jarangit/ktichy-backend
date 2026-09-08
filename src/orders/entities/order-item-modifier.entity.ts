import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { nanoid10 } from '../../utils/nanoid';
import { OrderItem } from './order-item.entity';

/**
 * Immutable snapshot of one selected modifier option at order time.
 * Keeps order history stable even if the group/option is renamed,
 * repriced, or deactivated later.
 */
@Entity()
export class OrderItemModifier {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id: string;

  @ManyToOne(() => OrderItem, (item) => item.modifiers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderItemId' })
  orderItem: OrderItem;

  @Column({ type: 'varchar', length: 10 })
  modifierGroupId: string;

  @Column({ type: 'varchar', length: 255 })
  modifierGroupName: string;

  @Column({ type: 'varchar', length: 10 })
  modifierOptionId: string;

  @Column({ type: 'varchar', length: 255 })
  modifierOptionName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceAdjustment: number;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = nanoid10();
  }
}
