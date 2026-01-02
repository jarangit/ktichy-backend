import { CallHandler, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const method = req.method;
    const url = req.url;
    const now = Date.now();

    const requestId =
      req.headers?.['x-request-id'] || req.headers?.['x-correlation-id'];
    const requestIdSuffix = requestId ? ` id=${requestId}` : '';

    this.logger.log(`[REQ] ${method} ${url}${requestIdSuffix}`);
    return next
      .handle()
      .pipe(
        tap({
          next: () => {
            const durationMs = Date.now() - now;
            const statusCode = res?.statusCode;
            this.logger.log(
              `[RES] ${method} ${url} status=${statusCode} duration=${durationMs}ms${requestIdSuffix}`,
            );
          },
          error: (err) => {
            const durationMs = Date.now() - now;
            const statusCode = res?.statusCode;
            const message = err?.message ?? String(err);
            this.logger.error(
              `[ERR] ${method} ${url} status=${statusCode} duration=${durationMs}ms${requestIdSuffix} msg=${message}`,
              err?.stack,
            );
          },
        }),
      );
  }
}
