import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import Redis from 'ioredis';

@Injectable()
export class ThrottlerStorageRedisService implements ThrottlerStorage, OnModuleDestroy {
  private readonly logger = new Logger(ThrottlerStorageRedisService.name);
  private readonly redis: Redis;

  constructor(redisOrUrl: Redis | string) {
    if (typeof redisOrUrl === 'string') {
      this.redis = new Redis(redisOrUrl, {
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
      });
    } else {
      this.redis = redisOrUrl;
    }
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const redisKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `throttle:block:${throttlerName}:${key}`;

    try {
      const isBlocked = await this.redis.get(blockKey);
      if (isBlocked) {
        const blockTtlMs = await this.redis.pttl(blockKey);
        const timeToBlockExpire = Math.ceil(Math.max(blockTtlMs, 0) / 1000);
        return {
          totalHits: limit + 1,
          timeToExpire: timeToBlockExpire,
          isBlocked: true,
          timeToBlockExpire,
        };
      }

      const results = await this.redis
        .multi()
        .incr(redisKey)
        .pttl(redisKey)
        .exec();

      if (!results) {
        throw new Error('Redis transaction returned null');
      }

      const totalHits = results[0][1] as number;
      let remainingTtlMs = results[1][1] as number;

      if (remainingTtlMs < 0) {
        await this.redis.pexpire(redisKey, ttl);
        remainingTtlMs = ttl;
      }

      if (totalHits > limit) {
        const blockMs = blockDuration > 0 ? blockDuration : ttl;
        await this.redis.set(blockKey, '1', 'PX', blockMs);
        return {
          totalHits,
          timeToExpire: Math.ceil(remainingTtlMs / 1000),
          isBlocked: true,
          timeToBlockExpire: Math.ceil(blockMs / 1000),
        };
      }

      return {
        totalHits,
        timeToExpire: Math.ceil(remainingTtlMs / 1000),
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    } catch (err) {
      this.logger.warn({ err }, 'Redis rate-limiting increment failed, allowing request');
      return {
        totalHits: 1,
        timeToExpire: Math.ceil(ttl / 1000),
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.redis.quit();
    } catch {
      this.redis.disconnect();
    }
  }
}
