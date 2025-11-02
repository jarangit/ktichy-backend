// I want to create a device entity with properties like id, name, type, and status.
import { Restaurant } from '@entities/restaurant.entity';
import {
  Entity,
  PrimaryColumn,
  Column,
  BeforeInsert,
  ManyToOne,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import { nanoid10, nanoid16 } from 'utils/nanoid';

@Entity()
export class Device {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id: string;

  @Column({ unique: true })
  deviceId: string;

  @Column({ unique: true })
  deviceToken: string;

  @Column()
  name: string;

  // @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  // restaurant: Restaurant;

  @BeforeInsert()
  generateIdentifiers() {
    // สร้าง ID, device ID และ device token อัตโนมัติก่อนบันทึกข้อมูลลงในฐานข้อมูล
    // nanoid จะสร้าง ID ที่สั้นกว่า UUID แต่ยังปลอดภัย
    this.id = nanoid10(); // สั้นลง - 10 ตัวอักษร
    this.deviceId = nanoid10(); // deviceId สั้นลง - 10 ตัวอักษร
    this.deviceToken = nanoid16(); // token ยาวหน่อยเพื่อความปลอดภัย - 16 ตัวอักษร
  }
}
