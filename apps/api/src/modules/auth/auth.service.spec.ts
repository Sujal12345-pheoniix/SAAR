import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';

// ── Helpers ──────────────────────────────────────────────────────────────────

const NOW = new Date('2026-01-01T00:00:00Z');

const makeUser = (overrides: Partial<{
  id: string;
  email: string;
  passwordHash: string;
  status: string;
  timezone: string;
  locale: string;
  createdAt: Date;
  updatedAt: Date;
  profile: null;
}> = {}) => ({
  id: 'user-uuid-1',
  email: 'test@example.com',
  passwordHash: 'hashed',
  status: 'ACTIVE',
  timezone: 'Asia/Kolkata',
  locale: 'en-IN',
  createdAt: NOW,
  updatedAt: NOW,
  profile: null,
  ...overrides,
});

const makeSession = (overrides: Partial<{
  id: string;
  userId: string;
  refreshHash: string;
  revokedAt: null | Date;
  expiresAt: Date;
  userAgent: null;
  ipAddress: null;
  createdAt: Date;
  deviceId: null;
}> = {}) => ({
  id: 'session-uuid-1',
  userId: 'user-uuid-1',
  refreshHash: 'hashed-refresh',
  revokedAt: null,
  expiresAt: new Date(Date.now() + 86400000),
  userAgent: null,
  ipAddress: null,
  createdAt: NOW,
  deviceId: null,
  ...overrides,
});

// ── Mock builders ─────────────────────────────────────────────────────────────

function buildPrismaMock() {
  return {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn(),
  };
}

function buildJwtMock() {
  return {
    sign: jest.fn().mockReturnValue('mock.access.token'),
  };
}

