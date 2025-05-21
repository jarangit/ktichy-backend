// src/data-source.ts
import { DataSource } from 'typeorm';
import 'dotenv/config';
export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST, // ✅ ต้องใช้ 'mysql'
  port: Number(process.env.DB_PORT) || 3366,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  migrations: ['dist/db/migrations/*{.js}'],
  entities: ['dist/**/*.entity.js'],
  synchronize: false,
});
