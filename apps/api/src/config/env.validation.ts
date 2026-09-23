import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // ── Database ──────────────────────────────────────────────────────────────
  DATABASE_URL: Joi.string().uri().required(),

  // ── Redis ─────────────────────────────────────────────────────────────────
  REDIS_URL: Joi.string().uri().required(),

  // ── JWT ───────────────────────────────────────────────────────────────────
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.number().integer().positive().default(900),
  JWT_REFRESH_EXPIRES_IN: Joi.number()
    .integer()
    .positive()
    .default(2592000),

  // ── Server ────────────────────────────────────────────────────────────────
  API_PORT: Joi.number().integer().port().default(3001),
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'staging', 'production')
    .default('development'),

  // ── CORS ──────────────────────────────────────────────────────────────────
  CORS_ALLOWED_ORIGINS: Joi.string().default('http://localhost:3000'),

  // ── Logging ───────────────────────────────────────────────────────────────
  LOG_LEVEL: Joi.string()
    .valid('trace', 'debug', 'info', 'warn', 'error', 'fatal')
    .default('info'),

  // ── Rate Limiting ─────────────────────────────────────────────────────────
  THROTTLE_TTL: Joi.number().integer().positive().default(60000),
  THROTTLE_LIMIT: Joi.number().integer().positive().default(100),

  // ── Optional / Phase-stub fields (not required to boot) ───────────────────
  OBJECT_STORAGE_ENDPOINT: Joi.string().optional().allow(''),
  OBJECT_STORAGE_BUCKET: Joi.string().optional().allow(''),
  OBJECT_STORAGE_ACCESS_KEY: Joi.string().optional().allow(''),
  OBJECT_STORAGE_SECRET_KEY: Joi.string().optional().allow(''),
  OBJECT_STORAGE_REGION: Joi.string().optional().allow(''),
  AI_PROVIDER_API_KEY: Joi.string().optional().allow(''),
  AI_PROVIDER_BASE_URL: Joi.string().optional().allow(''),
  EMAIL_PROVIDER_API_KEY: Joi.string().optional().allow(''),
  EMAIL_FROM_ADDRESS: Joi.string().optional().allow(''),
  PUSH_PROVIDER_KEY: Joi.string().optional().allow(''),
  OTEL_SERVICE_NAME: Joi.string().optional().allow(''),
  OTEL_EXPORTER_OTLP_ENDPOINT: Joi.string().optional().allow(''),
});