function buildConfigMock() {
  return {
    get: jest.fn((key: string, fallback?: number) => {
      if (key === 'JWT_ACCESS_EXPIRES_IN') return 900;
      if (key === 'JWT_REFRESH_EXPIRES_IN') return 2592000;
      return fallback;
    }),
    getOrThrow: jest.fn(() => 'mock-secret-at-least-32-characters-long'),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof buildPrismaMock>;
  let jwtService: ReturnType<typeof buildJwtMock>;

  beforeEach(async () => {
    prisma = buildPrismaMock();
    jwtService = buildJwtMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: buildConfigMock() },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── register ──────────────────────────────────────────────────────────────

  describe('register', () => {
    const dto: RegisterDto = {
      email: 'alice@example.com',
      password: 'P@ssw0rd!',
      displayName: 'Alice',
    };

    it('creates user, session and returns tokens', async () => {
      const fakeUser = makeUser({ email: dto.email });
      const fakeSession = makeSession({ userId: fakeUser.id });

      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.$transaction.mockImplementation(
        async (fn: (tx: typeof prisma) => Promise<unknown>) => {
          return fn({
            ...prisma,
            user: {
              ...prisma.user,
              create: jest.fn().mockResolvedValue(fakeUser),
            },
            session: {
              ...prisma.session,
              create: jest.fn().mockResolvedValue(fakeSession),
            },
            auditLog: prisma.auditLog,
          });
        },
      );

      const result = await service.register(dto);

      expect(result.user.email).toBe(dto.email);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.session.accessToken).toBe('mock.access.token');
      expect(result.session.refreshToken).toBeDefined();
      expect(typeof result.session.refreshToken).toBe('string');
    });

    it('throws ConflictException when email already exists', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(makeUser());

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  // ── login ─────────────────────────────────────────────────────────────────

  describe('login', () => {
    const dto: LoginDto = {
      email: 'alice@example.com',
      password: 'P@ssw0rd!',
    };

    it('returns tokens on valid credentials', async () => {
      const hash = await argon2.hash(dto.password);
      const fakeUser = makeUser({ email: dto.email, passwordHash: hash });
      const fakeSession = makeSession({ userId: fakeUser.id });

      prisma.user.findUnique.mockResolvedValueOnce(fakeUser);
      prisma.session.create.mockResolvedValueOnce(fakeSession);

      const result = await service.login(dto);

      expect(result.user.email).toBe(dto.email);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.session.accessToken).toBe('mock.access.token');
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      const hash = await argon2.hash('correct-password');
      prisma.user.findUnique.mockResolvedValueOnce(
        makeUser({ email: dto.email, passwordHash: hash }),
      );

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when account is not ACTIVE', async () => {
      const hash = await argon2.hash(dto.password);
      prisma.user.findUnique.mockResolvedValueOnce(
        makeUser({ email: dto.email, passwordHash: hash, status: 'SUSPENDED' }),
      );

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── refresh ───────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('throws UnauthorizedException when token format is invalid', async () => {
      await expect(service.refresh('not-an-rt-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when session is not found', async () => {
      prisma.session.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.refresh('rt_00000000-0000-0000-0000-000000000001.secret123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rotates session and returns new compound tokens on valid token', async () => {
      const sessionId = '00000000-0000-0000-0000-000000000001';
      const secret = 'validsecret1234567890abcdef1234567890';
      const rawToken = `rt_${sessionId}.${secret}`;
      const hash = await argon2.hash(secret);
      const fakeUser = makeUser();
      const fakeSession = {
        ...makeSession({ id: sessionId, refreshHash: hash }),
        tokenFamilyId: sessionId,
        rotatedAt: null,
        user: { ...fakeUser, profile: null },
      };
      const newSession = {
        ...makeSession({ id: '00000000-0000-0000-0000-000000000002' }),
        tokenFamilyId: sessionId,
      };

      prisma.session.findUnique.mockResolvedValueOnce(fakeSession);
      prisma.$transaction.mockImplementation(
        async (fn: (tx: typeof prisma) => Promise<unknown>) => {
          return fn({
            ...prisma,
            session: {
              ...prisma.session,
              updateMany: jest.fn().mockResolvedValue({ count: 1 }),
              create: jest.fn().mockResolvedValue(newSession),
            },
            auditLog: prisma.auditLog,
          });
        },
      );

      const result = await service.refresh(rawToken);

      expect(result.accessToken).toBe('mock.access.token');
      expect(result.refreshToken).toMatch(/^rt_[0-9a-fA-F-]+\.[0-9a-fA-F]+$/);
    });

    it('detects token reuse and revokes entire token family', async () => {
      const sessionId = '00000000-0000-0000-0000-000000000001';
      const secret = 'compromised-secret-12345';
      const rawToken = `rt_${sessionId}.${secret}`;
      const hash = await argon2.hash(secret);
      const fakeUser = makeUser();

      // Session was ALREADY rotated 10 minutes ago
      const rotatedSession = {
        ...makeSession({ id: sessionId, refreshHash: hash }),
        tokenFamilyId: 'family-uuid-1',
        rotatedAt: new Date(Date.now() - 600000),
        revokedAt: new Date(Date.now() - 600000),
        user: { ...fakeUser, profile: null },
      };

      prisma.session.findUnique.mockResolvedValueOnce(rotatedSession);
      prisma.session.updateMany.mockResolvedValueOnce({ count: 3 });

      await expect(service.refresh(rawToken)).rejects.toThrow(
        UnauthorizedException,
      );

      // Verify that the entire token family was revoked in response to reuse
      expect(prisma.session.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { tokenFamilyId: 'family-uuid-1' },
              { id: 'family-uuid-1' },
            ],
            revokedAt: null,
          }),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });
  });

  // ── logout ────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('revokes the session', async () => {
      const fakeSession = makeSession();
      prisma.session.findFirst.mockResolvedValueOnce(fakeSession);
      prisma.session.update.mockResolvedValueOnce({
        ...fakeSession,
        revokedAt: new Date(),
      });

      await expect(
        service.logout('session-uuid-1', 'user-uuid-1'),
      ).resolves.toBeUndefined();

      expect(prisma.session.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'session-uuid-1' },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });

    it('throws NotFoundException when session does not belong to user', async () => {
      prisma.session.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.logout('session-uuid-1', 'user-uuid-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── getSessions ───────────────────────────────────────────────────────────

  describe('getSessions', () => {
    it('returns only active, non-expired sessions', async () => {
      const active = makeSession();
      prisma.session.findMany.mockResolvedValueOnce([active]);

      const result = await service.getSessions('user-uuid-1');

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('refreshHash');
    });

    it('returns empty array when no active sessions', async () => {
      prisma.session.findMany.mockResolvedValueOnce([]);

      const result = await service.getSessions('user-uuid-1');

      expect(result).toHaveLength(0);
    });
  });
});
