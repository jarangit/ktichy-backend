import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { toBangkokISOString } from '../../utils/date';

const isDate = (v: unknown): v is Date => v instanceof Date;

const convert = (value: unknown): unknown => {
  if (isDate(value)) {
    return toBangkokISOString(value);
  }
  if (Array.isArray(value)) {
    return value.map(convert);
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // keep raw Date conversion for known date fields, recurse otherwise
      out[k] = convert(v);
    }
    return out;
  }
  return value;
};

@Injectable()
export class BangkokDateInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => convert(data)));
  }
}
