import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  deviceName: string;

  @Column()
  fingerprint: string;
}
