import { Injectable } from '@nestjs/common';
import { InterventionsService } from '../../interventions/interventions.service';
import type { InterventionCandidate } from '@saar/domain';

@Injectable()
export class InterventionSelectorService {
  constructor(private readonly interventionsService: InterventionsService) {}

  async getCandidateInterventions(userId: string): Promise<InterventionCandidate[]> {
    return this.interventionsService.generateCandidates(userId);
  }
}
