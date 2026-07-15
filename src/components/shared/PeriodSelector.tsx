'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { cn } from '@/lib/utils';
import type { PlanningPeriod } from '@/features/planning/types';

interface PeriodSelectorProps {
  value: PlanningPeriod;
  onChange: (period: PlanningPeriod) => void;
  className?: string;
}

export function PeriodSelector({ value, onChange, className }: PeriodSelectorProps) {
  const settings = useLiveQuery(() => db.settings.orderBy('id').first());

  // Si no está en modo quincenal, no renderizamos el selector
  if (!settings || settings.planningMode !== 'BIWEEKLY') {
    return null;
  }

  const periods: { id: PlanningPeriod; label: string }[] = [
    { id: 'MONTH', label: 'Mes' },
    { id: 'Q1', label: '1.ª Quincena' },
    { id: 'Q2', label: '2.ª Quincena' },
  ];

  return (
    <div className={cn("flex bg-muted/50 p-1 rounded-2xl w-full", className)}>
      {periods.map((period) => (
        <button
          key={period.id}
          onClick={() => onChange(period.id)}
          className={cn(
            "flex-1 text-xs font-semibold py-2.5 rounded-xl transition-all duration-300",
            value === period.id 
              ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
