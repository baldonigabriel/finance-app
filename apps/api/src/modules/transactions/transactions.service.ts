import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

    return this.prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, deletedAt: null },
      include: { category: true },
    });

    if (!transaction) throw new NotFoundException('Transação não encontrada');
    if (transaction.userId !== userId) throw new ForbiddenException();

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

  async getSummary(userId: string, startDate?: Date, endDate?: Date) {
    const where: Record<string, unknown> = { userId, deletedAt: null };

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.gte = startDate;
      if (endDate) dateFilter.lte = endDate;
      where.date = dateFilter;
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      select: { type: true, amount: true },
    });

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
  }
}
