/**
 * Type-safe API client for SAAR.
 *
 * - Wraps native fetch; no axios.
 * - Attaches X-Request-Id (UUIDv4) to every request for distributed tracing.
 * - Reads bearer token from localStorage or document.cookie and forwards
 *   Authorization: Bearer <token>
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

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Check localStorage first
  try {
    const token = localStorage.getItem('saar_token');
    if (token) return token;
  } catch {
    // Ignore storage errors
  }

  // 2. Check document.cookie fallback
  try {
    const match = document.cookie.match(/(?:^|;\s*)saar_session=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  } catch {
    // Ignore cookie errors
  }

  return null;
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

    if (!headers['Authorization']) {
      const token = getStoredToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 30000);
    const signal = options.signal ?? timeoutController.signal;

    const init: RequestInit = {
      method,
      headers,
      credentials: options.credentials ?? 'include',
      signal,
    };

    if (options.body !== undefined) {
      init.body = JSON.stringify(options.body);
    }

    let response: Response;

    try {
      response = await fetch(url, init);
    } catch (networkError: unknown) {
      clearTimeout(timeoutId);
      const isAbort = networkError instanceof Error && networkError.name === 'AbortError';
      const errorPayload: ApiErrorResponse = {
        statusCode: 0,
        error: {
          code: isAbort ? 'TIMEOUT_ERROR' : 'NETWORK_ERROR',
          message: isAbort
            ? 'The backend server is waking up from idle state. Please try again in a few seconds.'
            : (networkError instanceof Error
                ? networkError.message
                : 'A network error occurred. Please check your connection.'),
        },
        requestId,
      };
      return { ok: false, error: errorPayload };
    } finally {
      clearTimeout(timeoutId);
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
