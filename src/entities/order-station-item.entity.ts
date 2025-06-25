import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from "typeorm";
import { Station } from "./station.entity";
import { OrderItem } from "./order-item.entity";

@Entity()
export class OrderStationItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Station)
  station: Station;

  @ManyToOne(() => OrderItem, item => item.stationItems)
  orderItem: OrderItem;

  @Column({ default: 'pending' })
  status: 'pending' | 'complete';
}