import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { UpsertFutureSelfDto } from './dto/upsert-future-self.dto';

@Injectable()
export class FutureSelfService {
  constructor(private readonly prisma: PrismaService) {}

  async getFutureSelf(userId: string) {
    return this.prisma.futureSelf.findUnique({
      where: { userId },
    });
  }

  async upsertFutureSelf(userId: string, dto: UpsertFutureSelfDto) {
    const data = {
      futureIdentity: dto.futureIdentity,
      horizonYears: dto.horizonYears ?? 5,
      desiredStates: (dto.desiredStates ?? {}) as any,
      priorities: (dto.priorities ?? []) as any,
      values: (dto.values ?? []) as any,
      lifeAreaTargets: (dto.lifeAreaTargets ?? {}) as any,
    };

    return this.prisma.futureSelf.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });
  }
}
