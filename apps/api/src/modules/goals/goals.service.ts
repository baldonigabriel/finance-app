import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateGoalDto) {
    return this.prisma.goal.create({
      data: {
        name: dto.name,
        targetAmount: dto.targetAmount,
        deadline: new Date(dto.deadline),
        categoryId: dto.categoryId,
        userId,
      },
      include: { category: true },
    });
  }

  async findAll(userId: string) {
    return this.prisma.goal.findMany({
      where: { userId, deletedAt: null },
      include: { category: true },
      orderBy: { deadline: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const goal = await this.prisma.goal.findFirst({
      where: { id, userId, deletedAt: null },
      include: { category: true },
    });
    if (!goal) throw new NotFoundException('Meta não encontrada');
    return goal;
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    await this.findOne(userId, id);

    const data: Record<string, unknown> = {};
    if (dto.name) data.name = dto.name;
    if (dto.targetAmount !== undefined) data.targetAmount = dto.targetAmount;
    if (dto.currentAmount !== undefined) data.currentAmount = dto.currentAmount;
    if (dto.deadline) data.deadline = new Date(dto.deadline);
    if (dto.status) data.status = dto.status;
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;

    return this.prisma.goal.update({ where: { id }, data, include: { category: true } });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.goal.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
