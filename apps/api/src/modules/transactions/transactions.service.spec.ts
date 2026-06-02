import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType } from '@finance-app/shared';

const makeTransaction = (overrides: Partial<{ userId: string; deletedAt: Date | null }> = {}) => ({
  id: 'tx-1',
  userId: 'user-1',
  type: TransactionType.expense,
  amount: 100 as unknown as never,
  description: null,
  date: new Date(),
  categoryId: 'cat-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  category: {} as never,
  ...overrides,
});

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('throws NotFoundException when transaction does not exist', async () => {
      prisma.transaction.findFirst.mockResolvedValue(null);
      await expect(service.findOne('user-1', 'tx-1')).rejects.toThrow(NotFoundException);
    });

    it('returns NotFoundException (not ForbiddenException) when transaction belongs to another user', async () => {
      // userId filter is now part of the WHERE clause — other user's transaction returns null
      prisma.transaction.findFirst.mockResolvedValue(null);
      await expect(service.findOne('user-1', 'tx-999')).rejects.toThrow(NotFoundException);
    });

    it('returns the transaction when it belongs to the requesting user', async () => {
      const tx = makeTransaction();
      prisma.transaction.findFirst.mockResolvedValue(tx);
      const result = await service.findOne('user-1', 'tx-1');
      expect(result).toEqual(tx);
    });
  });
});
