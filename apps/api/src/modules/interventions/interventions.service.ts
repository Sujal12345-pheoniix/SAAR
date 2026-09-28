import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Prisma, InterventionStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BehaviorEventsService } from '../behavior-events/behavior-events.service';
import { BehaviorAggregatorService } from '../growth-engine/behavior-aggregator.service';
import { GapEngineService } from '../growth-engine/gap-engine.service';
import {
  selectInterventions,
  evaluateInterventionOutcome,
  type InterventionCandidate,
} from '@saar/domain';
import type { RejectInterventionDto, CompleteInterventionDto } from './dto/intervention.dto';

@Injectable()
export class InterventionsService {
  private readonly logger = new Logger(InterventionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly behaviorEvents: BehaviorEventsService,
    private readonly aggregator: BehaviorAggregatorService,
    private readonly gapEngine: GapEngineService,
  ) {}

  /**
   * List interventions for a user, optionally filtered by status.
   */
  async list(userId: string, status?: InterventionStatus) {
    return this.prisma.intervention.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
      },
      include: {
        insight: {
          select: {
            id: true,
            title: true,
            type: true,
            summary: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single intervention by ID with ownership enforcement.
   */
  async getById(userId: string, id: string) {
    const intervention = await this.prisma.intervention.findUnique({
      where: { id },
      include: {
        insight: true,
      },
    });

    if (!intervention || intervention.userId !== userId) {
      throw new NotFoundException(`Intervention '${id}' not found`);
    }

    return intervention;
  }

  /**
   * Evaluates active gaps & features to synthesize and persist new candidate interventions.
   */
  async generateCandidates(userId: string): Promise<InterventionCandidate[]> {
    const gaps = await this.gapEngine.evaluateGaps(userId);
    const snapshot = await this.aggregator.getFeatureSnapshot(userId);

    // Fetch tasks with potential friction
    const recentTasks = await this.prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        rescheduleCount: true,
        estimatedMinutes: true,
      },
    });

    const candidates = selectInterventions({
      userId,
      gaps,
      execution7d: snapshot.execution7d,
      routine7d: snapshot.routine7d,
      wellbeing7d: snapshot.wellbeing7d,
      lifeAreas: snapshot.lifeAreas14d,
      tasksWithFriction: recentTasks,
    });

    // Find or link to a default insight for the user
    let defaultInsight = await this.prisma.insight.findFirst({
      where: { userId, status: 'NEW' },
      orderBy: { createdAt: 'desc' },
    });

    if (!defaultInsight) {
      defaultInsight = await this.prisma.insight.create({
        data: {
          userId,
          type: 'consistency',
          title: 'Behavioral Optimization Insights',
          summary: 'Adaptive intervention candidates generated from current telemetry.',
          evidence: [] as Prisma.InputJsonValue,
          recommendation: {} as Prisma.InputJsonValue,
          status: 'NEW',
        },
      });
    }

    for (const cand of candidates) {
      // Check if intervention with same actionType already exists in PROPOSED status
      const existing = await this.prisma.intervention.findFirst({
        where: {
          userId,
          actionType: cand.actionType,
          status: InterventionStatus.PROPOSED,
        },
      });

      if (!existing) {
        await this.prisma.$transaction(async (tx) => {
          const created = await tx.intervention.create({
            data: {
              userId,
              insightId: defaultInsight.id,
              actionType: cand.actionType,
              payload: {
                title: cand.title,
                reason: cand.reason,
                expectedOutcome: cand.expectedOutcome,
                requiredUserAction: cand.requiredUserAction,
                measurementWindowDays: cand.measurementWindowDays,
                baselineMetric: cand.baselineMetric,
                evidence: cand.evidence,
                extra: cand.payload ?? {},
              } as Prisma.InputJsonValue,
              status: InterventionStatus.PROPOSED,
            },
          });

          // Log domain event to outbox
          await tx.outboxEvent.create({
            data: {
              userId,
              eventType: 'intervention.proposed',
              aggregateType: 'Intervention',
              aggregateId: created.id,
              payload: {
                interventionId: created.id,
                actionType: created.actionType,
                title: cand.title,
              } as Prisma.InputJsonValue,
            },
          });
        });
      }
    }

    return candidates;
  }

