import { Store } from '../../stores/entities/store.entity';
import {
  BeforeInsert,
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { nanoid10 } from '../../utils/nanoid';

@Entity()
export class Device {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  store: Store;

  @Column()
  deviceName: string;

  @Column()
  fingerprint: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = nanoid10();
  }
}
