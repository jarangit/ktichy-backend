// src/data-source.ts
import { Order } from './entities/order-entity';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'mysql', // ✅ ต้องใช้ 'mysql'
  port: Number(process.env.DB_PORT) || 3366,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  migrations: ['src/migrations/*.ts'],
  entities: [Order],
  synchronize: false,
});
