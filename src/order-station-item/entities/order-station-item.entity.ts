import { OrderItem } from '../../orders/entities/order-item.entity';
import { Station } from '../../stations/entities/station.entity';
import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  Column,
  BeforeInsert,
} from 'typeorm';
import { nanoid10 } from '../../utils/nanoid';

@Entity()
export class OrderStationItem {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id: string;

  @ManyToOne(() => Station)
  station: Station;

  @ManyToOne(() => OrderItem, (item) => item.stationItems, {
    onDelete: 'CASCADE',
  })
  orderItem: OrderItem;

  @Column({ default: 'pending' })
  status: 'pending' | 'complete';

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = nanoid10();
  }
}
