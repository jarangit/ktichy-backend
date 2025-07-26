import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { SentryExceptionCaptured } from '@sentry/nestjs';
import { Response, Request } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class DatabaseExceptionFilter implements ExceptionFilter {
  @SentryExceptionCaptured()
  catch(exception: any, host: ArgumentsHost) {
    Sentry.captureException(exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const timestamp = new Date().toISOString();

    // ตรวจสอบ error จาก DB
    if (exception?.name?.includes('QueryFailedError')) {
      // แสดง error ที่แท้จริงจาก database
      response.status(400).json({
        statusCode: 400,
        error: 'Database Query Error',
        message: exception.message || 'Database query failed',
        sqlMessage: exception.sqlMessage || null,
        sqlCode: exception.code || null,
        timestamp,
        path: request.originalUrl,
      });
    } else if (
      exception?.message?.includes('ECONNREFUSED') ||
      exception?.message?.includes('Database not ready')
    ) {
      response.status(503).json({
        statusCode: 503,
        error: 'Service Unavailable',
        message: 'Database connection failed',
        details: exception.message,
        timestamp,
        path: request.originalUrl,
      });
    } else if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      response.status(status).json({
        statusCode: status,
        error: exception.name,
        message: typeof res === 'string' ? res : (res as any).message,
        timestamp,
        path: request.originalUrl,
      });
    } else {
      // แสดง error details ใน development
      const isDevelopment = process.env.NODE_ENV === 'development';

      response.status(500).json({
        statusCode: 500,
        error: 'Internal Server Error',
        message: isDevelopment ? exception.message : 'Internal server error',
        details: isDevelopment ? exception.stack : undefined,
        timestamp,
        path: request.originalUrl,
      });
    }
  }
}
