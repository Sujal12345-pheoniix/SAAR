import { Injectable } from '@nestjs/common';
import { SignalEngineService } from '../../growth-engine/signal-engine.service';
import { GapEngineService } from '../../growth-engine/gap-engine.service';
import type { GrowthSignal, GapFinding } from '@saar/domain';

@Injectable()
export class GapAnalyzerService {
  constructor(
    private readonly signalEngine: SignalEngineService,
    private readonly gapEngine: GapEngineService,
  ) {}

  async analyzeSignalsAndGaps(userId: string): Promise<{
    signals: GrowthSignal[];
    gaps: GapFinding[];
  }> {
    const [bundle, gaps] = await Promise.all([
      this.signalEngine.getSignals(userId),
      this.gapEngine.evaluateGaps(userId),
    ]);

    const signals = [bundle.consistency, bundle.momentum, bundle.balance];

    return { signals, gaps };
  }
}
