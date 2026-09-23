import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import type { Session, User, UserProfile, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';

// ── Response Types ───────────────────────────────────────────────────────────

export interface SafeUser {
  id: string;
  email: string;
  status: string;
  timezone: string;
  locale: string;
  createdAt: Date;
  updatedAt: Date;
  profile: SafeProfile | null;
}

export interface SafeProfile {
  id: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  preferences: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResult {
  user: SafeUser;
  session: TokenPair & { sessionId: string };
}

export interface SafeSession {
  id: string;
  userId: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
  createdAt: Date;
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function toSafeUser(
  user: User & { profile: UserProfile | null },
): SafeUser {
  return {
    id: user.id,
    email: user.email,
    status: user.status,
    timezone: user.timezone,
    locale: user.locale,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    profile: user.profile ? toSafeProfile(user.profile) : null,
  };
}

function toSafeProfile(p: UserProfile): SafeProfile {
  return {
    id: p.id,
    userId: p.userId,
    displayName: p.displayName,
    avatarUrl: p.avatarUrl,
    preferences: p.preferences,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

function toSafeSession(s: Session): SafeSession {
  return {
    id: s.id,
    userId: s.userId,
    userAgent: s.userAgent,
    ipAddress: s.ipAddress,
    expiresAt: s.expiresAt,
    createdAt: s.createdAt,
  };
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ── Register ──────────────────────────────────────────────────────────────

  async register(
    dto: RegisterDto,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await argon2.hash(dto.password);

    const { user, session, rawRefreshToken } = await this.prisma.$transaction(
      async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: dto.email,
            passwordHash,
            profile: {
              create: {
                displayName: dto.displayName ?? null,
              },
            },
          },
          include: { profile: true },
        });

        const { rawToken, hash } = await this.generateRefreshToken();
        const expiresAt = this.refreshExpiresAt();

        const newSession = await tx.session.create({
          data: {
            userId: newUser.id,
            refreshHash: hash,
            expiresAt,
            userAgent: meta?.userAgent ?? null,
            ipAddress: meta?.ipAddress ?? null,
          },
        });

        await tx.auditLog.create({
          data: {
            userId: newUser.id,
            actorType: 'user',
            action: 'auth.register',
            entityType: 'User',
            entityId: newUser.id,
            metadata: { email: dto.email },
          },
        });

        return { user: newUser, session: newSession, rawRefreshToken: rawToken };
      },
    );

    const tokens = this.signAccessToken(user.id, session.id);

    this.logger.log({ event: 'auth.register', userId: user.id });

    return {
      user: toSafeUser(user as User & { profile: UserProfile | null }),
      session: {
        sessionId: session.id,
        accessToken: tokens.accessToken,
        refreshToken: rawRefreshToken,
        expiresIn: this.accessExpiresIn(),
      },
    };
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  async login(
    dto: LoginDto,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { profile: true },
    });

    if (!user) {
      // Timing-safe: still run hash comparison
      await argon2.hash('dummy-timing-safe');
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      await this.auditAuth('auth.login.failed', user.id, { email: dto.email });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    const { rawToken, hash } = await this.generateRefreshToken();
    const expiresAt = this.refreshExpiresAt();

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshHash: hash,
        expiresAt,
        userAgent: meta?.userAgent ?? null,
        ipAddress: meta?.ipAddress ?? null,
      },
    });

    await this.auditAuth('auth.login', user.id, { sessionId: session.id });

    const tokens = this.signAccessToken(user.id, session.id);

    this.logger.log({ event: 'auth.login', userId: user.id });

    return {
      user: toSafeUser(user),
      session: {
        sessionId: session.id,
        accessToken: tokens.accessToken,
        refreshToken: rawToken,
        expiresIn: this.accessExpiresIn(),
      },
    };
  }

  // ── Refresh ───────────────────────────────────────────────────────────────

  async refresh(rawRefreshToken: string): Promise<TokenPair> {
    // Find all non-revoked, non-expired sessions and verify against each hash
    // We can't do a DB lookup by hash directly (it's argon2), so we load
    // candidate sessions by time window and verify.
    const now = new Date();

    // Limit candidates to reasonable window to avoid full-scan
    const candidates = await this.prisma.session.findMany({
      where: {
        revokedAt: null,
        expiresAt: { gt: now },
      },
      take: 200,
    });

    let matchedSession: Session | null = null;
    for (const s of candidates) {
      const ok = await argon2.verify(s.refreshHash, rawRefreshToken);
      if (ok) {
        matchedSession = s;
        break;
      }
    }

    if (!matchedSession) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate: revoke old session, create new one
    const { rawToken, hash } = await this.generateRefreshToken();
    const expiresAt = this.refreshExpiresAt();

    const newSession = await this.prisma.$transaction(async (tx) => {
      await tx.session.update({
        where: { id: matchedSession.id },
        data: { revokedAt: now },
      });

      const created = await tx.session.create({
        data: {
          userId: matchedSession.userId,
          refreshHash: hash,
          expiresAt,
          userAgent: matchedSession.userAgent,
          ipAddress: matchedSession.ipAddress,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: matchedSession.userId,
          actorType: 'user',
          action: 'auth.refresh',
          entityType: 'Session',
          entityId: created.id,
          metadata: { previousSessionId: matchedSession.id },
        },
      });

      return created;
    });

    const tokens = this.signAccessToken(newSession.userId, newSession.id);
    this.logger.log({
      event: 'auth.refresh',
      userId: newSession.userId,
      newSessionId: newSession.id,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: rawToken,
      expiresIn: this.accessExpiresIn(),
    };
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  async logout(sessionId: string, userId: string): Promise<void> {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    await this.auditAuth('auth.logout', userId, { sessionId });
    this.logger.log({ event: 'auth.logout', userId, sessionId });
  }

  // ── Logout All ───────────────────────────────────────────────────────────

  async logoutAll(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.auditAuth('auth.logout_all', userId, { count: result.count });
    this.logger.log({
      event: 'auth.logout_all',
      userId,
      revokedCount: result.count,
    });

    return { count: result.count };
  }

  // ── Get Sessions ─────────────────────────────────────────────────────────

  async getSessions(userId: string): Promise<SafeSession[]> {
    const now = new Date();
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map(toSafeSession);
  }

  // ── Revoke Session ───────────────────────────────────────────────────────

  async revokeSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }
    if (session.userId !== userId) {
      throw new ForbiddenException('You do not own this session');
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    await this.auditAuth('auth.revoke_session', userId, { sessionId });
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private signAccessToken(
    userId: string,
    sessionId: string,
  ): { accessToken: string } {
    const expiresIn = this.accessExpiresIn();
    const accessToken = this.jwt.sign(
      { sub: userId, sid: sessionId },
      { expiresIn },
    );
    return { accessToken };
  }

  private async generateRefreshToken(): Promise<{
    rawToken: string;
    hash: string;
  }> {
    const rawToken = randomBytes(48).toString('base64url');
    const hash = await argon2.hash(rawToken);
    return { rawToken, hash };
  }

  private refreshExpiresAt(): Date {
    const seconds = this.config.get<number>('JWT_REFRESH_EXPIRES_IN', 2592000);
    const d = new Date();
    d.setSeconds(d.getSeconds() + seconds);
    return d;
  }

  private accessExpiresIn(): number {
    return this.config.get<number>('JWT_ACCESS_EXPIRES_IN', 900);
  }

  private async auditAuth(
    action: string,
    userId: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          actorType: 'user',
          action,
          entityType: 'Session',
          metadata: metadata as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      // Audit failures must never break the auth flow
      this.logger.warn({ event: 'audit.write.failed', action, err });
    }
  }
}
