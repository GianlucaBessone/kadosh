'use client';

import Link from 'next/link';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { formatMoney } from '@/lib/utils';
import { formatShortDate } from '../utils/dateUtils';
import type { FinancialCommitment } from '@/lib/db';

interface NextCommitmentCardProps {
  commitment: FinancialCommitment;
  dueDate: Date;
}

export function NextCommitmentCard({ commitment, dueDate }: NextCommitmentCardProps) {
  // eslint-disable-next-line react-hooks/purity
  const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isUrgent = daysUntil >= 0 && daysUntil <= 3;
  const isOverdue = daysUntil < 0;

  return (
    <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Próximo compromiso
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <h3 className="text-base font-bold text-foreground truncate">{commitment.name}</h3>
            <p className="text-sm font-bold text-foreground">{formatMoney(commitment.installmentAmount)}</p>
            <p
              className={`text-xs font-medium mt-0.5 ${
                isOverdue ? 'text-destructive' : isUrgent ? 'text-gold' : 'text-muted-foreground'
              }`}
            >
              {isOverdue
                ? 'Vencido'
                : isUrgent
                ? `Vence en ${daysUntil} día${daysUntil !== 1 ? 's' : ''}`
                : `Vence el ${formatShortDate(dueDate)}`}
            </p>
          </div>

          <Link
            href="/planning"
            className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-2 rounded-xl hover:bg-primary/20 transition-colors flex-none"
          >
            Ver
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
