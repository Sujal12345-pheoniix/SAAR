import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { HealthController } from './health.controller';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('Health (Integration)', () => {
  let app: INestApplication;

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

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: prismaMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /health returns 200 OK', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
        expect(res.body.version).toBe('1.0.0');
      });
  });

  it('GET /meta returns 200 OK', () => {
    return request(app.getHttpServer())
      .get('/meta')
      .expect(200)
      .expect((res) => {
        expect(res.body.version).toBe('1.0.0');
        expect(res.body.environment).toBe('test');
      });
  });
});
