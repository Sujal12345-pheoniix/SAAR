import { Injectable, Logger } from '@nestjs/common';

export interface ErrorContext {
  requestId?: string;
  traceId?: string;
  userId?: string;
  route?: string;
  method?: string;
  statusCode?: number;
  environment?: string;
  release?: string;
  extra?: Record<string, unknown>;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'newpassword',
  'confirmpassword',
  'token',
  'refreshtoken',
  'accesstoken',
  'authorization',
  'secret',
  'key',
]);

function sanitize(obj: unknown, depth = 0): unknown {
  if (depth > 4 || obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

@Injectable()
export class ErrorTrackerService {
  private readonly logger = new Logger('ErrorTracker');
  private readonly environment = process.env['NODE_ENV'] ?? 'development';
  private readonly release = process.env['npm_package_version'] ?? '0.1.0';

  captureException(error: unknown, context: ErrorContext = {}): void {
    const errObj = error instanceof Error ? error : new Error(String(error));
    const safeContext = sanitize({
      ...context,
      environment: context.environment ?? this.environment,
      release: context.release ?? this.release,
    }) as ErrorContext;

    this.logger.error({
      msg: 'Captured Exception',
      error: {
        name: errObj.name,
        message: errObj.message,
        stack: this.environment === 'production' ? undefined : errObj.stack,
      },
      ...safeContext,
    });
  }

  captureMessage(
    message: string,
    level: 'info' | 'warn' | 'error' = 'info',
    context: ErrorContext = {},
  ): void {
    const safeContext = sanitize({
      ...context,
      environment: context.environment ?? this.environment,
      release: context.release ?? this.release,
    }) as ErrorContext;

    const payload = { msg: message, ...safeContext };
    if (level === 'error') {
      this.logger.error(payload);
    } else if (level === 'warn') {
      this.logger.warn(payload);
    } else {
      this.logger.log(payload);
    }
  }
}

export const errorTracker = new ErrorTrackerService();
