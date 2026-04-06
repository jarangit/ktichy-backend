// src/stations/station.entity.ts
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
  BeforeInsert,
  RelationId,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { Product } from '../../products/entities/product.entity';
import { OrderStationItem } from '../../order-station-item/entities/order-station-item.entity';
import { PairingCode } from '../../pairing-codes/entities/pairing-code.entity';
import { nanoid10 } from '../../utils/nanoid';
import { Device } from '../../devices/entities/device.entity';

@Entity()
export class Station {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id: string;

  @ManyToOne(() => Store, (store) => store.stations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'storeId' })
  store: Store;

  // Relation จริง: station ถือ FK ไปที่ device
  @ManyToOne(() => Device, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'device_id' })
  device?: Device;

  @OneToMany(() => Product, (product) => product.station, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  products: Product[];

  @OneToOne(() => PairingCode, (pairingCode) => pairingCode.station)
  pairingCodes: PairingCode;

  @OneToMany(
    () => OrderStationItem,
    (orderStationItem) => orderStationItem.station,
    {
      cascade: true,
      onDelete: 'CASCADE',
    },
  )
  orderStationItems: OrderStationItem[];

  @Column({ type: 'varchar', length: 10 })
  storeId: string;

  // อ่านค่า id ของ relation ได้ โดยไม่สร้างคอลัมน์ซ้ำ
  @RelationId((station: Station) => station.device)
  deviceId?: string;

  @Column()
  name: string;

  @Column()
  color: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = nanoid10();
  }
}
