import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType } from './dto/create-transaction.dto';

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

    it('throws ForbiddenException when transaction belongs to another user', async () => {
      prisma.transaction.findFirst.mockResolvedValue({
        id: 'tx-1',
        userId: 'other-user',
        type: TransactionType.expense,
        amount: 100 as unknown as never,
        description: null,
        date: new Date(),
        categoryId: 'cat-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        category: {} as never,
      });
      await expect(service.findOne('user-1', 'tx-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
