import api from '@/services/api';

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface MonthlySummary extends TransactionSummary {
  month: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: string;
  description: string | null;
  date: string;
  category: { id: string; name: string; icon: string | null };
}

export interface PaginatedTransactions {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export function getMonthRange() {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];
  return { startDate, endDate };
}

export async function fetchSummary(startDate: string, endDate: string): Promise<TransactionSummary> {
  const { data } = await api.get('/transactions/summary', {
    params: { startDate, endDate },
  });
  return data;
}

export async function fetchTransactions(
  params: Record<string, string | number>,
): Promise<PaginatedTransactions> {
  const { data } = await api.get('/transactions', { params });
  return data;
}

export async function fetchLast6MonthsSummaries(): Promise<MonthlySummary[]> {
  const { data } = await api.get<MonthlySummary[]>('/transactions/monthly-summary', {
    params: { months: 6 },
  });
  return data;
}
