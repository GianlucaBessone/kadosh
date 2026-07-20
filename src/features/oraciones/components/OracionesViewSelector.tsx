'use client';

import { cn } from '@/lib/utils';
import type { OracionesView } from '../types';
import { HandHeart, HelpingHand, Sparkles, type LucideIcon } from 'lucide-react';

interface ViewOption {
  id: OracionesView;
  icon: LucideIcon;
  label: string;
  description: string;
}

const OPTIONS: ViewOption[] = [
  {
    id: 'hub',
    icon: Sparkles,
    label: 'Orar por KADOSH',
    description: 'Orar por el proyecto y su desarrollo',
  },
  {
    id: 'pedir',
    icon: HelpingHand,
    label: 'Pedir oración',
    description: 'Comparte tu petición con la comunidad',
  },
  {
    id: 'orar',
    icon: HandHeart,
    label: 'Orar por alguien',
    description: 'Acompaña en oración a otros hermanos',
  }
];

interface OracionesViewSelectorProps {
  onSelect: (view: OracionesView) => void;
  className?: string;
}

/** Selector de vistas principal — patrón visual alineado con PeriodSelector (tarjetas anchas). */
export function OracionesViewSelector({ onSelect, className }: OracionesViewSelectorProps) {
  return (
    <div className={cn('flex flex-col gap-3 w-full', className)}>
      {OPTIONS.map(option => {
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={cn(
              'w-full flex items-center gap-4 p-5 rounded-3xl border border-border/50',
              'bg-card shadow-sm text-left transition-all duration-300',
              'hover:bg-muted/40 hover:shadow-md active:scale-[0.99]'
            )}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-primary/10 text-primary flex-none">
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{option.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
