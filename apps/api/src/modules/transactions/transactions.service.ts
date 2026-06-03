import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateTransactionDto) {
    return this.prisma.transaction.create({
      data: {
        type: dto.type,
        amount: dto.amount,
        description: dto.description,
        date: dto.date ? new Date(dto.date) : new Date(),
        userId,
        categoryId: dto.categoryId,
      },
      include: { category: true },
    });
  }

  async findAll(userId: string, filters: FilterTransactionDto) {
    const where: Record<string, unknown> = { userId, deletedAt: null };

    if (filters.type) where.type = filters.type;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.startDate || filters.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (filters.startDate) dateFilter.gte = new Date(filters.startDate);
      if (filters.endDate) dateFilter.lte = new Date(filters.endDate);
      where.date = dateFilter;
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId, deletedAt: null },
      include: { category: true },
    });

    if (!transaction) throw new NotFoundException('Transação não encontrada');

    return transaction;
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    await this.findOne(userId, id);

    const data: Record<string, unknown> = {};
    if (dto.type) data.type = dto.type;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.date) data.date = new Date(dto.date);
    if (dto.categoryId) data.categoryId = dto.categoryId;

    return this.prisma.transaction.update({ where: { id }, data, include: { category: true } });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.transaction.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getMonthlySummaries(userId: string, months: number) {
    const now = new Date();
    const ranges = Array.from({ length: months }, (_, i) => {
      const offset = months - 1 - i;
      const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0, 23, 59, 59, 999);
      const label = start.toLocaleDateString('pt-BR', { month: 'short' })
        .replace('.', '')
        .replace(/^\w/, (c) => c.toUpperCase());
      return { start, end, label };
    });

    return Promise.all(
      ranges.map(async ({ start, end, label }) => {
        const summary = await this.getSummary(userId, start, end);
        return { ...summary, month: label };
      }),
    );
  }

  async getSummary(userId: string, startDate?: Date, endDate?: Date) {
    const dateFilter =
      startDate || endDate
        ? { date: { ...(startDate ? { gte: startDate } : {}), ...(endDate ? { lte: endDate } : {}) } }
        : {};

    const baseWhere = { userId, deletedAt: null, ...dateFilter };

    const [incomeAgg, expenseAgg] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { ...baseWhere, type: 'income' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...baseWhere, type: 'expense' },
        _sum: { amount: true },
      }),
    ]);

    const zero = new Prisma.Decimal(0);
    const totalIncome = incomeAgg._sum.amount ?? zero;
    const totalExpense = expenseAgg._sum.amount ?? zero;

    return {
      totalIncome: totalIncome.toNumber(),
      totalExpense: totalExpense.toNumber(),
      balance: totalIncome.minus(totalExpense).toNumber(),
    };
  }
}
