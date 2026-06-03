import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { GoalsService } from './goals.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GoalStatus } from '@finance-app/shared';

const makeGoal = (overrides: Partial<{
  id: string;
  userId: string;
  status: GoalStatus;
  deletedAt: Date | null;
}> = {}) => ({
  id: 'goal-1',
  name: 'Viagem',
  targetAmount: 5000 as unknown as never,
  currentAmount: 1000 as unknown as never,
  deadline: new Date('2026-12-31'),
  status: GoalStatus.in_progress,
  userId: 'user-1',
  categoryId: null,
  category: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

describe('GoalsService', () => {
  let service: GoalsService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<GoalsService>(GoalsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates and returns a new goal', async () => {
      const goal = makeGoal();
      prisma.goal.create.mockResolvedValue(goal);

      const result = await service.create('user-1', {
        name: 'Viagem',
        targetAmount: 5000,
        deadline: '2026-12-31',
      });

      expect(result).toEqual(goal);
      expect(prisma.goal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1', name: 'Viagem' }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('returns active goals filtered by userId', async () => {
      const goals = [makeGoal(), makeGoal({ id: 'goal-2' })];
      prisma.goal.findMany.mockResolvedValue(goals);

      const result = await service.findAll('user-1');

      expect(result).toEqual(goals);
      expect(prisma.goal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1', deletedAt: null } }),
      );
    });

    it('does not return soft-deleted goals', async () => {
      prisma.goal.findMany.mockResolvedValue([]);

      const result = await service.findAll('user-1');

      expect(result).toEqual([]);
      expect(prisma.goal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the goal when it belongs to the requesting user', async () => {
      const goal = makeGoal();
      prisma.goal.findFirst.mockResolvedValue(goal);

      const result = await service.findOne('user-1', 'goal-1');

      expect(result).toEqual(goal);
    });

    it('throws NotFoundException when goal does not exist', async () => {
      prisma.goal.findFirst.mockResolvedValue(null);

      await expect(service.findOne('user-1', 'goal-999')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when goal belongs to another user', async () => {
      // userId is in the WHERE clause — another user's goal returns null
      prisma.goal.findFirst.mockResolvedValue(null);

      await expect(service.findOne('user-2', 'goal-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates and returns the goal', async () => {
      const existing = makeGoal();
      const updated = makeGoal({ status: GoalStatus.completed });
      prisma.goal.findFirst.mockResolvedValue(existing);
      prisma.goal.update.mockResolvedValue(updated);

      const result = await service.update('user-1', 'goal-1', { status: GoalStatus.completed });

      expect(result.status).toBe(GoalStatus.completed);
    });

    it('throws NotFoundException when goal does not exist', async () => {
      prisma.goal.findFirst.mockResolvedValue(null);

      await expect(service.update('user-1', 'goal-999', { name: 'X' })).rejects.toThrow(NotFoundException);
      expect(prisma.goal.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('soft-deletes the goal by setting deletedAt', async () => {
      const goal = makeGoal();
      prisma.goal.findFirst.mockResolvedValue(goal);
      prisma.goal.update.mockResolvedValue({ ...goal, deletedAt: new Date() });

      await service.remove('user-1', 'goal-1');

      expect(prisma.goal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'goal-1' },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
    });

    it('does not hard-delete the record', async () => {
      const goal = makeGoal();
      prisma.goal.findFirst.mockResolvedValue(goal);
      prisma.goal.update.mockResolvedValue({ ...goal, deletedAt: new Date() });

      await service.remove('user-1', 'goal-1');

      expect(prisma.goal.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when goal does not exist', async () => {
      prisma.goal.findFirst.mockResolvedValue(null);

      await expect(service.remove('user-1', 'goal-999')).rejects.toThrow(NotFoundException);
      expect(prisma.goal.update).not.toHaveBeenCalled();
    });
  });
});
