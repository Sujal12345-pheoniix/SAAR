import { Test, TestingModule } from '@nestjs/testing';
import { FutureSelfService } from './future-self.service';
import { PrismaService } from '../../database/prisma.service';

describe('FutureSelfService (Unit)', () => {
  let service: FutureSelfService;

  const mockPrisma = {
    futureSelf: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FutureSelfService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FutureSelfService>(FutureSelfService);
    jest.clearAllMocks();
  });

  it('upserts structured Future Self definition', async () => {
    const futureSelfData = {
      id: 'fs-1',
      userId: 'user-a',
      futureIdentity: 'Disciplined Founder & Marathon Runner',
      horizonYears: 10,
      desiredStates: { health: 'Sub-3 hour marathon pace' },
      priorities: ['Deep focus', 'Consistent sleep'],
      values: ['Integrity', 'Resilience'],
      lifeAreaTargets: { health: 'Daily 10k run' },
    };

    mockPrisma.futureSelf.upsert.mockResolvedValueOnce(futureSelfData);

    const result = await service.upsertFutureSelf('user-a', {
      futureIdentity: 'Disciplined Founder & Marathon Runner',
      horizonYears: 10,
      desiredStates: { health: 'Sub-3 hour marathon pace' },
      priorities: ['Deep focus', 'Consistent sleep'],
      values: ['Integrity', 'Resilience'],
      lifeAreaTargets: { health: 'Daily 10k run' },
    });

    expect(result.futureIdentity).toBe('Disciplined Founder & Marathon Runner');
    expect(result.horizonYears).toBe(10);
    expect(mockPrisma.futureSelf.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-a' },
      }),
    );
  });
});
