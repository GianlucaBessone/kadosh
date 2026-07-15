'use client';

import { CalendarCheck, Wallet, Hash, Clock, SplitSquareHorizontal } from 'lucide-react';
import { formatMoney } from '@/lib/utils';
import { formatShortDate, monthName } from '../utils/dateUtils';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

interface MonthlySummaryCardProps {
  month: number;
  year: number;
  totalCommitted: number;
  totalQ1?: number;
  totalQ2?: number;
  count: number;
  nextDueDate: Date | null;
  projectedBalance?: number;
}

export function MonthlySummaryCard({
  month,
  year,
  totalCommitted,
  totalQ1 = 0,
  totalQ2 = 0,
  count,
  nextDueDate,
  projectedBalance,
}: MonthlySummaryCardProps) {
  const hasBalance = projectedBalance !== undefined;
  const isPositive = hasBalance && projectedBalance >= 0;
  const settings = useLiveQuery(() => db.settings.orderBy('id').first());
  const isBiweekly = settings?.planningMode === 'BIWEEKLY';

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
          {isBiweekly && (
            <div className="flex flex-col mt-2 gap-1.5 border-t border-border/40 pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-medium">Q1 (1-15)</span>
                <span className="font-semibold text-foreground">{formatMoney(totalQ1)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-medium">Q2 (16+)</span>
                <span className="font-semibold text-foreground">{formatMoney(totalQ2)}</span>
              </div>
            </div>
          )}
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
