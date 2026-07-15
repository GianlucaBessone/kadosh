'use client';

import {
  MoreHorizontal,
  Play,
  Tv,
  Zap,
  Landmark,
  Home,
  ShieldCheck,
  Droplet,
  FileText,
  CreditCard,
  Pin,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { COMMITMENT_TYPE_LABELS } from '../types';
import type { FinancialCommitment } from '@/lib/db';
import { CommitmentType } from '@/lib/db';
import { MoneyDisplay } from '@/components/ui/MoneyDisplay';
import { formatShortDate } from '../utils/dateUtils';
import { PlanningService } from '../services/planningService';
import { useState } from 'react';

const TYPE_ICONS: Record<CommitmentType, LucideIcon> = {
  [CommitmentType.SUBSCRIPTION]: Tv,
  [CommitmentType.SERVICE]: Zap,
  [CommitmentType.LOAN]: Landmark,
  [CommitmentType.RENT]: Home,
  [CommitmentType.INSURANCE]: ShieldCheck,
  [CommitmentType.UTILITY]: Droplet,
  [CommitmentType.TAX]: FileText,
  [CommitmentType.INSTALLMENT]: CreditCard,
  [CommitmentType.CUSTOM]: Pin,
};

interface PausedCommitmentCardProps {
  commitment: FinancialCommitment;
  onUnpause?: () => void;
}

export function PausedCommitmentCard({ commitment, onUnpause }: PausedCommitmentCardProps) {
  const IconComponent = TYPE_ICONS[commitment.type] ?? Pin;
  const typeLabel = commitment.type === CommitmentType.CUSTOM && commitment.customTypeName 
    ? commitment.customTypeName 
    : COMMITMENT_TYPE_LABELS[commitment.type];

  const [loading, setLoading] = useState(false);

  const handleUnpause = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await PlanningService.unpauseCommitment(commitment.id);
      onUnpause?.();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const pausedText = commitment.pausedUntil 
    ? `Pausado hasta el ${formatShortDate(new Date(commitment.pausedUntil))}` 
    : 'Pausa indefinida';

  return (
    <div className="bg-card/50 rounded-2xl border border-dashed border-border/60 p-3 flex items-center justify-between gap-3 opacity-80 hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center flex-none">
          <IconComponent className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex flex-col justify-center">
          <h3 className="font-semibold text-foreground text-sm truncate leading-tight">
            {commitment.name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{pausedText}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-muted-foreground line-through decoration-muted-foreground/30 flex items-center">
          <MoneyDisplay amount={commitment.installmentAmount} />
        </span>
        <button
          onClick={handleUnpause}
          disabled={loading}
          className="flex-none w-8 h-8 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"
          aria-label="Reactivar"
        >
          <Play className="w-4 h-4 ml-0.5" />
        </button>
      </div>
    </div>
  );
}
