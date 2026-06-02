'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { MonthlySummary } from '@/services/transactions.service';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatYAxis(value: number) {
  if (value === 0) return 'R$0';
  if (value >= 1000) return `R$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  return `R$${value}`;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; fill: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-zinc-200 rounded-xl px-3.5 py-3 shadow-lg text-[12px] space-y-1.5">
      <p className="font-semibold text-zinc-700 text-[13px] mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: p.fill }} />
          <span className="text-zinc-500 w-16">{p.name}</span>
          <span className="font-semibold text-zinc-900 tabular-nums">{BRL.format(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function CustomLegend() {
  return (
    <div className="flex items-center gap-4 justify-end pr-1 pt-1">
      {[
        { color: '#16A34A', label: 'Receitas' },
        { color: '#DC2626', label: 'Despesas' },
      ].map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
          <span className="text-[11px] text-zinc-400 font-medium">{label}</span>
        </div>
      ))}
    </div>
  );
}

const SKELETON_HEIGHTS = [55, 90, 42, 110, 78, 65];

interface Props {
  data: MonthlySummary[];
  loading: boolean;
}

export function MonthlyBar({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-end justify-around gap-2 flex-1 px-2">
          {SKELETON_HEIGHTS.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-zinc-100 rounded-sm animate-pulse"
                style={{ height: h }}
              />
              <div className="w-7 h-2.5 bg-zinc-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const chartData = data.map((m) => ({
    month: m.month,
    Receitas: m.totalIncome,
    Despesas: m.totalExpense,
  }));

  const hasData = data.some((m) => m.totalIncome > 0 || m.totalExpense > 0);

  if (!hasData) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[13px] text-zinc-300 font-medium">Sem dados nos últimos 6 meses</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-1 min-h-0">
      <CustomLegend />
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barGap={3} barCategoryGap="32%">
          <CartesianGrid vertical={false} stroke="#F4F4F5" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#A1A1AA', fontFamily: 'inherit' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#A1A1AA', fontFamily: 'inherit' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatYAxis}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8F7F4', radius: 4 }} />
          <Bar dataKey="Receitas" fill="#16A34A" radius={[3, 3, 0, 0]} maxBarSize={32} />
          <Bar dataKey="Despesas" fill="#DC2626" radius={[3, 3, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
