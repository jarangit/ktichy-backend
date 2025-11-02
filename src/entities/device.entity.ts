// generate device schema for my web I want to use can generate device id and device token
import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, ManyToOne } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Restaurant } from './restaurant.entity';

@Entity()
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  deviceId: string;

  @Column({ unique: true })
  deviceToken: string;

  @Column()
  name: string;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  restaurant: Restaurant;

  @BeforeInsert()
  generateIdentifiers() {
    // สร้าง device ID และ device token อัตโนมัติก่อนบันทึกข้อมูลลงในฐานข้อมูล
    this.deviceId = uuidv4();
    this.deviceToken = uuidv4();
  }
}
