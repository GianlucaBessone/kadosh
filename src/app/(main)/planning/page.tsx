'use client';

import { useState, useEffect } from 'react';
import { Plus, BarChart2, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useAllCommitments } from '@/features/planning/hooks/usePlanningData';
import { useMonthlyCommitments, useMonthlySummary } from '@/features/planning/hooks/useMonthlyCommitments';
import { MonthSelector } from '@/features/planning/components/MonthSelector';
import { MonthlySummaryCard } from '@/features/planning/components/MonthlySummaryCard';
import { CommitmentCard } from '@/features/planning/components/CommitmentCard';
import { SimulatorModal } from '@/features/planning/components/SimulatorModal';
import { PaymentHistorySheet } from '@/features/planning/components/PaymentHistorySheet';
import { useCommitmentPayments } from '@/features/planning/hooks/usePlanningData';
import { getInstallmentNumberForMonth } from '@/features/planning/utils/dateUtils';
import type { FinancialCommitment } from '@/lib/db';
import { useRouter } from 'next/navigation';

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
  const [showSimulator, setShowSimulator] = useState(false);
  const [historyCommitment, setHistoryCommitment] = useState<FinancialCommitment | null>(null);
  const router = useRouter();

  const user = useLiveQuery(() => db.users.orderBy('id').first());
  const ownerId = user?.id ?? '';

  const allCommitments = useAllCommitments(ownerId);
  const monthlyEntries = useMonthlyCommitments(allCommitments, selectedMonth, selectedYear);
  const summary = useMonthlySummary(allCommitments, selectedMonth, selectedYear);

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
        newIntentId = null;
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

      {/* Month selector */}
      <MonthSelector
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onChange={(m, y) => { setSelectedMonth(m); setSelectedYear(y); }}
      />

      {/* Summary card */}
      <MonthlySummaryCard
        month={selectedMonth}
        year={selectedYear}
        totalCommitted={summary.totalCommitted}
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

          {monthlyEntries.map(({ commitment, dueDate }) => {
            const installmentNumber = getInstallmentNumberForMonth(
              commitment,
              selectedMonth,
              selectedYear
            );
            return (
              <CommitmentCard
                key={commitment.id}
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

      {/* FAB */}
      <Link
        href="/planning/new"
        className="fixed bottom-24 right-4 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95"
        aria-label="Nuevo compromiso"
      >
        <Plus className="w-6 h-6" />
      </Link>

      {/* Simulator */}
      {showSimulator && (
        <SimulatorModal
          month={selectedMonth}
          year={selectedYear}
          commitments={monthlyEntries.map(e => e.commitment)}
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
