'use client';

import { CalendarCheck, Wallet, Hash, Clock, SplitSquareHorizontal } from 'lucide-react';
import { MoneyDisplay } from '@/components/ui/MoneyDisplay';
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
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Compromisos de
          </p>
          <h2 className="text-xl font-bold text-foreground capitalize">
            {monthName(month, year)} {year}
          </h2>
        </div>
        <span className="text-lg font-bold text-muted-foreground/40 mt-[-2px]">
          #{count}
        </span>
      </div>

      {/* Stats list */}
      <div className="flex flex-col divide-y divide-border/40">
        {/* Total comprometido */}
        <div className="flex flex-col items-center justify-center gap-1 px-5 py-4">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
            <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Comprometido</span>
          </div>
          <span className="text-2xl font-bold text-destructive flex items-center justify-center"><MoneyDisplay amount={totalCommitted} /></span>
        </div>

        {/* Quincenas */}
        {isBiweekly && (
          <div className="flex flex-col gap-2 px-5 py-4 bg-muted/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">1.ª Quincena (1-15)</span>
              <span className="font-semibold text-foreground flex items-center"><MoneyDisplay amount={totalQ1} /></span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">2.ª Quincena (16+)</span>
              <span className="font-semibold text-foreground flex items-center"><MoneyDisplay amount={totalQ2} /></span>
            </div>
          </div>
        )}

        {/* Próximo vencimiento */}
        <div className="flex items-center justify-center gap-2 px-5 py-3.5 bg-primary/5">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Próximo:</span>
          <span className="text-sm font-bold text-foreground">
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
              className={`text-base font-bold flex items-center ${
                isPositive ? 'text-success' : 'text-destructive'
              }`}
            >
              <MoneyDisplay amount={projectedBalance!} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
