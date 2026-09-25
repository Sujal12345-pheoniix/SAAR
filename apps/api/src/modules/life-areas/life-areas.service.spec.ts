/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LifeAreasService } from './life-areas.service';
import { PrismaService } from '../../database/prisma.service';

describe('LifeAreasService (Unit & Multi-tenant Isolation)', () => {
  let service: LifeAreasService;

  const mockPrisma = {
    lifeArea: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LifeAreasService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LifeAreasService>(LifeAreasService);
    jest.clearAllMocks();
  });

  describe('findAll() with auto-seeding', () => {
    it('returns existing life areas if user already has them', async () => {
      const existing = [{ id: 'la-1', userId: 'user-a', type: 'health', title: 'Health' }];
      mockPrisma.lifeArea.findMany.mockResolvedValueOnce(existing);

      const result = await service.findAll('user-a');
      expect(result).toEqual(existing);
      expect(mockPrisma.lifeArea.createMany).not.toHaveBeenCalled();
    });

    it('auto-seeds 6 default life areas when user has none', async () => {
      mockPrisma.lifeArea.findMany.mockResolvedValueOnce([]); // initial empty
      mockPrisma.lifeArea.createMany.mockResolvedValueOnce({ count: 6 });
      mockPrisma.lifeArea.findMany.mockResolvedValueOnce([
        { id: '1', userId: 'user-a', type: 'health', title: 'Health' },
        { id: '2', userId: 'user-a', type: 'career', title: 'Career' },
      ]);

      const result = await service.findAll('user-a');
      expect(mockPrisma.lifeArea.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ type: 'health', title: 'Health' }),
            expect.objectContaining({ type: 'career', title: 'Career' }),
            expect.objectContaining({ type: 'relationships', title: 'Relationships' }),
            expect.objectContaining({ type: 'family', title: 'Family' }),
            expect.objectContaining({ type: 'personal_growth', title: 'Personal Growth' }),
            expect.objectContaining({ type: 'recovery_rest', title: 'Recovery / Rest' }),
          ]),
        }),
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('Cross-User Access Security (Tenant Isolation)', () => {
    it('FORBIDS User B from updating User A life area (throws NotFoundException)', async () => {
      mockPrisma.lifeArea.findFirst.mockResolvedValueOnce(null); // not found for user-b

      await expect(
        service.update('user-b', 'area-owned-by-user-a', { title: 'Hacked Title' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.lifeArea.update).not.toHaveBeenCalled();
    });

    it('FORBIDS User B from deleting User A life area (throws NotFoundException)', async () => {
      mockPrisma.lifeArea.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.remove('user-b', 'area-owned-by-user-a'),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.lifeArea.delete).not.toHaveBeenCalled();
    });

    it('allows User A to update their own life area', async () => {
      mockPrisma.lifeArea.findFirst.mockResolvedValueOnce({ id: 'area-1', userId: 'user-a' });
      mockPrisma.lifeArea.update.mockResolvedValueOnce({ id: 'area-1', title: 'Updated' });

      const updated = await service.update('user-a', 'area-1', { title: 'Updated' });
      expect(updated.title).toBe('Updated');
    });
  });
});
