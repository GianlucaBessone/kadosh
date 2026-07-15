'use client';

import { useState } from 'react';
import { X, TrendingUp, TrendingDown, Minus, Droplet, HandHeart } from 'lucide-react';
import { formatMoney, cn } from '@/lib/utils';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { monthName } from '../utils/dateUtils';
import {
  calcProjectedBalance,
  calcTitheEstimate,
  calcPercentageCommitted,
} from '../utils/amountUtils';
import type { FinancialCommitment } from '@/lib/db';
import Link from 'next/link';
import { PeriodSelector } from '@/components/shared/PeriodSelector';
import type { PlanningPeriod } from '../types';
import { commitmentAppliesToPeriod } from '../utils/dateUtils';

interface SimulatorModalProps {
  month: number;
  year: number;
  initialPeriod: PlanningPeriod;
  commitments: FinancialCommitment[];
  onClose: () => void;
}

function InputField({
  label,
  value,
  onChange,
  placeholder = '0,00',
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium z-10">
          $
        </span>
        <MoneyInput
          value={value === null ? undefined : value}
          onChange={onChange}
          placeholder={placeholder}
          baseTextSize="text-base"
          className="w-full h-12 pl-8 pr-4 rounded-2xl bg-muted border border-border/40 text-foreground text-base font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-left"
        />
      </div>
    </div>
  );
}

export function SimulatorModal({ month, year, initialPeriod, commitments, onClose }: SimulatorModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PlanningPeriod>(initialPeriod);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };
  const [income, setIncome] = useState<number | null>(null);
  const [additionalIncome, setAdditionalIncome] = useState<number | null>(null);
  const [extraExpenses, setExtraExpenses] = useState<number | null>(null);
  const [desiredSavings, setDesiredSavings] = useState<number | null>(null);

  const filteredCommitments = commitments.filter(c => commitmentAppliesToPeriod(c, month, year, selectedPeriod));
  const totalCommitted = filteredCommitments.reduce((s, c) => s + c.installmentAmount, 0);
  const incomeNum = (income || 0);
  const additionalNum = (additionalIncome || 0);
  const extraNum = (extraExpenses || 0);
  const savingsNum = (desiredSavings || 0);

  const totalIncome = incomeNum + additionalNum;
  const balance = calcProjectedBalance({
    incomeExpected: incomeNum,
    additionalIncome: additionalNum,
    totalCommitted,
    extraordinaryExpenses: extraNum,
  });
  const tithe = calcTitheEstimate(totalIncome);
  const pct = calcPercentageCommitted(totalCommitted, totalIncome);
  const savingsCapacity = balance - savingsNum;
  const isPositive = balance > 0;
  const isWarning = pct >= 60 && pct < 90;
  const isDanger = pct >= 90 || balance < 0;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex flex-col justify-end duration-300",
        isClosing ? "animate-out fade-out pointer-events-none" : "animate-in fade-in"
      )}
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      {/* Sheet */}
      <div 
        className={cn(
          "relative max-w-md w-full mx-auto bg-card rounded-t-3xl border-t border-border/50 shadow-2xl duration-300 max-h-[90vh] flex flex-col",
          isClosing ? "animate-out slide-out-to-bottom" : "animate-in slide-in-from-bottom"
        )}
        style={{ touchAction: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-none">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-none border-b border-border/40">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Simulador</h3>
            <p className="text-xs text-muted-foreground capitalize">
              {monthName(month, year)} {year}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-y-contain px-5 pt-3 pb-28 flex flex-col gap-5">
          <PeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} className="mb-2" />
          
          {/* Inputs */}
          <div className="flex flex-col gap-4">
            <InputField label="Ingreso esperado" value={income} onChange={setIncome} />
            <InputField label="Ingresos adicionales" value={additionalIncome} onChange={setAdditionalIncome} />
            <InputField label="Gastos extraordinarios" value={extraExpenses} onChange={setExtraExpenses} />
            <InputField label="Ahorro deseado" value={desiredSavings} onChange={setDesiredSavings} />
          </div>

          {/* Calculation breakdown */}
          <div className="bg-muted/50 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ingresos totales</span>
              <span className="font-semibold">{formatMoney(totalIncome)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Compromisos del mes</span>
              <span className="font-semibold text-destructive">−{formatMoney(totalCommitted)}</span>
            </div>
            {extraNum > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gastos extraordinarios</span>
                <span className="font-semibold text-destructive">−{formatMoney(extraNum)}</span>
              </div>
            )}
            <div className="h-px bg-border/60" />
            <div className="flex justify-between">
              <span className="text-sm font-semibold text-foreground">Balance proyectado</span>
              <span
                className={cn(
                  'text-base font-bold',
                  isDanger ? 'text-destructive' : isWarning ? 'text-gold' : 'text-success'
                )}
              >
                {formatMoney(balance)}
              </span>
            </div>
          </div>

          {/* Indicators */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-2xl border border-border/50 p-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                % Comprometido
              </p>
              <p
                className={cn(
                  'text-xl font-bold',
                  isDanger ? 'text-destructive' : isWarning ? 'text-gold' : 'text-success'
                )}
              >
                {pct}%
              </p>
              <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    isDanger ? 'bg-destructive' : isWarning ? 'bg-gold' : 'bg-success'
                  )}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border/50 p-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Cap. de ahorro
              </p>
              <p
                className={cn(
                  'text-xl font-bold',
                  savingsCapacity >= 0 ? 'text-success' : 'text-destructive'
                )}
              >
                {formatMoney(savingsCapacity)}
              </p>
            </div>
          </div>

          {/* Tithe suggestion */}
          {totalIncome > 0 && (
            <div className="flex items-center gap-3 bg-gold/5 border border-gold/20 rounded-2xl p-4">
              <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-none">
                <HandHeart className="w-4 h-4 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gold uppercase tracking-wider">
                  Diezmo estimado
                </p>
                <p className="text-sm font-bold text-foreground">{formatMoney(tithe)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  El 10% de tus ingresos, como sugerencia.
                </p>
              </div>
            </div>
          )}

          {/* Seeds suggestion */}
          {isPositive && balance > 0 && (
            <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-2xl p-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-none">
                <Droplet className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Oportunidad
                </p>
                <p className="text-sm text-foreground">
                  Podés destinar parte del excedente a una de tus Semillas.
                </p>
              </div>
              <Link
                href="/seeds"
                onClick={onClose}
                className="flex-none text-xs font-semibold text-primary underline underline-offset-2"
              >
                Regar
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
