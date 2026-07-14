'use client';

import { CalendarCheck, Wallet, Hash, Clock } from 'lucide-react';
import { formatMoney } from '@/lib/utils';
import { formatShortDate, monthName } from '../utils/dateUtils';

interface MonthlySummaryCardProps {
  month: number;
  year: number;
  totalCommitted: number;
  count: number;
  nextDueDate: Date | null;
  projectedBalance?: number;
}

export function MonthlySummaryCard({
  month,
  year,
  totalCommitted,
  count,
  nextDueDate,
  projectedBalance,
}: MonthlySummaryCardProps) {
  const hasBalance = projectedBalance !== undefined;
  const isPositive = hasBalance && projectedBalance >= 0;

  return (
    <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          Compromisos de
        </p>
        <h2 className="text-xl font-bold text-foreground capitalize">
          {monthName(month, year)} {year}
        </h2>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 divide-x divide-y divide-border/40">
        {/* Total comprometido */}
        <div className="flex flex-col gap-1 px-5 py-4">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
            <Wallet className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Comprometido</span>
          </div>
          <span className="text-lg font-bold text-foreground">{formatMoney(totalCommitted)}</span>
        </div>

        {/* Cantidad */}
        <div className="flex flex-col gap-1 px-5 py-4">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
            <Hash className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Compromisos</span>
          </div>
          <span className="text-lg font-bold text-foreground">{count}</span>
        </div>

        {/* Próximo vencimiento */}
        <div className="flex flex-col gap-1 px-5 py-4">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Próximo</span>
          </div>
          <span className="text-base font-semibold text-foreground">
            {nextDueDate ? formatShortDate(nextDueDate) : '—'}
          </span>
        </div>

        {/* Balance proyectado */}
        {hasBalance && (
          <div className="flex flex-col gap-1 px-5 py-4">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
              <CalendarCheck className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Balance</span>
            </div>
            <span
              className={`text-base font-bold ${
                isPositive ? 'text-success' : 'text-destructive'
              }`}
            >
              {formatMoney(projectedBalance!)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
