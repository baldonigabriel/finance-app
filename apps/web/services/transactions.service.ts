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

export async function fetchTransactions(params: Record<string, string>): Promise<Transaction[]> {
  const { data } = await api.get('/transactions', { params });
  return data;
}

export async function fetchLast6MonthsSummaries(): Promise<MonthlySummary[]> {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return d;
  });

  return Promise.all(
    months.map(async (d) => {
      const startDate = new Date(d.getFullYear(), d.getMonth(), 1)
        .toISOString().split('T')[0];
      const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0)
        .toISOString().split('T')[0];
      const summary = await fetchSummary(startDate, endDate);
      const label = d.toLocaleDateString('pt-BR', { month: 'short' })
        .replace('.', '')
        .replace(/^\w/, (c) => c.toUpperCase());
      return { ...summary, month: label };
    }),
  );
}
