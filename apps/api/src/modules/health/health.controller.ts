import { Controller, Get, OnModuleDestroy, VERSION_NEUTRAL } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import Redis from 'ioredis';

interface HealthResponse {
  status: 'ok';
  timestamp: string;
  version: string;
}

interface ReadyResponse {
  status: 'ready' | 'degraded';
  checks: {
    database: boolean;
    redis: boolean;
  };
}

interface MetaResponse {
  version: string;
  environment: string;
  timestamp: string;
}

@Controller({ version: [VERSION_NEUTRAL, '1'] })
export class HealthController implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const redisUrl = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.redis = new Redis(redisUrl, {
      lazyConnect: true,
      enableOfflineQueue: false,
      connectTimeout: 3000,
      commandTimeout: 3000,
      maxRetriesPerRequest: 0,
    });
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.redis.quit();
    } catch {
      this.redis.disconnect();
    }
  }

  /**
   * Root welcome endpoint
   */
  @Get()
  root(): { name: string; status: string; version: string } {
    return {
      name: 'SAAR API',
      status: 'online',
      version: '1.0.0',
    };
  }

  /**
   * Liveness probe — always returns 200 if the process is alive.
   * GET /health or /api/health or /api/v1/health
   */
  @Get('health')
  health(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  /**
   * Readiness probe — checks DB + Redis connectivity.
   * GET /ready
   */
  @Get('ready')
  async ready(): Promise<ReadyResponse> {
    const [dbOk, redisOk] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    return {
      status: dbOk && redisOk ? 'ready' : 'degraded',
      checks: {
        database: dbOk,
        redis: redisOk,
      },
    };
  }

  /**
   * API metadata.
   * GET /api/v1/meta
   */
  @Get('meta')
  meta(): MetaResponse {
    return {
      version: '1.0.0',
      environment: this.config.get<string>('NODE_ENV', 'development'),
      timestamp: new Date().toISOString(),
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async checkRedis(): Promise<boolean> {
    try {
      await this.redis.connect().catch(() => {
        // Already connected — ignore ECONNRESET on re-connect
      });
      const pong = await this.redis.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }
}
