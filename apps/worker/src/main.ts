import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import pino from 'pino';

async function bootstrap(): Promise<void> {
  const logger = pino({
    level: process.env['LOG_LEVEL'] ?? 'info',
    transport:
      process.env['NODE_ENV'] !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  });

  logger.info('Initializing SAAR Background Worker...');

  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.enableShutdownHooks();

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Gracefully stopping worker services...`);
    try {
      await app.close();
      logger.info('Worker shutdown completed cleanly.');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during worker shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  logger.info('SAAR Background Worker active and listening to queues.');
}

bootstrap().catch((err: unknown) => {
  console.error('Fatal worker bootstrap error', err);
  process.exit(1);
});
