/**
 * Structured API error shapes and a comprehensive error code catalogue.
 * Consumed by both the HTTP layer (NestJS) and the frontend error handler.
 */

export enum ErrorCode {
  // Generic HTTP-level errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Auth-specific errors
  EMAIL_TAKEN = 'EMAIL_TAKEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_REVOKED = 'SESSION_REVOKED',
  TOKEN_INVALID = 'TOKEN_INVALID',

  // Resource-not-found errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  GOAL_NOT_FOUND = 'GOAL_NOT_FOUND',
  TASK_NOT_FOUND = 'TASK_NOT_FOUND',
  LIFE_AREA_NOT_FOUND = 'LIFE_AREA_NOT_FOUND',
  INSIGHT_NOT_FOUND = 'INSIGHT_NOT_FOUND',

  // Business rule violations
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  IDEMPOTENCY_CONFLICT = 'IDEMPOTENCY_CONFLICT',
}

/**
 * The canonical error payload embedded in every non-2xx API response body.
 */
export interface ApiError {
  /** Machine-readable error code. */
  code: ErrorCode;
  /** Human-readable message (safe to display). */
  message: string;
  /** Correlation ID for distributed tracing and support tickets. */
  requestId: string;
  /** Optional structured field-level or contextual details. */
  details?: Record<string, unknown>;
  /** Whether the caller may safely retry the request after a back-off. */
  retryable: boolean;
}

/**
 * Top-level shape of any error response body returned by the SAAR API.
 */
export interface ApiErrorResponse {
  error: ApiError;
}
