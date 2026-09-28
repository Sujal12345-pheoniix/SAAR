/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { GoalStatus, TaskStatus, RoutineOccurrenceStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { FutureSelfService } from '../future-self/future-self.service';
import { LifeAreasService } from '../life-areas/life-areas.service';
import { GoalsService } from '../goals/goals.service';
import { RoutinesService } from '../routines/routines.service';
import { TasksService } from '../tasks/tasks.service';
import { PlansService } from '../plans/plans.service';
import { DailyGrowthService } from '../daily-growth/daily-growth.service';
import { BehaviorEventsService } from '../behavior-events/behavior-events.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('PART 2B: End-to-End Core User Journey Integration Test', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let futureSelfService: FutureSelfService;
  let lifeAreasService: LifeAreasService;
  let goalsService: GoalsService;
  let routinesService: RoutinesService;
  let tasksService: TasksService;
  let plansService: PlansService;
  let dailyGrowthService: DailyGrowthService;
  let behaviorEventsService: BehaviorEventsService;

  // In-memory state store simulating real transactional DB
  const store = {
    users: new Map<string, any>(),
    profiles: new Map<string, any>(),
    sessions: new Map<string, any>(),
    futureSelves: new Map<string, any>(),
    lifeAreas: new Map<string, any>(),
    goals: new Map<string, any>(),
    goalMetrics: new Map<string, any>(),
    metricObservations: new Map<string, any>(),
    routines: new Map<string, any>(),
    routineOccurrences: new Map<string, any>(),
    tasks: new Map<string, any>(),
    plans: new Map<string, any>(),
    checkins: new Map<string, any>(),
    behaviorEvents: new Array<any>(),
    outboxEvents: new Array<any>(),
  };

  const mockPrisma: any = {
    $transaction: jest.fn(async (cb: (tx: any) => Promise<any>) => cb(mockPrisma)),

    user: {
      findUnique: jest.fn(async ({ where, include }: any) => {
        let u: any = null;
        if (where.id) u = store.users.get(where.id) || null;
        else if (where.email) {
          for (const cand of store.users.values()) {
            if (cand.email === where.email) {
              u = cand;
              break;
            }
          }
        }
        if (u && include?.profile) {
          return { ...u, profile: store.profiles.get(u.id) || null };
        }
        return u;
      }),
      findUniqueOrThrow: jest.fn(async ({ where, include }: any) => {
        const u = store.users.get(where.id);
        if (u && include?.profile) {
          return { ...u, profile: store.profiles.get(u.id) || null };
        }
        return u;
      }),
      create: jest.fn(async ({ data }: any) => {
        const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        store.users.set(id, record);
        return record;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const u = store.users.get(where.id);
        const updated = { ...u, ...data, updatedAt: new Date() };
        store.users.set(where.id, updated);
        return updated;
      }),
    },

    userProfile: {
      findUnique: jest.fn(async ({ where }: any) => store.profiles.get(where.userId) || null),
      create: jest.fn(async ({ data }: any) => {
        const id = `prof-${Date.now()}`;
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        store.profiles.set(data.userId, record);
        return record;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const p = store.profiles.get(where.userId);
        const updated = { ...p, ...data, updatedAt: new Date() };
        store.profiles.set(where.userId, updated);
        return updated;
      }),
      upsert: jest.fn(async ({ where, update, create }: any) => {
        const existing = store.profiles.get(where.userId);
        if (existing) {
          const updated = { ...existing, ...update, updatedAt: new Date() };
          store.profiles.set(where.userId, updated);
          return updated;
        }
        const id = `prof-${Date.now()}`;
        const record = { id, userId: where.userId, ...create, createdAt: new Date(), updatedAt: new Date() };
        store.profiles.set(where.userId, record);
        return record;
      }),
    },

    session: {
      create: jest.fn(async ({ data }: any) => {
        const id = `sess-${Date.now()}`;
        const record = { id, ...data };
        store.sessions.set(id, record);
        return record;
      }),
      findMany: jest.fn(async () => Array.from(store.sessions.values())),
    },

    auditLog: {
      create: jest.fn(async ({ data }: any) => data),
    },

    futureSelf: {
      findUnique: jest.fn(async ({ where }: any) => store.futureSelves.get(where.userId) || null),
      upsert: jest.fn(async ({ where, update, create }: any) => {
        const existing = store.futureSelves.get(where.userId);
        if (existing) {
          const updated = { ...existing, ...update, updatedAt: new Date() };
          store.futureSelves.set(where.userId, updated);
          return updated;
        }
        const id = `fs-${Date.now()}`;
        const record = { id, userId: where.userId, ...create, createdAt: new Date(), updatedAt: new Date() };
        store.futureSelves.set(where.userId, record);
        return record;
      }),
    },

    lifeArea: {
      findMany: jest.fn(async ({ where }: any) =>
        Array.from(store.lifeAreas.values()).filter((a) => a.userId === where.userId),
      ),
      findFirst: jest.fn(async ({ where }: any) =>
        Array.from(store.lifeAreas.values()).find(
          (a) => a.id === where.id && (!where.userId || a.userId === where.userId),
        ) || null,
      ),
      create: jest.fn(async ({ data }: any) => {
        const id = `la-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        store.lifeAreas.set(id, record);
        return record;
      }),
      createMany: jest.fn(async ({ data }: any) => {
        for (const item of data) {
          const id = `la-def-${Math.random().toString(36).substr(2, 5)}`;
          store.lifeAreas.set(id, { id, ...item, createdAt: new Date(), updatedAt: new Date() });
        }
        return { count: data.length };
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const existing = store.lifeAreas.get(where.id);
        const updated = { ...existing, ...data, updatedAt: new Date() };
        store.lifeAreas.set(where.id, updated);
        return updated;
      }),
    },

    goal: {
      findMany: jest.fn(async ({ where }: any) =>
        Array.from(store.goals.values()).filter((g) => {
          if (g.userId !== where.userId) return false;
          if (where.status && g.status !== where.status) return false;
          if (where.lifeAreaId && g.lifeAreaId !== where.lifeAreaId) return false;
          return true;
        }),
      ),
      findFirst: jest.fn(async ({ where }: any) =>
        Array.from(store.goals.values()).find(
          (g) => g.id === where.id && (!where.userId || g.userId === where.userId),
        ) || null,
      ),
      create: jest.fn(async ({ data }: any) => {
        const id = `goal-${Date.now()}`;
        const record = {
          id,
          ...data,
          status: GoalStatus.ACTIVE,
          metrics: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.goals.set(id, record);
        return record;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const existing = store.goals.get(where.id);
        const updated = { ...existing, ...data, updatedAt: new Date() };
        store.goals.set(where.id, updated);
        return updated;
      }),
    },

    goalMetric: {
      create: jest.fn(async ({ data }: any) => {
        const id = `gm-${Date.now()}`;
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        store.goalMetrics.set(id, record);
        return record;
      }),
      findFirst: jest.fn(async ({ where }: any) =>
        Array.from(store.goalMetrics.values()).find(
          (m) => m.id === where.id && (!where.goalId || m.goalId === where.goalId),
        ) || null,
      ),
      update: jest.fn(async ({ where, data }: any) => {
        const existing = store.goalMetrics.get(where.id);
        const updated = { ...existing, ...data };
        store.goalMetrics.set(where.id, updated);
        return updated;
      }),
    },

    metricObservation: {
      create: jest.fn(async ({ data }: any) => {
        const id = `obs-${Date.now()}`;
        const record = { id, ...data, createdAt: new Date() };
        store.metricObservations.set(id, record);
        return record;
      }),
      findMany: jest.fn(async ({ where }: any) =>
        Array.from(store.metricObservations.values()).filter((o) => o.metricId === where.metricId),
      ),
      findFirst: jest.fn(async ({ where }: any) =>
        Array.from(store.metricObservations.values()).find((o) => o.metricId === where.metricId) || null,
      ),
    },

    routine: {
      findMany: jest.fn(async ({ where }: any) =>
        Array.from(store.routines.values()).filter((r) => r.userId === where.userId),
      ),
      findFirst: jest.fn(async ({ where }: any) =>
        Array.from(store.routines.values()).find(
          (r) => r.id === where.id && (!where.userId || r.userId === where.userId),
        ) || null,
      ),
      create: jest.fn(async ({ data }: any) => {
        const id = `rt-${Date.now()}`;
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        store.routines.set(id, record);
        return record;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const existing = store.routines.get(where.id);
        const updated = { ...existing, ...data, updatedAt: new Date() };
        store.routines.set(where.id, updated);
        return updated;
      }),
    },

    routineOccurrence: {
      findFirst: jest.fn(async ({ where }: any) =>
        Array.from(store.routineOccurrences.values()).find(
          (o) => o.id === where.id && (!where.userId || o.userId === where.userId),
        ) || null,
      ),
      findMany: jest.fn(async ({ where }: any) =>
        Array.from(store.routineOccurrences.values()).filter((o) => o.routineId === where.routineId),
      ),
      upsert: jest.fn(async ({ where, create }: any) => {
        const key = `${where.routineId_localDate.routineId}_${where.routineId_localDate.localDate.toISOString()}`;
        let existing = store.routineOccurrences.get(key);
        if (!existing) {
          const id = `occ-${Date.now()}`;
          existing = { id, ...create, createdAt: new Date(), updatedAt: new Date() };
          store.routineOccurrences.set(key, existing);
          store.routineOccurrences.set(id, existing);
        }
        return existing;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const existing = store.routineOccurrences.get(where.id);
        const updated = { ...existing, ...data, updatedAt: new Date() };
        store.routineOccurrences.set(where.id, updated);
        return updated;
      }),
    },

    task: {
      findFirst: jest.fn(async ({ where }: any) =>
        Array.from(store.tasks.values()).find(
          (t) => t.id === where.id && (!where.userId || t.userId === where.userId),
        ) || null,
      ),
      findMany: jest.fn(async ({ where }: any) =>
        Array.from(store.tasks.values()).filter((t) => {
          if (where.userId && t.userId !== where.userId) return false;
          if (where.planId && t.planId !== where.planId) return false;
          if (where.status && t.status !== where.status) return false;
          if (where.id?.in && !where.id.in.includes(t.id)) return false;
          return true;
        }),
      ),
      create: jest.fn(async ({ data }: any) => {
        const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const record = {
          id,
          ...data,
          status: TaskStatus.TODO,
          rescheduleCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.tasks.set(id, record);
        return record;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const existing = store.tasks.get(where.id);
        const updated = { ...existing, ...data, updatedAt: new Date() };
        store.tasks.set(where.id, updated);
        return updated;
      }),
    },

    plan: {
      findFirst: jest.fn(async ({ where }: any) => {
        const plans = Array.from(store.plans.values()).filter(
          (p) => p.userId === where.userId && (!where.status || p.status === where.status),
        );
        return plans[0] || null;
      }),
      findMany: jest.fn(async ({ where }: any) =>
        Array.from(store.plans.values()).filter((p) => p.userId === where.userId),
      ),
      create: jest.fn(async ({ data }: any) => {
        const id = `plan-${Date.now()}`;
        const record = { id, ...data, tasks: [], createdAt: new Date(), updatedAt: new Date() };
        store.plans.set(id, record);
        return record;
      }),
      updateMany: jest.fn(async ({ where, data }: any) => {
        let count = 0;
        for (const p of store.plans.values()) {
          if (p.userId === where.userId && p.status === where.status) {
            p.status = data.status;
            count++;
          }
        }
        return { count };
      }),
    },

    checkin: {
      findFirst: jest.fn(async ({ where }: any) =>
        Array.from(store.checkins.values()).find((c) => c.userId === where.userId) || null,
      ),
      findMany: jest.fn(async ({ where }: any) =>
        Array.from(store.checkins.values()).filter((c) => c.userId === where.userId),
      ),
      upsert: jest.fn(async ({ where, update, create }: any) => {
        const key = `${where.userId_localDate.userId}_${where.userId_localDate.localDate.toISOString()}`;
        let existing = store.checkins.get(key);
        if (existing) {
          existing = { ...existing, ...update, updatedAt: new Date() };
          store.checkins.set(key, existing);
          return existing;
        }
        const id = `chk-${Date.now()}`;
        const record = { id, ...create, createdAt: new Date(), updatedAt: new Date() };
        store.checkins.set(key, record);
        store.checkins.set(id, record);
        return record;
      }),
    },

    behaviorEvent: {
      create: jest.fn(async ({ data }: any) => {
        const id = `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const record = { id, ...data, createdAt: new Date() };
        store.behaviorEvents.push(record);
        return record;
      }),
      findFirst: jest.fn(async () => store.behaviorEvents[0] || null),
      findMany: jest.fn(async ({ where }: any) =>
        store.behaviorEvents.filter((e) => {
          if (where.userId && e.userId !== where.userId) return false;
          if (where.eventType && e.eventType !== where.eventType) return false;
          return true;
        }),
      ),
    },

    outboxEvent: {
      create: jest.fn(async ({ data }: any) => {
        const id = `outbox-${Date.now()}`;
        const record = { id, ...data, createdAt: new Date() };
        store.outboxEvents.push(record);
        return record;
      }),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('jwt-mock-token-xyz'),
    signAsync: jest.fn().mockResolvedValue('jwt-mock-token-xyz'),
  };

  const mockConfigService = {
    get: jest.fn((key: string, fallback?: number) => {
      if (key === 'JWT_ACCESS_EXPIRES_IN') return 900;
      if (key === 'JWT_REFRESH_EXPIRES_IN') return 2592000;
      return fallback;
    }),
    getOrThrow: jest.fn(() => 'mock-secret-at-least-32-characters-long'),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        FutureSelfService,
        LifeAreasService,
        GoalsService,
        RoutinesService,
        TasksService,
        PlansService,
        DailyGrowthService,
        BehaviorEventsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    futureSelfService = module.get<FutureSelfService>(FutureSelfService);
    lifeAreasService = module.get<LifeAreasService>(LifeAreasService);
    goalsService = module.get<GoalsService>(GoalsService);
    routinesService = module.get<RoutinesService>(RoutinesService);
    tasksService = module.get<TasksService>(TasksService);
    plansService = module.get<PlansService>(PlansService);
    dailyGrowthService = module.get<DailyGrowthService>(DailyGrowthService);
    behaviorEventsService = module.get<BehaviorEventsService>(BehaviorEventsService);
  });

  it('executes full user journey with real services, transactional outbox, and state transitions', async () => {
    // 1. REGISTER
    const regResult = await authService.register({
      email: 'alex.rivera@saar.dev',
      password: 'SecurePassword123!',
      displayName: 'Alex Rivera',
    });
    const userId = regResult.user.id;
    expect(userId).toBeDefined();
    expect(regResult.session.accessToken).toBeDefined();

    // 2. PROFILE (GET & PATCH)
    const profileBefore = await usersService.getMe(userId);
    expect(profileBefore.email).toBe('alex.rivera@saar.dev');

    const updatedUser = await usersService.updateMe(userId, {
      displayName: 'Alexander Rivera',
      timezone: 'America/New_York',
    });
    expect(updatedUser.profile?.displayName).toBe('Alexander Rivera');

    // 3. FUTURE SELF (Define Vision)
    const futureSelf = await futureSelfService.upsertFutureSelf(userId, {
      futureIdentity: 'Principal AI Architect & Marathoner',
      horizonYears: 5,
      desiredStates: { fitness: 'Sub-3 hour marathon pace' },
      priorities: ['Deep focus blocks', 'Consistency in recovery'],
      values: ['Mastery', 'Discipline'],
    });
    expect(futureSelf.futureIdentity).toBe('Principal AI Architect & Marathoner');
    expect(futureSelf.horizonYears).toBe(5);

    // 4. LIFE AREAS (Seed & Custom)
    const areas = await lifeAreasService.findAll(userId);
    expect(areas.length).toBeGreaterThan(0);

    const healthArea = await lifeAreasService.create(userId, {
      title: 'Athletic Endurance',
      type: 'health',
      weight: 30,
      color: '#10b981',
      sortOrder: 1,
    });
    expect(healthArea.name).toBe('Athletic Endurance');

    // 5. GOALS (Create linked to Life Area)
    const marathonGoal = await goalsService.create(userId, {
      title: 'Run Boston Marathon',
      lifeAreaId: healthArea.id,
      priority: 1,
      reason: 'Push physical and mental thresholds',
    });
    expect(marathonGoal.title).toBe('Run Boston Marathon');
    expect(marathonGoal.priority).toBe(1);

    // 6. METRICS & OBSERVATIONS
    const distanceMetric = await goalsService.createMetric(userId, marathonGoal.id, {
      metricType: 'weekly_mileage',
      targetValue: 60,
      currentValue: 0,
      unit: 'miles',
    });
    expect(distanceMetric.metricType).toBe('weekly_mileage');

    const observation = await goalsService.recordObservation(userId, marathonGoal.id, distanceMetric.id, {
      value: 20,
      source: 'garmin_gps',
    });
    expect(observation.value).toBe(20);

    // 7. ROUTINES & OCCURRENCES
    const routine = await routinesService.create(userId, {
      title: 'Morning Interval Training',
      recurrenceRule: 'FREQ=DAILY;BYHOUR=6',
      preferredTime: '06:00',
    });
    expect(routine.title).toBe('Morning Interval Training');

    const occurrence = await routinesService.getOrCreateOccurrence(userId, routine.id, '2026-09-28');
    expect(occurrence.status).toBe(RoutineOccurrenceStatus.PENDING);

    const completedOcc = await routinesService.completeOccurrence(userId, routine.id, occurrence.id, {
      actualDuration: 45,
    });
    expect(completedOcc.status).toBe(RoutineOccurrenceStatus.COMPLETED);

    // 8. TASKS & STATE TRANSITIONS (Create, Start, Reschedule, Complete)
    const runTask = await tasksService.create(userId, {
      title: '15 Mile Long Run',
      goalId: marathonGoal.id,
      lifeAreaId: healthArea.id,
      priority: 1,
      estimatedMinutes: 120,
      dueAt: '2026-09-28T07:00:00.000Z',
    });
    expect(runTask.status).toBe(TaskStatus.TODO);

    const startedTask = await tasksService.start(userId, runTask.id);
    expect(startedTask.status).toBe(TaskStatus.IN_PROGRESS);

    const completedTask = await tasksService.complete(userId, runTask.id);
    expect(completedTask.status).toBe(TaskStatus.COMPLETED);

    // Idempotent completion check
    const doubleCompleted = await tasksService.complete(userId, runTask.id);
    expect(doubleCompleted.status).toBe(TaskStatus.COMPLETED);

    // 9. DAILY PLAN & TASK MANAGEMENT
    const plan = await plansService.getTodayPlan(userId);
    expect(plan).toBeDefined();

    const planWithTask = await plansService.addTask(userId, plan.id, {
      taskId: runTask.id,
      order: 1,
    });
    expect(planWithTask.planId).toBe(plan.id);

    // 10. CHECK-IN
    const checkin = await dailyGrowthService.checkin(userId, {
      mood: 5,
      energy: 5,
      dayRating: 5,
      reflection: 'Crushed the 15 mile run with excellent pacing.',
    });
    expect(checkin.mood).toBe(5);
    expect(checkin.reflection).toContain('15 mile run');

    // 11. BEHAVIOR HISTORY & OUTBOX TRANSACTIONAL VERIFICATION
    const history = await behaviorEventsService.getEvents(userId);
    expect(history.data.length).toBeGreaterThan(0);

    // Verify outbox recorded every behavior event atomically
    expect(store.outboxEvents.length).toBeGreaterThan(0);
    const completedOutbox = store.outboxEvents.find((e) => e.eventType === 'task.completed');
    expect(completedOutbox).toBeDefined();
    expect(completedOutbox?.status).toBe('PENDING');

    // 12. GOAL COMPLETION & REOPEN
    const finishedGoal = await goalsService.complete(userId, marathonGoal.id);
    expect(finishedGoal.status).toBe(GoalStatus.COMPLETED);

    const reopenedGoal = await goalsService.reopen(userId, marathonGoal.id);
    expect(reopenedGoal.status).toBe(GoalStatus.ACTIVE);
  });
});
