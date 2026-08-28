import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DatabaseExceptionFilter } from './common/filters/db-exception.filter';
import './intrument';
import { ResponseInterceptor } from './common/interceptor/response.interceptor';
import { BangkokDateInterceptor } from './common/interceptor/bangkok-date.interceptor';
import { LoggingInterceptor } from './midleware/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  // dev branch
  app.enableCors({
    origin: process.env.CLIENT_URL, // ✅ ใส่ origin ของ frontend
    credentials: true, // ถ้ามี cookie/session
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new DatabaseExceptionFilter());
  app.useGlobalInterceptors(
    new BangkokDateInterceptor(),
    new ResponseInterceptor(),
    new LoggingInterceptor(),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
