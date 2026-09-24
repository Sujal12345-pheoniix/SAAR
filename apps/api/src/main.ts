import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import pino from 'pino';

async function bootstrap(): Promise<void> {
  const logger = pino({
    level: process.env['LOG_LEVEL'] ?? 'info',
    transport:
      process.env['NODE_ENV'] !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  });

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // ── Security headers ────────────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ────────────────────────────────────────────────────────────────────
  const corsOriginsEnv = process.env['CORS_ALLOWED_ORIGINS'];
  const allowedOrigins = corsOriginsEnv
    ? corsOriginsEnv.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'https://web-psi-three-58.vercel.app'];

  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        corsOriginsEnv === '*' ||
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app')
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  });

  // ── X-Request-Id correlation ─────────────────────────────────────────────────
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId =
      (req.headers['x-request-id'] as string | undefined) ?? uuidv4();
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

  // ── Graceful shutdown ─────────────────────────────────────────────────────────
  app.enableShutdownHooks();

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
