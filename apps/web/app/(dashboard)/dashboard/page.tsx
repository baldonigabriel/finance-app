'use client';

import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, Wallet, ShoppingBag } from 'lucide-react';
import {
  fetchSummary,
  fetchTransactions,
  fetchLast6MonthsSummaries,
  getMonthRange,
  type Transaction,
  type TransactionSummary,
  type MonthlySummary,
  type PaginatedTransactions,
} from '@/services/transactions.service';

// ─── Recharts só no client (evita SSR mismatch) ──────────────────────────────
const CategoryDonut = dynamic(
  () => import('@/components/dashboard/CategoryDonut').then((m) => m.CategoryDonut),
  { ssr: false },
);
const MonthlyBar = dynamic(
  () => import('@/components/dashboard/MonthlyBar').then((m) => m.MonthlyBar),
  { ssr: false },
);

// ─── Formatação ──────────────────────────────────────────────────────────────

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function getMonthLabel() {
  return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

// ─── Hooks de dados ──────────────────────────────────────────────────────────

function useSummary() {
  const { startDate, endDate } = getMonthRange();
  return useQuery<TransactionSummary>({
    queryKey: ['summary', startDate],
    queryFn: () => fetchSummary(startDate, endDate),
  });
}

function useMonthExpenses() {
  const { startDate, endDate } = getMonthRange();
  return useQuery<PaginatedTransactions>({
    queryKey: ['transactions', 'expenses', startDate],
    queryFn: () => fetchTransactions({ startDate, endDate, type: 'expense', limit: 100 }),
  });
}

function useRecentTransactions() {
  const { startDate, endDate } = getMonthRange();
  return useQuery<PaginatedTransactions>({
    queryKey: ['transactions', 'all', startDate],
    queryFn: () => fetchTransactions({ startDate, endDate, limit: 8 }),
  });
}

function useMonthlyEvolution() {
  return useQuery<MonthlySummary[]>({
    queryKey: ['monthly-evolution'],
    queryFn: fetchLast6MonthsSummaries,
    staleTime: 1000 * 60 * 10,
  });
}

// ─── Summary Card ────────────────────────────────────────────────────────────

interface CardProps {
  label: string;
  value: string | null;
  sub: string;
  icon: React.ReactNode;
  iconClass: string;
  loading: boolean;
}

function SummaryCard({ label, value, sub, icon, iconClass, loading }: CardProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5 flex flex-col gap-3 transition-all duration-200 hover:border-zinc-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-zinc-500">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconClass}`}>
          {icon}
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-7 w-36 bg-zinc-100 rounded-md animate-pulse" />
          <div className="h-3.5 w-20 bg-zinc-100 rounded animate-pulse" />
        </div>
      ) : (
        <div>
          <p className="text-[26px] font-semibold text-zinc-900 tabular-nums leading-none">
            {value ?? '—'}
          </p>
          <p className="text-[12px] text-zinc-400 mt-1.5">{sub}</p>
        </div>
      )}
    </div>
  );
}

// ─── Recent Transactions ─────────────────────────────────────────────────────

function RecentTransactions({ transactions, loading }: { transactions: Transaction[] | undefined; loading: boolean }) {
  if (loading) {
    return (
      <div className="divide-y divide-zinc-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-8 h-8 bg-zinc-100 rounded-lg animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 bg-zinc-100 rounded animate-pulse" />
              <div className="h-2.5 w-20 bg-zinc-100 rounded animate-pulse" />
            </div>
            <div className="h-3.5 w-20 bg-zinc-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!transactions?.length) {
    return (
      <div className="flex items-center justify-center h-24">
        <p className="text-[13px] text-zinc-300 font-medium">Sem transações este mês</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-100">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50 transition-colors duration-150"
        >
          <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-zinc-400 uppercase">
              {tx.category.name.slice(0, 2)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-zinc-800 truncate">
              {tx.description || tx.category.name}
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {tx.category.name}
              {' · '}
              {new Date(tx.date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
              })}
            </p>
          </div>

          <span
            className={`text-[13px] font-semibold tabular-nums flex-shrink-0 ${
              tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {tx.type === 'income' ? '+' : '−'}
            {BRL.format(Number(tx.amount))}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: summary, isLoading: loadingSummary } = useSummary();
  const { data: expensePage, isLoading: loadingExpenses } = useMonthExpenses();
  const { data: recentPage, isLoading: loadingRecents } = useRecentTransactions();
  const { data: evolution, isLoading: loadingEvolution } = useMonthlyEvolution();

  const expenses = expensePage?.data;
  const recents = recentPage?.data;

  const biggest = expenses?.length
    ? expenses.reduce((max, t) => (Number(t.amount) > Number(max.amount) ? t : max))
    : null;

  const cards: CardProps[] = [
    {
      label: 'Receitas',
      value: summary ? BRL.format(summary.totalIncome) : null,
      sub: 'este mês',
      icon: <ArrowDownLeft size={15} className="text-emerald-600" strokeWidth={2.5} />,
      iconClass: 'bg-emerald-50',
      loading: loadingSummary,
    },
    {
      label: 'Despesas',
      value: summary ? BRL.format(summary.totalExpense) : null,
      sub: 'este mês',
      icon: <ArrowUpRight size={15} className="text-rose-600" strokeWidth={2.5} />,
      iconClass: 'bg-rose-50',
      loading: loadingSummary,
    },
    {
      label: 'Saldo',
      value: summary ? BRL.format(summary.balance) : null,
      sub: 'receitas − despesas',
      icon: <Wallet size={15} className="text-blue-600" strokeWidth={2.5} />,
      iconClass: 'bg-blue-50',
      loading: loadingSummary,
    },
    {
      label: 'Maior gasto',
      value: biggest ? BRL.format(Number(biggest.amount)) : null,
      sub: biggest?.category?.name ?? (loadingExpenses ? '' : 'nenhum este mês'),
      icon: <ShoppingBag size={15} className="text-amber-600" strokeWidth={2.5} />,
      iconClass: 'bg-amber-50',
      loading: loadingExpenses,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ── Header ── */}
      <div>
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">
          {getMonthLabel()}
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Visão geral</h1>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {cards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* Donut — 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-5 flex flex-col" style={{ minHeight: 340 }}>
          <div className="mb-3">
            <p className="text-[13px] font-medium text-zinc-700">Gastos por categoria</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">este mês</p>
          </div>
          <CategoryDonut transactions={expenses ?? []} loading={loadingExpenses} />
        </div>

        {/* Bar — 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-zinc-200 p-5 flex flex-col" style={{ minHeight: 340 }}>
          <div className="mb-3">
            <p className="text-[13px] font-medium text-zinc-700">Evolução mensal</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">últimos 6 meses</p>
          </div>
          <MonthlyBar data={evolution ?? []} loading={loadingEvolution} />
        </div>
      </div>

      {/* ── Recent transactions ── */}
      <div className="bg-white rounded-xl border border-zinc-200">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-zinc-700">Transações recentes</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">este mês</p>
          </div>
          {recentPage && recentPage.total > recentPage.limit && (
            <span className="text-[12px] text-zinc-400">
              showing {recentPage.limit} of {recentPage.total}
            </span>
          )}
        </div>
        <RecentTransactions transactions={recents} loading={loadingRecents} />
      </div>
    </div>
  );
}
