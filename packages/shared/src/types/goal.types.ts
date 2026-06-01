import type { Category } from './category.types';

export enum GoalStatus {
  in_progress = 'in_progress',
  completed = 'completed',
  expired = 'expired',
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  status: GoalStatus;
  userId: string;
  categoryId: string | null;
  category: Pick<Category, 'id' | 'name' | 'icon'> | null;
  createdAt: string;
  updatedAt: string;
}
