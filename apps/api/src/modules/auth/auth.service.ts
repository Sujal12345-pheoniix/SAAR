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
import { v4 as uuidv4 } from 'uuid';
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

  // Fast in-memory session revocation lookup (avoids per-request DB hit)
  private static readonly revokedSessionIds = new Set<string>();
  private static readonly revokedUserTimestamps = new Map<string, number>();

  public static isSessionRevoked(sessionId: string): boolean {
    return AuthService.revokedSessionIds.has(sessionId);
  }

  public static isUserRevokedSince(userId: string, tokenIssuedAtSeconds?: number): boolean {
    const revokedAtMs = AuthService.revokedUserTimestamps.get(userId);
    if (!revokedAtMs) return false;
    if (!tokenIssuedAtSeconds) return true;
    return (tokenIssuedAtSeconds * 1000) <= revokedAtMs;
  }

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

        const sessionId = uuidv4();
        const { rawToken, hash } = await this.generateRefreshToken(sessionId);
        const expiresAt = this.refreshExpiresAt();

        const newSession = await tx.session.create({
          data: {
            id: sessionId,
            userId: newUser.id,
            refreshHash: hash,
            tokenFamilyId: sessionId,
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
            metadata: { email: dto.email, sessionId },
          },
        });

        return { user: newUser, session: newSession, rawRefreshToken: rawToken };
      },
    );

    const tokens = this.signAccessToken(user.id, session.id, {
      email: user.email,
      displayName: dto.displayName ?? user.email.split('@')[0],
    });

    this.logger.log({ event: 'auth.register', userId: user.id, sessionId: session.id });

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

    const sessionId = uuidv4();
    const { rawToken, hash } = await this.generateRefreshToken(sessionId);
    const expiresAt = this.refreshExpiresAt();

    const session = await this.prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshHash: hash,
        tokenFamilyId: sessionId,
        expiresAt,
        userAgent: meta?.userAgent ?? null,
        ipAddress: meta?.ipAddress ?? null,
      },
    });

    await this.auditAuth('auth.login', user.id, { sessionId: session.id });

    const tokens = this.signAccessToken(user.id, session.id, {
      email: user.email,
      displayName: user.profile?.displayName ?? user.email.split('@')[0],
    });

    this.logger.log({ event: 'auth.login', userId: user.id, sessionId: session.id });

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
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Expected format: rt_<sessionId>.<secret>
    const match = rawRefreshToken.match(/^rt_([0-9a-fA-F-]+)\.(.+)$/);
    if (!match || !match[1] || !match[2]) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const sessionId = match[1];
    const secret = match[2];

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: { include: { profile: true } } },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // ── Token reuse detection ────────────────────────────────────────────────
    if (session.revokedAt !== null || session.rotatedAt !== null) {
      let isSecretMatch = false;
      try {
        isSecretMatch = await argon2.verify(session.refreshHash, secret);
      } catch {
        // Hash verification error
      }

      if (isSecretMatch) {
        // TOKEN REUSE DETECTED: This rotated/revoked token was presented again!
        // Immediately revoke the entire token family to protect user account
        const familyId = session.tokenFamilyId ?? session.id;
        await this.prisma.session.updateMany({
          where: {
            OR: [{ tokenFamilyId: familyId }, { id: familyId }],
            revokedAt: null,
          },
          data: { revokedAt: new Date() },
        });

        // Invalidate in-memory session cache as well
        AuthService.revokedSessionIds.add(session.id);

        await this.auditAuth('auth.refresh.reuse_detected', session.userId, {
          sessionId: session.id,
          tokenFamilyId: familyId,
        });

        this.logger.warn({
          event: 'auth.refresh.reuse_detected',
          sessionId: session.id,
          userId: session.userId,
          tokenFamilyId: familyId,
        });
      }

      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // ── Expiration check ─────────────────────────────────────────────────────
    if (session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // ── Hash verification ────────────────────────────────────────────────────
    const isValid = await argon2.verify(session.refreshHash, secret);
    if (!isValid) {
      await this.auditAuth('auth.refresh.failed', session.userId, { sessionId: session.id });
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // ── User account status check ────────────────────────────────────────────
    if (session.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    // ── Atomic rotation transaction ──────────────────────────────────────────
    const now = new Date();
    const newSessionId = uuidv4();
    const { rawToken: newRawToken, hash: newHash } =
      await this.generateRefreshToken(newSessionId);
    const newExpiresAt = this.refreshExpiresAt();
    const tokenFamilyId = session.tokenFamilyId ?? session.id;

    const newSession = await this.prisma.$transaction(async (tx) => {
      // Concurrency guard: only rotate if not already revoked or rotated
      const updateResult = await tx.session.updateMany({
        where: {
          id: session.id,
          revokedAt: null,
          rotatedAt: null,
        },
        data: {
          revokedAt: now,
          rotatedAt: now,
        },
      });

      if (updateResult.count === 0) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const created = await tx.session.create({
        data: {
          id: newSessionId,
          userId: session.userId,
          refreshHash: newHash,
          tokenFamilyId,
          expiresAt: newExpiresAt,
          userAgent: session.userAgent,
          ipAddress: session.ipAddress,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.userId,
          actorType: 'user',
          action: 'auth.refresh',
          entityType: 'Session',
          entityId: created.id,
          metadata: { previousSessionId: session.id, tokenFamilyId },
        },
      });

      return created;
    });

    const tokens = this.signAccessToken(newSession.userId, newSession.id, {
      email: session.user.email,
      displayName: session.user.profile?.displayName ?? session.user.email.split('@')[0],
    });

    this.logger.log({
      event: 'auth.refresh',
      userId: newSession.userId,
      newSessionId: newSession.id,
      tokenFamilyId,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: newRawToken,
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

    // Invalidate in memory cache immediately for zero-delay JWT revocation
    AuthService.revokedSessionIds.add(sessionId);

    await this.auditAuth('auth.logout', userId, { sessionId });
    this.logger.log({ event: 'auth.logout', userId, sessionId });
  }

  // ── Logout All ───────────────────────────────────────────────────────────

  async logoutAll(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Invalidate all tokens issued before now for this user
    AuthService.revokedUserTimestamps.set(userId, Date.now());

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

  // ── Get Current Session & User ───────────────────────────────────────────

  async getSession(userId: string, sessionId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.profile?.displayName ?? user.email.split('@')[0],
        createdAt: user.createdAt.toISOString(),
      },
      expiresAt: session?.expiresAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  // ── Get Authenticated User Profile (Bootstrap compatibility) ────────────

  async getMe(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return toSafeUser(user);
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private signAccessToken(
    userId: string,
    sessionId: string,
    claims?: { email?: string; displayName?: string },
  ): { accessToken: string } {
    const expiresIn = this.accessExpiresIn();
    const accessToken = this.jwt.sign(
      {
        sub: userId,
        sid: sessionId,
        iss: 'saar-api',
        aud: 'saar-client',
        typ: 'access',
        ...claims,
      },
      { expiresIn },
    );
    return { accessToken };
  }

  private async generateRefreshToken(sessionId: string): Promise<{
    rawToken: string;
    hash: string;
  }> {
    const secret = randomBytes(32).toString('hex');
    const rawToken = `rt_${sessionId}.${secret}`;
    const hash = await argon2.hash(secret, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
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
