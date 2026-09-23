import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type { UpdatePreferencesDto } from './dto/update-preferences.dto';
import type { SafeUser, SafeProfile } from '../auth/auth.service';

function stripSensitive(user: {
  id: string;
  email: string;
  status: string;
  timezone: string;
  locale: string;
  createdAt: Date;
  updatedAt: Date;
  passwordHash: string;
  profile: {
    id: string;
    userId: string;
    displayName: string | null;
    avatarUrl: string | null;
    preferences: Prisma.JsonValue;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}): SafeUser {
  return {
    id: user.id,
    email: user.email,
    status: user.status,
    timezone: user.timezone,
    locale: user.locale,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    profile: user.profile
      ? {
          id: user.profile.id,
          userId: user.profile.userId,
          displayName: user.profile.displayName,
          avatarUrl: user.profile.avatarUrl,
          preferences: user.profile.preferences,
          createdAt: user.profile.createdAt,
          updatedAt: user.profile.updatedAt,
        }
      : null,
  };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Get current user ──────────────────────────────────────────────────────

  async getMe(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return stripSensitive(user);
  }

  // ── Update profile ────────────────────────────────────────────────────────

  async updateMe(userId: string, dto: UpdateProfileDto): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Update user-level fields (timezone, locale)
      const userUpdate: Prisma.UserUpdateInput = {};
      if (dto.timezone !== undefined) userUpdate.timezone = dto.timezone;
      if (dto.locale !== undefined) userUpdate.locale = dto.locale;

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: userUpdate,
        include: { profile: true },
      });

      // Update profile-level fields (displayName)
      if (dto.displayName !== undefined) {
        await tx.userProfile.upsert({
          where: { userId },
          update: { displayName: dto.displayName },
          create: { userId, displayName: dto.displayName },
        });
      }

      // Re-fetch with fresh profile
      return tx.user.findUniqueOrThrow({
        where: { id: userId },
        include: { profile: true },
      });
    });

    return stripSensitive(updated);
  }

  // ── Get preferences ───────────────────────────────────────────────────────

  async getPreferences(userId: string): Promise<Prisma.JsonValue> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { preferences: true },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile.preferences ?? {};
  }

  // ── Merge preferences ─────────────────────────────────────────────────────

  async updatePreferences(
    userId: string,
    dto: UpdatePreferencesDto,
  ): Promise<Prisma.JsonValue> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { preferences: true },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const existing =
      profile.preferences !== null &&
      typeof profile.preferences === 'object' &&
      !Array.isArray(profile.preferences)
        ? (profile.preferences as Record<string, unknown>)
        : {};

    const merged: Record<string, unknown> = {
      ...existing,
      ...dto.preferences,
    };

    const updated = await this.prisma.userProfile.update({
      where: { userId },
      data: { preferences: merged },
      select: { preferences: true },
    });

    return updated.preferences ?? {};
  }
}
