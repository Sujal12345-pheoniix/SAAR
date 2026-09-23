/**
 * @saar/config — typed environment configuration loader.
 *
 * Import `loadConfig` once at application bootstrap (NestJS main.ts / Express server.ts)
 * and pass the result down via DI or module initialisation.
 * Never import `process.env` directly elsewhere in backend packages.
 */

// ─── Config shape ─────────────────────────────────────────────────────────────

export interface JwtConfig {
  /** Secret used to sign / verify access tokens. */
  accessSecret: string;
  /** Secret used to sign / verify refresh tokens. */
  refreshSecret: string;
  /** Access token lifetime in seconds (default: 900 = 15 min). */
  accessExpiresIn: number;
  /** Refresh token lifetime in seconds (default: 2 592 000 = 30 days). */
  refreshExpiresIn: number;
}

export interface CorsConfig {
  /** List of allowed origins, e.g. `["https://app.saar.ai", "http://localhost:3000"]`. */
  allowedOrigins: string[];
}

export interface ThrottleConfig {
  /** Time-to-live window in milliseconds. */
  ttl: number;
  /** Maximum requests allowed within the TTL window. */
  limit: number;
}

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'staging' | 'production';
  /** Port the HTTP server listens on. */
  apiPort: number;
  /** Full PostgreSQL connection string. */
  databaseUrl: string;
  /** Full Redis connection string. */
  redisUrl: string;
  jwt: JwtConfig;
  cors: CorsConfig;
  throttle: ThrottleConfig;
  /** Pino / Winston log level, e.g. `"info"`, `"debug"`. */
  logLevel: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Asserts that an environment variable is present and non-empty.
 * Throws at startup rather than silently returning `undefined`.
 */
function requireEnv(key: string): string {
  const val = process.env[key];
  if (val === undefined || val === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

function parseIntEnv(key: string, defaultValue: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return defaultValue;
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid integer, got: "${raw}"`);
  }
  return parsed;
}

function parseNodeEnv(raw: string): AppConfig['nodeEnv'] {
  const allowed = ['development', 'test', 'staging', 'production'] as const;
  if ((allowed as readonly string[]).includes(raw)) {
    return raw as AppConfig['nodeEnv'];
  }
  throw new Error(
    `Invalid NODE_ENV value "${raw}". Must be one of: ${allowed.join(', ')}.`,
  );
}

// ─── Loader ───────────────────────────────────────────────────────────────────

/**
 * Reads, validates, and returns the full application configuration from `process.env`.
 *
 * Call once at bootstrap; store and distribute the returned object via DI.
 *
 * @throws {Error} When any required environment variable is missing or invalid.
 */
export function loadConfig(): AppConfig {
  return {
    nodeEnv: parseNodeEnv(process.env['NODE_ENV'] ?? 'development'),
    apiPort: parseIntEnv('API_PORT', 3001),
    databaseUrl: requireEnv('DATABASE_URL'),
    redisUrl: requireEnv('REDIS_URL'),
    jwt: {
      accessSecret: requireEnv('JWT_ACCESS_SECRET'),
      refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
      accessExpiresIn: parseIntEnv('JWT_ACCESS_EXPIRES_IN', 900),
      refreshExpiresIn: parseIntEnv('JWT_REFRESH_EXPIRES_IN', 2_592_000),
    },
    cors: {
      allowedOrigins: (process.env['CORS_ALLOWED_ORIGINS'] ?? 'http://localhost:3000')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    },
    throttle: {
      ttl: parseIntEnv('THROTTLE_TTL', 60_000),
      limit: parseIntEnv('THROTTLE_LIMIT', 100),
    },
    logLevel: process.env['LOG_LEVEL'] ?? 'info',
  };
}
