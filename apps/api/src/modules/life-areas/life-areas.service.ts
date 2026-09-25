import { Injectable, NotFoundException } from '@nestjs/common';
import type { LifeArea } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { CreateLifeAreaDto } from './dto/create-life-area.dto';
import type { UpdateLifeAreaDto } from './dto/update-life-area.dto';

const DEFAULT_LIFE_AREAS = [
  { type: 'health', title: 'Health', weight: 20 },
  { type: 'career', title: 'Career', weight: 20 },
  { type: 'relationships', title: 'Relationships', weight: 15 },
  { type: 'family', title: 'Family', weight: 15 },
  { type: 'personal_growth', title: 'Personal Growth', weight: 15 },
  { type: 'recovery_rest', title: 'Recovery / Rest', weight: 15 },
];

const SYSTEM_TYPES = new Set(['health', 'career', 'relationships', 'family', 'personal_growth', 'recovery_rest']);

@Injectable()
export class LifeAreasService {
  constructor(private readonly prisma: PrismaService) {}

  private mapLifeArea(area: LifeArea, overrideColor?: string) {
    return {
      ...area,
      name: area.title || area.type,
      color: overrideColor || '#6366f1',
      isSystem: SYSTEM_TYPES.has(area.type),
    };
  }

  async findAll(userId: string) {
    let areas = await this.prisma.lifeArea.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    if (areas.length === 0) {
      await this.prisma.lifeArea.createMany({
        data: DEFAULT_LIFE_AREAS.map((def) => ({
          userId,
          type: def.type,
          title: def.title,
          weight: def.weight,
        })),
      });

      areas = await this.prisma.lifeArea.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });
    }

    return areas.map((a) => this.mapLifeArea(a));
  }

  async create(userId: string, dto: CreateLifeAreaDto) {
    const rawTitle = (dto.title || dto.name || 'Untitled Area').trim();
    const rawType = (dto.type || rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'custom').trim();

    const created = await this.prisma.lifeArea.create({
      data: {
        userId,
        type: rawType,
        title: rawTitle,
        targetState: dto.targetState,
        weight: dto.weight !== undefined ? dto.weight : null,
      },
    });

    return this.mapLifeArea(created, dto.color);
  }

  async update(userId: string, id: string, dto: UpdateLifeAreaDto) {
    const existing = await this.prisma.lifeArea.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Life area not found');
    }

    const title = dto.title || dto.name;
    const updated = await this.prisma.lifeArea.update({
      where: { id },
      data: {
        ...(dto.type !== undefined ? { type: dto.type.trim() } : {}),
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(dto.targetState !== undefined ? { targetState: dto.targetState } : {}),
        ...(dto.weight !== undefined ? { weight: dto.weight } : {}),
      },
    });

    return this.mapLifeArea(updated, dto.color);
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.lifeArea.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Life area not found');
    }

    return this.prisma.lifeArea.delete({
      where: { id },
    });
  }
}
