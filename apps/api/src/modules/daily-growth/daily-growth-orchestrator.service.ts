import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BehaviorEventsService } from '../behavior-events/behavior-events.service';
import { DailyStateBuilderService } from './services/daily-state-builder.service';
import { ExecutionAnalyzerService } from './services/execution-analyzer.service';
import { GapAnalyzerService } from './services/gap-analyzer.service';
import { TradeoffAnalyzerService } from './services/tradeoff-analyzer.service';
import { InterventionSelectorService } from './services/intervention-selector.service';
import { TomorrowPlannerService } from './services/tomorrow-planner.service';
import type { DailyGrowthSessionState } from '@saar/domain';

@Injectable()
export class DailyGrowthOrchestratorService {
  private readonly logger = new Logger(DailyGrowthOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly behaviorEvents: BehaviorEventsService,
    private readonly stateBuilder: DailyStateBuilderService,
    private readonly executionAnalyzer: ExecutionAnalyzerService,
    private readonly gapAnalyzer: GapAnalyzerService,
    private readonly tradeoffAnalyzer: TradeoffAnalyzerService,
    private readonly interventionSelector: InterventionSelectorService,
    private readonly tomorrowPlanner: TomorrowPlannerService,
  ) {}

  /**
   * Deterministically compiles the complete 8-step Daily Growth Session State.
   * Idempotent: multiple calls return consistent state without duplicated mutations.
   */
  async getDailyGrowthState(userId: string, dateStr?: string): Promise<DailyGrowthSessionState> {
    const rawFacts = await this.stateBuilder.buildRawDayFacts(userId, dateStr);

    const [execution, { signals, gaps }, interventions, tomorrowPlanPreview] =
      await Promise.all([
        Promise.resolve(this.executionAnalyzer.analyzeExecution(rawFacts)),
        this.gapAnalyzer.analyzeSignalsAndGaps(userId),
        this.interventionSelector.getCandidateInterventions(userId),
        this.tomorrowPlanner.planTomorrow(userId, rawFacts),
      ]);

    const tradeoffs = await this.tradeoffAnalyzer.analyzeDayTradeoffs(userId, rawFacts);

    return {
      date: rawFacts.targetDate,
      userId,
      status: rawFacts.sessionStatus,
      startedAt: rawFacts.startedAt,
      completedAt: rawFacts.completedAt,
      checkin: {
        completed: Boolean(rawFacts.checkin),
        mood: rawFacts.checkin?.mood ?? null,
        energy: rawFacts.checkin?.energy ?? null,
        reflection: rawFacts.checkin?.reflection ?? null,
        dayRating: rawFacts.checkin?.dayRating ?? null,
      },
      execution,
      signals,
      gaps,
      tradeoffs,
      interventions,
      tomorrowPlanPreview,
      engineVersion: '1.0.0',
    };
  }

  /**
   * Starts a daily growth session idempotently.
   */
  async startSession(userId: string, targetDateStr?: string) {
    const tz = await this.stateBuilder.getUserTimezone(userId);
    const dateStr = targetDateStr || this.stateBuilder.getTodayDateString(tz);
    const sessionId = `daily_growth_${userId}_${dateStr}`;
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    // Check if already started
    const existing = await this.prisma.behaviorEvent.findFirst({
      where: {
        userId,
        eventType: 'daily_growth.started',
        occurredAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (existing) {
      return {
        sessionId,
        date: dateStr,
        status: 'IN_PROGRESS',
        startedAt: existing.occurredAt.toISOString(),
      };
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.behaviorEvent.create({
        data: {
          userId,
          eventType: 'daily_growth.started',
          entityType: 'DailyGrowthSession',
          entityId: sessionId,
          occurredAt: now,
          source: 'api',
          metadata: { date: dateStr } as Prisma.InputJsonValue,
        },
      });

      await tx.outboxEvent.create({
        data: {
          userId,
          eventType: 'daily_growth.started',
          aggregateType: 'DailyGrowthSession',
          aggregateId: sessionId,
          payload: { date: dateStr, startedAt: now.toISOString() } as Prisma.InputJsonValue,
        },
      });
    });

    return {
      sessionId,
      date: dateStr,
      status: 'IN_PROGRESS',
      startedAt: now.toISOString(),
    };
  }

  /**
   * Completes a daily growth session idempotently.
   */
  async completeSession(userId: string, targetDateStr?: string) {
    const tz = await this.stateBuilder.getUserTimezone(userId);
    const dateStr = targetDateStr || this.stateBuilder.getTodayDateString(tz);
    const sessionId = `daily_growth_${userId}_${dateStr}`;
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    // Check if already completed
    const existing = await this.prisma.behaviorEvent.findFirst({
      where: {
        userId,
        eventType: 'daily_growth.completed',
        occurredAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (existing) {
      return {
        sessionId,
        date: dateStr,
        status: 'COMPLETED',
        completedAt: existing.occurredAt.toISOString(),
      };
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.behaviorEvent.create({
        data: {
          userId,
          eventType: 'daily_growth.completed',
          entityType: 'DailyGrowthSession',
          entityId: sessionId,
          occurredAt: now,
          source: 'api',
          metadata: { date: dateStr } as Prisma.InputJsonValue,
        },
      });

      await tx.outboxEvent.create({
        data: {
          userId,
          eventType: 'daily_growth.completed',
          aggregateType: 'DailyGrowthSession',
          aggregateId: sessionId,
          payload: { date: dateStr, completedAt: now.toISOString() } as Prisma.InputJsonValue,
        },
      });
    });

    return {
      sessionId,
      date: dateStr,
      status: 'COMPLETED',
      completedAt: now.toISOString(),
    };
  }
}
