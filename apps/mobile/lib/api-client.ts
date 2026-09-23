import { SecureStorage } from './secure-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

/** Simple UUID v4 generator that doesn't require a dependency. */
function generateRequestId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

/**
 * Internal — performs a token refresh and persists new tokens.
 * Returns true on success, false on failure.
 */
async function attemptTokenRefresh(): Promise<boolean> {
  const refreshToken = await SecureStorage.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': generateRequestId(),
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data: RefreshResponse = await res.json();
    await SecureStorage.setAccessToken(data.accessToken);
    await SecureStorage.setRefreshToken(data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

type FetchOptions = Omit<RequestInit, 'body'> & { body?: unknown };

/**
 * Core fetch wrapper.
 * - Attaches Authorization header from SecureStorage.
 * - Attaches X-Request-Id on every call.
 * - On 401: tries a single token refresh then retries.
 * - On second 401: clears tokens and throws.
 */
async function request<T>(
  path: string,
  options: FetchOptions = {},
  isRetry = false,
): Promise<T> {
  const accessToken = await SecureStorage.getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-Id': generateRequestId(),
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && !isRetry) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      return request<T>(path, options, true);
    }
    // Refresh failed — clear stored tokens so the app redirects to login
    await SecureStorage.clearTokens();
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      message = errBody?.message ?? message;
    } catch {
      /* ignore parse errors */
    }
    throw new ApiError(res.status, message);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as unknown as T;
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = {
  get<T>(path: string, options?: FetchOptions): Promise<T> {
    return request<T>(path, { ...options, method: 'GET' });
  },

  post<T>(path: string, body?: unknown, options?: FetchOptions): Promise<T> {
    return request<T>(path, { ...options, method: 'POST', body });
  },

  patch<T>(path: string, body?: unknown, options?: FetchOptions): Promise<T> {
    return request<T>(path, { ...options, method: 'PATCH', body });
  },

  delete<T>(path: string, options?: FetchOptions): Promise<T> {
    return request<T>(path, { ...options, method: 'DELETE' });
  },
};
