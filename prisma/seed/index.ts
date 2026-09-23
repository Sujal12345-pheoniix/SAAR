/**
 * SAAR – Database Seed Script
 *
 * Creates a deterministic, synthetic dataset for local development and CI.
 * NO real emails, NO real credentials, NO personally-identifiable data.
 *
 * Run via:  pnpm db:seed
 *           npx prisma db seed
 */

import { PrismaClient, TaskStatus, InsightStatus, InsightType } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient({ log: ['warn', 'error'] });

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function daysAgo(n: number): Date {
  return daysFromNow(-n);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main seed function
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n🌱 SAAR seed starting…\n');

  // ───────────────────────────────────────────────
  // 1. Demo User
  // ───────────────────────────────────────────────
  const passwordHash = await argon2.hash('SaarDemo#2027!', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@saar.dev' },
    update: {},
    create: {
      email: 'demo@saar.dev',
      passwordHash,
      displayName: 'Demo User',
      isEmailVerified: true,
      createdAt: daysAgo(30),
    },
  });
  console.log(`✅ User created:   ${demoUser.email} (id: ${demoUser.id})`);

  // ───────────────────────────────────────────────
  // 2. User Profile
  // ───────────────────────────────────────────────
  const userProfile = await prisma.userProfile.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      avatarUrl: null,
      onboardingCompletedAt: daysAgo(29),
      preferences: {
        theme: 'system',
        weekStartsOn: 'monday',
        dailyCheckInTime: '08:00',
        notificationsEnabled: true,
      },
    },
  });
  console.log(`✅ UserProfile:    id=${userProfile.id}`);

  // ───────────────────────────────────────────────
  // 3. Life Areas (6 canonical areas)
  // ───────────────────────────────────────────────
  const lifeAreaData = [
    {
      key: 'mind',
      title: 'Mind & Learning',
      emoji: '🧠',
      color: '#7C3AED',
      targetState:
        'Dedicate at least 45 minutes each day to deliberate learning — reading, courses, or reflection journaling.',
      sortOrder: 0,
    },
    {
      key: 'health',
      title: 'Health & Fitness',
      emoji: '💪',
      color: '#059669',
      targetState:
        'Move my body every day. Complete a 10K race, hit 8 hours of quality sleep consistently, and eat mostly whole foods.',
      sortOrder: 1,
    },
    {
      key: 'career',
      title: 'Career & Work',
      emoji: '🚀',
      color: '#2563EB',
      targetState:
        'Ship meaningful products that help real users. Grow my technical leadership skills and build in public regularly.',
      sortOrder: 2,
    },
    {
      key: 'relationships',
      title: 'Relationships',
      emoji: '❤️',
      color: '#DC2626',
      targetState:
        'Invest quality time in my closest relationships weekly. Be fully present — no phone in conversations.',
      sortOrder: 3,
    },
    {
      key: 'personal',
      title: 'Personal Growth',
      emoji: '🌱',
      color: '#D97706',
      targetState:
        'Develop emotional resilience, a consistent mindfulness practice, and clear personal values to guide decisions.',
      sortOrder: 4,
    },
    {
      key: 'finance',
      title: 'Finance & Security',
      emoji: '💰',
      color: '#0891B2',
      targetState:
        'Build a 6-month emergency fund, invest at least 20% of income, and eliminate all high-interest debt.',
      sortOrder: 5,
    },
  ];

  const lifeAreas: Record<string, { id: string }> = {};

  for (const area of lifeAreaData) {
    const created = await prisma.lifeArea.upsert({
      where: { userId_key: { userId: demoUser.id, key: area.key } },
      update: {},
      create: {
        userId: demoUser.id,
        key: area.key,
        title: area.title,
        emoji: area.emoji,
        color: area.color,
        targetState: area.targetState,
        sortOrder: area.sortOrder,
      },
    });
    lifeAreas[area.key] = { id: created.id };
  }
  console.log(`✅ LifeAreas:      ${Object.keys(lifeAreas).join(', ')}`);

  // ───────────────────────────────────────────────
  // 4. Goals (3 concrete, measurable goals)
  // ───────────────────────────────────────────────
  const goal10K = await prisma.goal.upsert({
    where: { id: 'seed-goal-10k' },
    update: {},
    create: {
      id: 'seed-goal-10k',
      userId: demoUser.id,
      lifeAreaId: lifeAreas['health']!.id,
      title: 'Run a 10K by March 2027',
      description:
        'Complete a structured 16-week training plan and finish a 10K race in under 65 minutes by the end of March 2027.',
      targetDate: new Date('2027-03-31'),
      status: 'ACTIVE',
      priority: 1,
      createdAt: daysAgo(20),
    },
  });

  const goal12Books = await prisma.goal.upsert({
    where: { id: 'seed-goal-12books' },
    update: {},
    create: {
      id: 'seed-goal-12books',
      userId: demoUser.id,
      lifeAreaId: lifeAreas['mind']!.id,
      title: 'Read 12 books this year',
      description:
        'Read at least one non-fiction and one fiction book per month. Track notes in Notion after each book.',
      targetDate: new Date('2026-12-31'),
      status: 'ACTIVE',
      priority: 2,
      createdAt: daysAgo(20),
    },
  });

  const goalMorningRoutine = await prisma.goal.upsert({
    where: { id: 'seed-goal-morning' },
    update: {},
    create: {
      id: 'seed-goal-morning',
      userId: demoUser.id,
      lifeAreaId: lifeAreas['personal']!.id,
      title: 'Build a consistent morning routine',
      description:
        'Complete a 60-minute morning routine (meditation 10 min, journal 10 min, exercise 30 min, review day 10 min) for 90 consecutive days.',
      targetDate: daysFromNow(90),
      status: 'ACTIVE',
      priority: 3,
      createdAt: daysAgo(15),
    },
  });
  console.log(`✅ Goals:          10K run, 12 books, morning routine`);

  // ───────────────────────────────────────────────
  // 5. Goal Metrics
  // ───────────────────────────────────────────────
  await prisma.goalMetric.createMany({
    skipDuplicates: true,
    data: [
      {
        goalId: goal10K.id,
        label: 'Weekly running distance',
        unit: 'km',
        targetValue: 10,
        currentValue: 3.5,
        trackingFrequency: 'WEEKLY',
      },
      {
        goalId: goal10K.id,
        label: 'Longest single run',
        unit: 'km',
        targetValue: 10,
        currentValue: 4,
        trackingFrequency: 'WEEKLY',
      },
      {
        goalId: goal12Books.id,
        label: 'Books read',
        unit: 'books',
        targetValue: 12,
        currentValue: 7,
        trackingFrequency: 'MONTHLY',
      },
      {
        goalId: goalMorningRoutine.id,
        label: 'Consecutive days completed',
        unit: 'days',
        targetValue: 90,
        currentValue: 14,
        trackingFrequency: 'DAILY',
      },
    ],
  });
  console.log(`✅ GoalMetrics:    4 metrics across 3 goals`);

  // ───────────────────────────────────────────────
  // 6. Tasks (7 tasks, various statuses)
  // ───────────────────────────────────────────────
  const taskData = [
    {
      id: 'seed-task-1',
      goalId: goal10K.id,
      title: 'Complete Week 3 training run (5 km easy pace)',
      status: TaskStatus.PENDING,
      dueDate: daysFromNow(1),
      priority: 1,
      estimatedMinutes: 40,
    },
    {
      id: 'seed-task-2',
      goalId: goal10K.id,
      title: 'Buy proper running shoes (visit store, get gait analysis)',
      status: TaskStatus.DONE,
      dueDate: daysAgo(5),
      priority: 2,
      estimatedMinutes: 90,
    },
    {
      id: 'seed-task-3',
      goalId: goal12Books.id,
      title: 'Finish "Thinking, Fast and Slow" — chapter 28 onwards',
      status: TaskStatus.IN_PROGRESS,
      dueDate: daysFromNow(3),
      priority: 1,
      estimatedMinutes: 120,
    },
    {
      id: 'seed-task-4',
      goalId: goal12Books.id,
      title: 'Write summary notes for "Atomic Habits"',
      status: TaskStatus.DONE,
      dueDate: daysAgo(10),
      priority: 2,
      estimatedMinutes: 30,
    },
    {
      id: 'seed-task-5',
      goalId: goalMorningRoutine.id,
      title: 'Set up meditation corner in home office',
      status: TaskStatus.DONE,
      dueDate: daysAgo(14),
      priority: 1,
      estimatedMinutes: 45,
    },
    {
      id: 'seed-task-6',
      goalId: goalMorningRoutine.id,
      title: 'Draft morning routine SOP document',
      status: TaskStatus.PENDING,
      dueDate: daysFromNow(2),
      priority: 2,
      estimatedMinutes: 20,
    },
    {
      id: 'seed-task-7',
      goalId: goal10K.id,
      title: 'Register for local 5K warm-up race in November',
      status: TaskStatus.PENDING,
      dueDate: daysFromNow(7),
      priority: 3,
      estimatedMinutes: 15,
    },
  ];

  for (const task of taskData) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: {
        id: task.id,
        userId: demoUser.id,
        goalId: task.goalId,
        title: task.title,
        status: task.status,
        dueDate: task.dueDate,
        priority: task.priority,
        estimatedMinutes: task.estimatedMinutes,
        completedAt: task.status === TaskStatus.DONE ? daysAgo(1) : null,
      },
    });
  }
  console.log(`✅ Tasks:          7 tasks (3 done, 1 in-progress, 3 pending)`);

  // ───────────────────────────────────────────────
  // 7. Routine
  // ───────────────────────────────────────────────
  const morningRoutine = await prisma.routine.upsert({
    where: { id: 'seed-routine-morning' },
    update: {},
    create: {
      id: 'seed-routine-morning',
      userId: demoUser.id,
      title: 'Morning Routine',
      description: '60-minute morning power block to start every day with intention.',
      rrule: 'FREQ=DAILY;BYHOUR=6;BYMINUTE=0',
      isActive: true,
      startDate: daysAgo(14),
      steps: [
        { order: 1, title: 'Meditation', durationMinutes: 10 },
        { order: 2, title: 'Gratitude journaling', durationMinutes: 10 },
        { order: 3, title: 'Workout / run', durationMinutes: 30 },
        { order: 4, title: 'Day planning & review', durationMinutes: 10 },
      ],
    },
  });
  console.log(`✅ Routine:        "${morningRoutine.title}" (FREQ=DAILY)`);

  // ───────────────────────────────────────────────
  // 8. Behavior Events (3 recent events)
  // ───────────────────────────────────────────────
  await prisma.behaviorEvent.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'seed-event-1',
        userId: demoUser.id,
        eventType: 'task.completed',
        entityType: 'Task',
        entityId: 'seed-task-2',
        occurredAt: daysAgo(5),
        metadata: { taskTitle: 'Buy proper running shoes', durationMinutes: 85 },
      },
      {
        id: 'seed-event-2',
        userId: demoUser.id,
        eventType: 'checkin.completed',
        entityType: 'Checkin',
        entityId: 'seed-checkin-today',
        occurredAt: today(),
        metadata: { mood: 4, energy: 3 },
      },
      {
        id: 'seed-event-3',
        userId: demoUser.id,
        eventType: 'routine.completed',
        entityType: 'Routine',
        entityId: 'seed-routine-morning',
        occurredAt: today(),
        metadata: { completionPercentage: 100, stepsCompleted: 4 },
      },
    ],
  });
  console.log(`✅ BehaviorEvents: task.completed, checkin.completed, routine.completed`);

  // ───────────────────────────────────────────────
  // 9. Check-in (today)
  // ───────────────────────────────────────────────
  await prisma.checkin.upsert({
    where: { id: 'seed-checkin-today' },
    update: {},
    create: {
      id: 'seed-checkin-today',
      userId: demoUser.id,
      checkinDate: today(),
      mood: 4,
      energy: 3,
      notes:
        'Good morning session. Felt a bit sluggish during the run but pushed through. Meditation was solid.',
      highlights: ['Finished chapter 27 of Thinking Fast and Slow', 'Completed full morning routine'],
      blockers: ['Distracted by notifications during journaling'],
    },
  });
  console.log(`✅ Checkin:        mood=4, energy=3 (today)`);

  // ───────────────────────────────────────────────
  // 10. Insight
  // ───────────────────────────────────────────────
  await prisma.insight.upsert({
    where: { id: 'seed-insight-1' },
    update: {},
    create: {
      id: 'seed-insight-1',
      userId: demoUser.id,
      type: InsightType.TIMING_PATTERN,
      status: InsightStatus.NEW,
      title: 'You complete tasks 2× faster before 9 AM',
      body: 'Over the last 14 days, tasks started before 09:00 IST take an average of 22 minutes vs 47 minutes when started after noon. Consider front-loading your most important tasks.',
      supportingData: {
        earlyTasks: 8,
        avgEarlyMinutes: 22,
        lateTasks: 5,
        avgLateMinutes: 47,
        periodDays: 14,
      },
      relevantGoalIds: [goal10K.id, goalMorningRoutine.id],
      expiresAt: daysFromNow(7),
      generatedAt: today(),
    },
  });
  console.log(`✅ Insight:        timing_pattern — "You complete tasks 2× faster before 9 AM"`);

  // ───────────────────────────────────────────────
  // Summary
  // ───────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────────');
  console.log('🌱 Seed complete! Summary:');
  console.log('   1 User (demo@saar.dev)');
  console.log('   1 UserProfile');
  console.log('   6 LifeAreas');
  console.log('   3 Goals');
  console.log('   4 GoalMetrics');
  console.log('   7 Tasks');
  console.log('   1 Routine');
  console.log('   3 BehaviorEvents');
  console.log('   1 Checkin');
  console.log('   1 Insight');
  console.log('─────────────────────────────────────────────\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
