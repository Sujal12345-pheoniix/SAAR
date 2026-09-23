import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { RequestWithId } from '../interceptors/request-id.interceptor';
import type { Logger as PinoLogger } from 'pino';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
    retryable: boolean;
  };
}

/**
 * Maps common HTTP status codes to semantic error codes.
 */
function statusToCode(status: number): string {
  const map: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_SERVER_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
  };
  return map[status] ?? 'INTERNAL_SERVER_ERROR';
}

function isRetryable(status: number): boolean {
  return status === 429 || status === 503 || status === 502;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly nestLogger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly pinoLogger?: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<RequestWithId>();
    const isProduction = process.env['NODE_ENV'] === 'production';

    const requestId = req.requestId ?? 'unknown';
    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred';
    let code = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = statusToCode(status);
      const responseBody = exception.getResponse();

      if (typeof responseBody === 'string') {
        message = responseBody;
      } else if (
        typeof responseBody === 'object' &&
        responseBody !== null &&
        'message' in responseBody
      ) {
        const msgField = (responseBody as { message: unknown }).message;
        message = Array.isArray(msgField)
          ? (msgField as string[]).join('; ')
          : String(msgField);
      }
    } else if (!isProduction) {
      // In non-prod: surface the raw error message for easier debugging
      if (exception instanceof Error) {
        message = exception.message;
      }
    }

    // Log: never log stack traces in production
    if (exception instanceof Error) {
      const logPayload = {
        requestId,
        status,
        message: exception.message,
        ...(isProduction ? {} : { stack: exception.stack }),
      };
      if (status >= 500) {
        this.nestLogger.error(logPayload);
      } else {
        this.nestLogger.warn(logPayload);
      }
    }

    const body: ErrorResponse = {
      error: {
        code,
        message,
        requestId,
        retryable: isRetryable(status),
      },
    };

    res.status(status).json(body);
  }
}
