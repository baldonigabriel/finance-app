'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { Transaction } from '@/services/transactions.service';

const COLORS = ['#2563EB', '#16A34A', '#DC2626', '#D97706', '#7C3AED', '#0891B2'];

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

interface CategorySlice {
  name: string;
  value: number;
}

function groupByCategory(transactions: Transaction[]): CategorySlice[] {
  const map = new Map<string, number>();
  for (const tx of transactions) {
    const key = tx.category.name;
    map.set(key, (map.get(key) ?? 0) + Number(tx.amount));
  }

  const sorted = Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  if (sorted.length <= 6) return sorted;

  const top5 = sorted.slice(0, 5);
  const othersValue = sorted.slice(5).reduce((s, item) => s + item.value, 0);
  return [...top5, { name: 'Outros', value: othersValue }];
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: CategorySlice }> }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  return (
    <div className="bg-white border border-zinc-200 rounded-lg px-3 py-2 shadow-md">
      <p className="text-[11px] text-zinc-500 mb-0.5">{name}</p>
      <p className="text-[13px] font-semibold text-zinc-900 tabular-nums">{BRL.format(value)}</p>
    </div>
  );
}

interface Props {
  transactions: Transaction[];
  loading: boolean;
}

export function CategoryDonut({ transactions, loading }: Props) {
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="w-36 h-36 rounded-full bg-zinc-100 animate-pulse" />
        <div className="w-full space-y-2">
          {[80, 64, 72, 56].map((w, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-zinc-100 animate-pulse" />
                <div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: w }} />
              </div>
              <div className="w-16 h-3 bg-zinc-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const data = groupByCategory(transactions);

  if (!data.length) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[13px] text-zinc-300 font-medium">Sem despesas este mês</p>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex-1 flex flex-col gap-4 min-h-0">
      <div className="relative h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={76}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Centro do donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-[11px] text-zinc-400">total</p>
          <p className="text-[15px] font-semibold text-zinc-800 tabular-nums leading-tight">
            {BRL.format(total)}
          </p>
        </div>
      </div>

      {/* Legenda */}
      <div className="space-y-2 overflow-y-auto">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-[12px] text-zinc-500 truncate">{item.name}</span>
            </div>
            <span className="text-[12px] font-medium text-zinc-700 tabular-nums flex-shrink-0">
              {BRL.format(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
