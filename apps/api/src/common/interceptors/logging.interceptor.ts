import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Response } from 'express';
import type { RequestWithId } from './request-id.interceptor';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<RequestWithId>();
    const res = http.getResponse<Response>();

    const { method, url } = req;
    const requestId = req.requestId ?? 'unknown';
    const startAt = Date.now();

    // Strip sensitive headers before logging
    const safeHeaders = this.sanitizeHeaders(req.headers);

    this.logger.log({
      message: 'Incoming request',
      requestId,
      method,
      url,
      headers: safeHeaders,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startAt;
          this.logger.log({
            message: 'Request completed',
            requestId,
            method,
            url,
            statusCode: res.statusCode,
            durationMs: duration,
          });
        },
        error: (err: unknown) => {
          const duration = Date.now() - startAt;
          const statusCode =
            err instanceof Error && 'status' in err
              ? (err as { status: number }).status
              : 500;
          this.logger.error({
            message: 'Request failed',
            requestId,
            method,
            url,
            statusCode,
            durationMs: duration,
          });
        },
      }),
    );
  }

  private sanitizeHeaders(
    headers: Record<string, string | string[] | undefined>,
  ): Record<string, string | string[] | undefined> {
    const SENSITIVE = new Set(['authorization', 'cookie', 'set-cookie']);
    const safe: Record<string, string | string[] | undefined> = {};
    for (const [key, value] of Object.entries(headers)) {
      safe[key] = SENSITIVE.has(key.toLowerCase()) ? '[REDACTED]' : value;
    }
    return safe;
  }
}
