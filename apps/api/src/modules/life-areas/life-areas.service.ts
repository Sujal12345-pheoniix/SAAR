import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class LifeAreasService {
  constructor(private readonly prisma: PrismaService) {}

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

    return areas;
  }

  async create(userId: string, dto: CreateLifeAreaDto) {
    return this.prisma.lifeArea.create({
      data: {
        userId,
        type: dto.type,
        title: dto.title,
        targetState: dto.targetState,
        weight: dto.weight !== undefined ? dto.weight : null,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateLifeAreaDto) {
    const existing = await this.prisma.lifeArea.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Life area not found');
    }

    return this.prisma.lifeArea.update({
      where: { id },
      data: {
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.targetState !== undefined ? { targetState: dto.targetState } : {}),
        ...(dto.weight !== undefined ? { weight: dto.weight } : {}),
      },
    });
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
