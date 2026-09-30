import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import pino from 'pino';

// Safely resolve body parsers with fallback to bundled platform parser
type MiddlewareFn = (req: Request, res: Response, next: NextFunction) => void;
let jsonParser: ((options?: { limit?: string }) => MiddlewareFn) | undefined;
let urlencodedParser: ((options?: { extended?: boolean; limit?: string; parameterLimit?: number }) => MiddlewareFn) | undefined;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const express = require('express') as { json: typeof jsonParser; urlencoded: typeof urlencodedParser };
  jsonParser = express.json;
  urlencodedParser = express.urlencoded;
} catch {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bodyParser = require('body-parser') as { json: typeof jsonParser; urlencoded: typeof urlencodedParser };
    jsonParser = bodyParser.json;
    urlencodedParser = bodyParser.urlencoded;
  } catch {
    // NestJS default built-in body parsing remains active
  }
}

async function bootstrap(): Promise<void> {
  const logger = pino({
    level: process.env['LOG_LEVEL'] ?? 'info',
    transport:
      process.env['NODE_ENV'] !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // ── Trust Proxy ─────────────────────────────────────────────────────────────
  // Trust reverse proxy hops (e.g. Render, Cloudflare) for accurate client IP resolution
  const isProduction = process.env['NODE_ENV'] === 'production';
  const trustProxyEnv = process.env['TRUST_PROXY_HOPS'];
  const trustProxyHops: boolean | number =
    trustProxyEnv !== undefined
      ? trustProxyEnv === 'true'
        ? true
        : trustProxyEnv === 'false'
        ? false
        : parseInt(trustProxyEnv, 10)
      : isProduction
      ? 1
      : 0;
  app.set('trust proxy', trustProxyHops);

  // ── Request size limits ──────────────────────────────────────────────────────
  if (typeof jsonParser === 'function') {
    app.use(jsonParser({ limit: '1mb' }));
  }
  if (typeof urlencodedParser === 'function') {
    app.use(urlencodedParser({ extended: true, limit: '1mb', parameterLimit: 1000 }));
  }

  // ── Security headers ────────────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: isProduction
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
      noSniff: true,
      frameguard: { action: 'deny' },
    }),
  );

  // ── CORS ────────────────────────────────────────────────────────────────────
  const corsOriginsEnv = process.env['CORS_ALLOWED_ORIGINS'];
  const defaultDevOrigins = [
    'http://localhost:3000',
    'http://localhost:8081',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8081',
  ];
  const allowedOrigins = corsOriginsEnv
    ? corsOriginsEnv.split(',').map((o) => o.trim()).filter(Boolean)
    : (isProduction ? [] : defaultDevOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile native apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      if (!isProduction && allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 86400,
  });

  // ── X-Request-Id correlation ─────────────────────────────────────────────────
  const REQUEST_ID_REGEX = /^[A-Za-z0-9._-]{1,64}$/;
  app.use((req: Request, res: Response, next: NextFunction) => {
    const rawHeader = req.headers['x-request-id'];
    const requestId =
      typeof rawHeader === 'string' && REQUEST_ID_REGEX.test(rawHeader)
        ? rawHeader
        : uuidv4();
    (req as Request & { requestId: string }).requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  });

  // ── Global prefix & versioning ───────────────────────────────────────────────
  app.setGlobalPrefix('api', {
    exclude: ['/', 'health'],
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ── Validation pipe ───────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global exception filter ───────────────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  // ── Graceful shutdown & process exception handlers ───────────────────────────
  app.enableShutdownHooks();

  process.on('unhandledRejection', (reason: unknown) => {
    logger.fatal({ err: reason }, 'Unhandled Promise Rejection');
  });

  process.on('uncaughtException', (err: Error) => {
    logger.fatal({ err }, 'Uncaught Exception');
    process.exit(1);
  });

  const port = parseInt(
    process.env['PORT'] ?? process.env['API_PORT'] ?? '3001',
    10,
  );
  await app.listen(port, '0.0.0.0');

  logger.info({ port, env: process.env['NODE_ENV'] }, `SAAR API listening`);
}

bootstrap().catch((err: unknown) => {
  console.error('Fatal bootstrap error', err);
  process.exit(1);
});
