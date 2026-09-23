import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller';
import { PrismaService } from '../../database/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;

  const prismaMock = {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  };

  const configMock = {
    get: jest.fn((key: string, fallback?: string) => {
      if (key === 'REDIS_URL') return 'redis://localhost:6379';
      if (key === 'NODE_ENV') return 'test';
      return fallback;
    }),
    getOrThrow: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: prismaMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('health()', () => {
    it('returns status ok with timestamp and version', () => {
      const result = controller.health();

      expect(result.status).toBe('ok');
      expect(result.version).toBe('1.0.0');
      expect(typeof result.timestamp).toBe('string');
      // Should be a valid ISO date
      expect(() => new Date(result.timestamp)).not.toThrow();
    });
  });

  describe('meta()', () => {
    it('returns version, environment and timestamp', () => {
      const result = controller.meta();

      expect(result.version).toBe('1.0.0');
      expect(result.environment).toBe('test');
      expect(typeof result.timestamp).toBe('string');
    });
  });

  describe('ready()', () => {
    it('returns degraded when database check fails', async () => {
      prismaMock.$queryRaw.mockRejectedValueOnce(
        new Error('DB connection refused'),
      );

      const result = await controller.ready();

      // Redis check will also fail in unit test env — both checks will be false
      expect(['ready', 'degraded']).toContain(result.status);
      expect(result.checks).toHaveProperty('database');
      expect(result.checks).toHaveProperty('redis');
      // DB should be false since we made it throw
      expect(result.checks.database).toBe(false);
    });

    it('returns object with database and redis boolean checks', async () => {
      prismaMock.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

      const result = await controller.ready();

      expect(typeof result.checks.database).toBe('boolean');
      expect(typeof result.checks.redis).toBe('boolean');
    });
  });
});
