/**
 * Type-safe API client for SAAR.
 *
 * - Wraps native fetch; no axios.
 * - Attaches X-Request-Id (UUIDv4) to every request for distributed tracing.
 * - Sends cookies automatically (credentials: 'include') so the API's
 *   httpOnly session cookie is forwarded — no manual token management.
 * - Returns a discriminated union { ok: true, data } | { ok: false, error }.
 */

import type { ApiErrorResponse, ApiResult } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Browser-compatible UUIDv4 generator (no crypto dependency on server). */
function generateRequestId(): string {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------------------------------------------------------------------------
// Request / Response types
// ---------------------------------------------------------------------------

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface RequestOptions {
  /** Additional headers merged with defaults. */
  headers?: Record<string, string>;
  /** Request body — will be JSON-serialised. */
  body?: unknown;
  /** Abort signal for cancellation. */
  signal?: AbortSignal;
  /** Override `credentials`. Defaults to 'include'. */
  credentials?: RequestCredentials;
}

// ---------------------------------------------------------------------------
// ApiClient
// ---------------------------------------------------------------------------

export class ApiClient {
  private readonly configuredBaseUrl?: string;

  constructor(baseUrl?: string) {
    if (baseUrl) {
      this.configuredBaseUrl = baseUrl.replace(/\/$/, '');
    }
  }

  private get baseUrl(): string {
    if (this.configuredBaseUrl) {
      return this.configuredBaseUrl;
    }
    if (process.env['NEXT_PUBLIC_API_URL']) {
      return process.env['NEXT_PUBLIC_API_URL'].replace(/\/$/, '');
    }
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      return 'https://saar-a494.onrender.com/api/v1';
    }
    return 'http://localhost:3001/api/v1';
  }

  // ---- Core request method ------------------------------------------------

  private async request<T>(
    method: HttpMethod,
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiResult<T>> {
    const requestId = generateRequestId();
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Request-Id': requestId,
      ...options.headers,
    };

    const init: RequestInit = {
      method,
      headers,
      credentials: options.credentials ?? 'include',
      signal: options.signal,
    };

    if (options.body !== undefined) {
      init.body = JSON.stringify(options.body);
    }

    let response: Response;

    try {
      response = await fetch(url, init);
    } catch (networkError) {
      // Network-level failure (offline, DNS, etc.)
      const errorPayload: ApiErrorResponse = {
        statusCode: 0,
        error: {
          code: 'NETWORK_ERROR',
          message:
            networkError instanceof Error
              ? networkError.message
              : 'A network error occurred. Please check your connection.',
        },
        requestId,
      };
      return { ok: false, error: errorPayload };
    }

    // 204 No Content — success with no body
    if (response.status === 204) {
      return { ok: true, data: undefined as T, statusCode: 204 };
    }

    // Attempt to parse JSON body
    let body: unknown;
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      try {
        body = await response.json();
      } catch {
        body = null;
      }
    } else {
      body = await response.text();
    }

    if (response.ok) {
      // Extract `.data` from envelope if present, else return raw body
      const data =
        body !== null &&
        typeof body === 'object' &&
        'data' in (body as Record<string, unknown>)
          ? (body as { data: T }).data
          : (body as T);

      return { ok: true, data, statusCode: response.status };
    }

    // Error response
    const errorBody = body as Partial<ApiErrorResponse>;
    const errorPayload: ApiErrorResponse = {
      statusCode: response.status,
      requestId: errorBody.requestId ?? requestId,
      error: {
        code: errorBody.error?.code ?? 'UNKNOWN_ERROR',
        message:
          errorBody.error?.message ??
          `Request failed with status ${response.status}`,
        details: errorBody.error?.details,
      },
    };

    return { ok: false, error: errorPayload };
  }

  // ---- Public typed methods ------------------------------------------------

  /** HTTP GET */
  get<T>(path: string, options?: Omit<RequestOptions, 'body'>): Promise<ApiResult<T>> {
    return this.request<T>('GET', path, options);
  }

  /** HTTP POST */
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResult<T>> {
    return this.request<T>('POST', path, { ...options, body });
  }

  /** HTTP PATCH */
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResult<T>> {
    return this.request<T>('PATCH', path, { ...options, body });
  }

  /** HTTP PUT */
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResult<T>> {
    return this.request<T>('PUT', path, { ...options, body });
  }

  /** HTTP DELETE */
  delete<T>(path: string, options?: Omit<RequestOptions, 'body'>): Promise<ApiResult<T>> {
    return this.request<T>('DELETE', path, options);
  }
}

// ---------------------------------------------------------------------------
// Singleton — use this in Client Components
// ---------------------------------------------------------------------------

export const apiClient = new ApiClient();
