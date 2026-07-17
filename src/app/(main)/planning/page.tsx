'use client';

import { useState, useEffect } from 'react';
import { Plus, BarChart2, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { useAllCommitments } from '@/features/planning/hooks/usePlanningData';
import { useMonthlyCommitments, useMonthlySummary } from '@/features/planning/hooks/useMonthlyCommitments';
import { MonthSelector } from '@/features/planning/components/MonthSelector';
import { MonthlySummaryCard } from '@/features/planning/components/MonthlySummaryCard';
import { CommitmentCard } from '@/features/planning/components/CommitmentCard';
import { SimulatorModal } from '@/features/planning/components/SimulatorModal';
import { PaymentHistorySheet } from '@/features/planning/components/PaymentHistorySheet';
import { useCommitmentPayments, usePausedCommitments } from '@/features/planning/hooks/usePlanningData';
import type { FinancialCommitment } from '@/lib/db';
import { PausedCommitmentCard } from '@/features/planning/components/PausedCommitmentCard';
import { useRouter } from 'next/navigation';
import { PeriodSelector } from '@/components/shared/PeriodSelector';
import type { PlanningPeriod } from '@/features/planning/types';

function PaymentHistoryWrapper({
  commitment,
  onClose,
}: {
  commitment: FinancialCommitment;
  onClose: () => void;
}) {
  const payments = useCommitmentPayments(commitment.id);
  return (
    <PaymentHistorySheet commitment={commitment} payments={payments} onClose={onClose} />
  );
}

export default function PlanningPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line
    setIsMounted(true);
  }, []);

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState<PlanningPeriod>('MONTH');
  const [showSimulator, setShowSimulator] = useState(false);
  const [historyCommitment, setHistoryCommitment] = useState<FinancialCommitment | null>(null);
  const router = useRouter();

  const ownerId = 'local-user';

  const allCommitments = useAllCommitments(ownerId);
  const pausedCommitments = usePausedCommitments(ownerId);
  const fullMonthEntries = useMonthlyCommitments(allCommitments, selectedMonth, selectedYear, 'MONTH');
  const monthlyEntries = useMonthlyCommitments(allCommitments, selectedMonth, selectedYear, selectedPeriod);
  const summary = useMonthlySummary(allCommitments, selectedMonth, selectedYear, selectedPeriod);

  const isEmpty = allCommitments.filter(c => c.status === 'ACTIVE').length === 0;

  // Prevent hydration mismatch for Date calculations and Dexie queries
  if (!isMounted) return <div className="min-h-screen" />;

  const handleUpdateAlarm = async (commitment: FinancialCommitment, hasReminder: boolean, time: string, days: number) => {
    let newIntentId = commitment.notificationIntentId;

    if (hasReminder) {
      const targetDate = new Date(commitment.firstDueDate);
      targetDate.setUTCDate(targetDate.getUTCDate() - days);
      const [hours] = time.split(':').map(Number);
      const localDate = new Date(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), hours, 0, 0);

      try {
        const res = await fetch('/api/notifications/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userHash: ownerId,
            title: `Recordatorio: ${commitment.name}`,
            message: `Recuerda tu compromiso para pronto.`,
            targetTimeUtc: localDate.toISOString(),
            commitmentId: commitment.id,
          })
        });
        if (res.ok) {
          const data = await res.json();
          newIntentId = data.id;
        }
      } catch (e) {
        console.error('Failed to schedule', e);
      }
    } else if (!hasReminder && commitment.notificationIntentId) {
      try {
        await fetch('/api/notifications/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intentId: commitment.notificationIntentId })
        });
        newIntentId = undefined;
      } catch (e) {
        console.error('Failed to cancel', e);
      }
    }

    await db.financialCommitments.update(commitment.id, {
      hasReminder,
      reminderTime: time,
      reminderDaysBefore: days,
      notificationIntentId: newIntentId,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="flex flex-col gap-5 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mt-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Planificación</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Compromisos y flujo financiero</p>
        </div>
        <button
          onClick={() => setShowSimulator(true)}
          className="flex items-center gap-1.5 bg-muted text-foreground text-xs font-semibold px-3.5 py-2.5 rounded-2xl hover:bg-muted/80 transition-colors"
        >
          <BarChart2 className="w-3.5 h-3.5 text-primary" />
          Simular
        </button>
      </div>

      <MonthSelector
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onChange={(m, y) => { setSelectedMonth(m); setSelectedYear(y); }}
      />
      <div className="-mt-3">
        <PeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} />
      </div>

      {/* Summary card */}
      <MonthlySummaryCard
        month={selectedMonth}
        year={selectedYear}
        totalCommitted={summary.totalCommitted}
        totalQ1={summary.totalQ1}
        totalQ2={summary.totalQ2}
        count={summary.count}
        nextDueDate={summary.nextDueDate}
      />

      {/* Commitment list */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center">
            <CalendarDays className="w-8 h-8 text-primary/40" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">Sin compromisos aún</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Agregá tus compromisos financieros para anticipar y planificar con tranquilidad.
            </p>
          </div>
          <Link
            href="/planning/new"
            className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Crear primer compromiso
          </Link>
        </div>
      ) : monthlyEntries.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          Sin compromisos para este mes.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Este mes
            </h2>
            <span className="text-xs text-muted-foreground">{monthlyEntries.length} compromisos</span>
          </div>

          {monthlyEntries.map((item, index) => {
            const { commitment, dueDate, installmentIndex } = item;
            const installmentNumber = installmentIndex + 1;
            return (
              <CommitmentCard
                key={`${commitment.id}-${installmentIndex}-${index}`}
                commitment={commitment}
                dueDate={dueDate}
                installmentNumber={installmentNumber}
                onEdit={() => router.push(`/planning/${commitment.id}/edit`)}
                onViewHistory={() => setHistoryCommitment(commitment)}
                onUpdateAlarm={(hasReminder, time, days) => handleUpdateAlarm(commitment, hasReminder, time, days)}
              />
            );
          })}
        </div>
      )}

      {/* Paused Commitments Section */}
      {pausedCommitments.length > 0 && (
        <div className="flex flex-col gap-4 mt-2">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none py-2 outline-none">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider group-open:text-foreground transition-colors">
                Compromisos Pausados
              </h2>
              <span className="text-xs font-semibold bg-muted px-2.5 py-1 rounded-full text-muted-foreground group-open:bg-primary/10 group-open:text-primary transition-colors">
                {pausedCommitments.length}
              </span>
            </summary>
            <div className="flex flex-col gap-3 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {pausedCommitments.map(commitment => (
                <PausedCommitmentCard key={commitment.id} commitment={commitment} />
              ))}
            </div>
          </details>
        </div>
      )}

      {/* FAB removed: Now handled by central BottomNav button */}

      {/* Simulator */}
      {showSimulator && (
        <SimulatorModal
          month={selectedMonth}
          year={selectedYear}
          initialPeriod={selectedPeriod}
          commitments={fullMonthEntries}
          onClose={() => setShowSimulator(false)}
        />
      )}

      {/* History sheet */}
      {historyCommitment && (
        <PaymentHistoryWrapper
          commitment={historyCommitment}
          onClose={() => setHistoryCommitment(null)}
        />
      )}
    </div>
  );
}
