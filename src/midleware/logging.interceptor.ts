import { CallHandler, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { tap } from 'rxjs/operators';
import { nanoid16 } from '../utils/nanoid';

@Injectable()
export class LoggingInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler) {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const method = req.method;
    const url = req.url;
    const now = Date.now();
    const requestAt = new Date().toISOString();

    const controllerName = context.getClass()?.name;
    const handlerName = context.getHandler()?.name;
    const handler =
      controllerName && handlerName
        ? `${controllerName}.${handlerName}`
        : undefined;

    const forwardedFor = req.headers?.['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim()
        : req.ip;

    const userAgent = req.headers?.['user-agent'];

    const userId = req.user?.sub ?? req.user?.userId;
    const storeId = req.user?.storeId ?? req.user?.store_id;

    const incomingRequestId =
      req.headers?.['x-request-id'] || req.headers?.['x-correlation-id'];

    const requestId = incomingRequestId || `rq_${nanoid16()}`;
    try {
      res?.setHeader?.('x-request-id', requestId);
    } catch {
      // ignore
    }

    (req as any).requestId = requestId;

    const requestIdSuffix = requestId ? ` id=${requestId}` : '';

    const handlerSuffix = handler ? ` handler=${handler}` : '';
    const ipSuffix = ip ? ` ip=${ip}` : '';
    const userAgentSuffix = userAgent ? ` ua=${String(userAgent)}` : '';
    const userSuffix = userId ? ` userId=${userId}` : '';
    const storeSuffix = storeId ? ` storeId=${storeId}` : '';

    this.logger.log(
      `[REQ] ts=${requestAt} ${method} ${url}${requestIdSuffix}${handlerSuffix}${ipSuffix}${userSuffix}${storeSuffix}${userAgentSuffix}`,
    );
    return next
      .handle()
      .pipe(
        tap({
          next: () => {
            const durationMs = Date.now() - now;
            const statusCode = res?.statusCode;
            const responseAt = new Date().toISOString();
            this.logger.log(
              `[RES] ts=${responseAt} ${method} ${url} status=${statusCode} duration=${durationMs}ms req_ts=${requestAt}${requestIdSuffix}${handlerSuffix}${ipSuffix}${userSuffix}${storeSuffix}`,
            );
          },
          error: (err) => {
            const durationMs = Date.now() - now;
            const statusCode = res?.statusCode;
            const message = err?.message ?? String(err);
            const errorAt = new Date().toISOString();
            this.logger.error(
              `[ERR] ts=${errorAt} ${method} ${url} status=${statusCode} duration=${durationMs}ms req_ts=${requestAt}${requestIdSuffix}${handlerSuffix}${ipSuffix}${userSuffix}${storeSuffix} msg=${message}`,
              err?.stack,
            );
          },
        }),
      );
  }
}
