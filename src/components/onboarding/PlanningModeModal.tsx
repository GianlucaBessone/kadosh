'use client';

import { useState } from 'react';
import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, SplitSquareHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Settings } from '@/lib/db';

interface PlanningModeModalProps {
  settings: Settings;
  onComplete: () => void;
}

export function PlanningModeModal({ settings, onComplete }: PlanningModeModalProps) {
  const [selected, setSelected] = useState<'MONTHLY' | 'BIWEEKLY' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await db.settings.update(settings.id, {
        planningMode: selected,
        hasSelectedPlanningMode: true,
        updatedAt: new Date().toISOString()
      });
      onComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-background border border-border shadow-xl rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="p-6 pb-2 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            ¿Cómo deseas organizar tus finanzas?
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Puedes administrar tus ingresos y gastos de dos maneras. Esta configuración se puede cambiar más adelante en tu Perfil.
          </p>
        </div>

        <div className="p-6 flex flex-col gap-3">
          <Card 
            className={cn(
              "cursor-pointer transition-all duration-300 border-2",
              selected === 'MONTHLY' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            )}
            onClick={() => setSelected('MONTHLY')}
          >
            <CardContent className="p-4 flex gap-4 items-start">
              <div className="mt-1 bg-background p-2 rounded-xl shadow-sm border border-border">
                <CalendarDays className="w-5 h-5 text-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Mensual</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Todo se organiza por mes completo. Los ingresos, diezmo y balances se reinician al comenzar un nuevo mes.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={cn(
              "cursor-pointer transition-all duration-300 border-2",
              selected === 'BIWEEKLY' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            )}
            onClick={() => setSelected('BIWEEKLY')}
          >
            <CardContent className="p-4 flex gap-4 items-start">
              <div className="mt-1 bg-background p-2 rounded-xl shadow-sm border border-border">
                <SplitSquareHorizontal className="w-5 h-5 text-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Quincenal</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Cada mes se divide en dos períodos (Q1: del 1 al 15, Q2: del 16 a fin de mes). Todo se reinicia por quincena.
                </p>
              </div>
            </CardContent>
          </Card>

          <button
            onClick={handleSave}
            disabled={!selected || loading}
            className="w-full mt-4 bg-primary text-primary-foreground font-semibold py-3.5 rounded-2xl disabled:opacity-50 transition-colors"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
