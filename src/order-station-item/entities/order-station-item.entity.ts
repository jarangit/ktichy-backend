import { OrderItem } from '@entities/order-item.entity';
import { Station } from '@entities/station.entity';
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';

@Entity()
export class OrderStationItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Station)
  station: Station;

  @ManyToOne(() => OrderItem, (item) => item.stationItems, {
    onDelete: 'CASCADE',
  })
  orderItem: OrderItem;

  @Column({ default: 'pending' })
  status: 'pending' | 'complete';
}
