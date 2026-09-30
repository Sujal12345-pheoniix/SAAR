import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../../database/prisma.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: {
    session: {
      findUnique: jest.Mock;
    };
  };
  let config: {
    getOrThrow: jest.Mock;
  };

  const validPayload = {
    sub: 'user-uuid-1',
    sid: 'session-uuid-1',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900,
    iss: 'saar-api',
    aud: 'saar-client',
    typ: 'access',
  };

  beforeEach(() => {
    prisma = {
      session: {
        findUnique: jest.fn(),
      },
    };
    config = {
      getOrThrow: jest.fn().mockReturnValue('test-jwt-secret-key-at-least-32-chars!'),
    };

    strategy = new JwtStrategy(
      config as unknown as ConfigService,
      prisma as unknown as PrismaService,
    );
  });

  it('validates active session and returns authenticated user context', async () => {
    prisma.session.findUnique.mockResolvedValueOnce({
      id: 'session-uuid-1',
      userId: 'user-uuid-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60000),
    });

    const result = await strategy.validate(validPayload);
    expect(result).toEqual({
      userId: 'user-uuid-1',
      sessionId: 'session-uuid-1',
    });
    expect(prisma.session.findUnique).toHaveBeenCalledWith({
      where: { id: 'session-uuid-1' },
    });
  });

  it('throws UnauthorizedException when sub or sid is missing', async () => {
    await expect(
      strategy.validate({ ...validPayload, sub: '' }),
    ).rejects.toThrow(new UnauthorizedException('Invalid token payload'));

    await expect(
      strategy.validate({ ...validPayload, sid: '' }),
    ).rejects.toThrow(new UnauthorizedException('Invalid token payload'));
  });

  it('throws UnauthorizedException when token type is not access', async () => {
    await expect(
      strategy.validate({ ...validPayload, typ: 'refresh' }),
    ).rejects.toThrow(new UnauthorizedException('Invalid token type'));
  });

  it('throws UnauthorizedException when session does not exist in database', async () => {
    prisma.session.findUnique.mockResolvedValueOnce(null);

    await expect(strategy.validate(validPayload)).rejects.toThrow(
      new UnauthorizedException('Session not found or invalid'),
    );
  });

  it('throws UnauthorizedException when session userId does not match token sub', async () => {
    prisma.session.findUnique.mockResolvedValueOnce({
      id: 'session-uuid-1',
      userId: 'different-user-uuid',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60000),
    });

    await expect(strategy.validate(validPayload)).rejects.toThrow(
      new UnauthorizedException('Session not found or invalid'),
    );
  });

  it('throws UnauthorizedException when session has been revoked', async () => {
    prisma.session.findUnique.mockResolvedValueOnce({
      id: 'session-uuid-1',
      userId: 'user-uuid-1',
      revokedAt: new Date(Date.now() - 5000),
      expiresAt: new Date(Date.now() + 60000),
    });

    await expect(strategy.validate(validPayload)).rejects.toThrow(
      new UnauthorizedException('Session has been revoked'),
    );
  });

  it('throws UnauthorizedException when session has expired', async () => {
    prisma.session.findUnique.mockResolvedValueOnce({
      id: 'session-uuid-1',
      userId: 'user-uuid-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() - 5000),
    });

    await expect(strategy.validate(validPayload)).rejects.toThrow(
      new UnauthorizedException('Session has expired'),
    );
  });
});
