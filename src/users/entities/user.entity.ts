// src/users/user.entity.ts
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { Exclude } from 'class-transformer';
import { nanoid10 } from '../../utils/nanoid';

@Entity()
export class User {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id: string;

  @Column({ unique: true, nullable: true })
  email: string | null;

  @Column({ unique: true, nullable: true })
  phoneNumber: string | null;

  @Column({ select: false })
  @Exclude()
  passwordHash: string;

  // I want to add status  to the user entity to indicate if the user is active or not. This will be a boolean field that defaults to true.
  @Column({
    type: 'enum',
    enum: ['ACTIVE', 'PENDING', 'BLOCKED'],
    default: 'ACTIVE',
  })
  status: 'ACTIVE' | 'PENDING' | 'BLOCKED';

  @OneToMany(() => Store, (store) => store.owner)
  stores: Store[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = nanoid10();
  }
}
