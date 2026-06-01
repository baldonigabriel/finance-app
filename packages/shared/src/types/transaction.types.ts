import type { Category } from './category.types';

export enum TransactionType {
  income = 'income',
  expense = 'expense',
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  date: string;
  userId: string;
  categoryId: string;
  category: Pick<Category, 'id' | 'name' | 'icon'>;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}
