import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DatabaseExceptionFilter } from 'common/filters/db-exception.filter';
import './intrument';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // dev branch
  app.enableCors({
    origin: process.env.CLIENT_URL, // ✅ ใส่ origin ของ frontend
    credentials: true, // ถ้ามี cookie/session
  });
  app.useGlobalFilters(new DatabaseExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
