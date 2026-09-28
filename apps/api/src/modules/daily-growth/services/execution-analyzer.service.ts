import { Injectable } from '@nestjs/common';
import { calculateDailyExecutionSummary, type DailyExecutionSummary } from '@saar/domain';
import type { RawDayFacts } from './daily-state-builder.service';

@Injectable()
export class ExecutionAnalyzerService {
  analyzeExecution(rawFacts: RawDayFacts): DailyExecutionSummary {
    const mapped = rawFacts.tasks.map((t) => ({
      id: t.id,
      status: t.status,
      actualDurationMinutes: t.actualDurationMinutes,
      estimatedMinutes: t.estimatedMinutes,
      rescheduleCount: t.rescheduleCount,
    }));

    return calculateDailyExecutionSummary(mapped);
  }
}