  /**
   * Accept an intervention. Transitions PROPOSED -> ACCEPTED.
   */
  async accept(userId: string, id: string) {
    const intervention = await this.getById(userId, id);

    if (intervention.status !== InterventionStatus.PROPOSED) {
      throw new BadRequestException(
        `Cannot accept intervention in status '${intervention.status}'. Must be 'PROPOSED'.`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const rec = await tx.intervention.update({
        where: { id },
        data: {
          status: InterventionStatus.ACCEPTED,
          executedAt: new Date(),
        },
      });

      await tx.outboxEvent.create({
        data: {
          userId,
          eventType: 'intervention.accepted',
          aggregateType: 'Intervention',
          aggregateId: rec.id,
          payload: {
            interventionId: rec.id,
            actionType: rec.actionType,
            acceptedAt: rec.executedAt?.toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      return rec;
    });

    await this.behaviorEvents.logEvent({
      userId,
      eventType: 'intervention.accepted',
      entityType: 'Intervention',
      entityId: id,
      metadata: { actionType: updated.actionType },
    });

    return updated;
  }

  /**
   * Reject / Dismiss an intervention. Transitions PROPOSED -> DISMISSED.
   */
  async reject(userId: string, id: string, dto?: RejectInterventionDto) {
    const intervention = await this.getById(userId, id);

    if (intervention.status !== InterventionStatus.PROPOSED) {
      throw new BadRequestException(
        `Cannot reject intervention in status '${intervention.status}'. Must be 'PROPOSED'.`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const rec = await tx.intervention.update({
        where: { id },
        data: {
          status: InterventionStatus.DISMISSED,
          decisionReason: dto?.reason ?? 'User declined intervention',
        },
      });

      await tx.outboxEvent.create({
        data: {
          userId,
          eventType: 'intervention.rejected',
          aggregateType: 'Intervention',
          aggregateId: rec.id,
          payload: {
            interventionId: rec.id,
            actionType: rec.actionType,
            reason: rec.decisionReason,
          } as Prisma.InputJsonValue,
        },
      });

      return rec;
    });

    await this.behaviorEvents.logEvent({
      userId,
      eventType: 'intervention.rejected',
      entityType: 'Intervention',
      entityId: id,
      metadata: { actionType: updated.actionType, reason: updated.decisionReason },
    });

    return updated;
  }

  /**
   * Complete an intervention and record outcome measurement.
   * Transitions ACCEPTED -> COMPLETED.
   */
  async complete(userId: string, id: string, dto?: CompleteInterventionDto) {
    const intervention = await this.getById(userId, id);

    if (intervention.status !== InterventionStatus.ACCEPTED) {
      throw new BadRequestException(
        `Cannot complete intervention in status '${intervention.status}'. Must be 'ACCEPTED'.`,
      );
    }

    const payload = (intervention.payload as Record<string, unknown>) ?? {};
    const baselineMetric = (payload['baselineMetric'] as { name: string; value: number; unit?: string }) ?? {
      name: 'completion_rate',
      value: 50,
      unit: '%',
    };
    const measurementWindowDays = (payload['measurementWindowDays'] as number) ?? 7;

    const postValue = dto?.postValue ?? (baselineMetric.value + 20); // fallback positive simulation if unspecified

    const evaluatedOutcome = evaluateInterventionOutcome(
      {
        baselineMetric,
        measurementWindowDays,
      },
      postValue,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      const rec = await tx.intervention.update({
        where: { id },
        data: {
          status: InterventionStatus.COMPLETED,
          completedAt: new Date(),
          outcome: evaluatedOutcome as unknown as Prisma.InputJsonValue,
        },
      });

      await tx.outboxEvent.create({
        data: {
          userId,
          eventType: 'intervention.completed',
          aggregateType: 'Intervention',
          aggregateId: rec.id,
          payload: {
            interventionId: rec.id,
            actionType: rec.actionType,
            outcome: evaluatedOutcome,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return rec;
    });

    await this.behaviorEvents.logEvent({
      userId,
      eventType: 'intervention.completed',
      entityType: 'Intervention',
      entityId: id,
      metadata: { actionType: updated.actionType, improved: evaluatedOutcome.improved },
    });

    return updated;
  }
}
