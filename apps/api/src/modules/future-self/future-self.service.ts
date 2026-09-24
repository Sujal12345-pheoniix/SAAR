import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
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
    const data: Prisma.FutureSelfCreateInput = {
      user: { connect: { id: userId } },
      futureIdentity: dto.futureIdentity,
      horizonYears: dto.horizonYears ?? 5,
      desiredStates: (dto.desiredStates ?? {}) as unknown as Prisma.InputJsonValue,
      priorities: (dto.priorities ?? []) as unknown as Prisma.InputJsonValue,
      values: (dto.values ?? []) as unknown as Prisma.InputJsonValue,
      lifeAreaTargets: (dto.lifeAreaTargets ?? {}) as unknown as Prisma.InputJsonValue,
    };

    return this.prisma.futureSelf.upsert({
      where: { userId },
      update: {
        futureIdentity: data.futureIdentity,
        horizonYears: data.horizonYears,
        desiredStates: data.desiredStates,
        priorities: data.priorities,
        values: data.values,
        lifeAreaTargets: data.lifeAreaTargets,
      },
      create: data,
    });
  }
}
