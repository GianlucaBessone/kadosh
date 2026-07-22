'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Pencil, Trash2, History, PauseCircle } from 'lucide-react';
import { useCommitment, useCommitmentPayments } from '@/features/planning/hooks/usePlanningData';
import { PaymentHistorySheet } from '@/features/planning/components/PaymentHistorySheet';
import { PlanningService } from '@/features/planning/services/planningService';
import { formatMoney } from '@/lib/utils';
import { MoneyDisplay } from '@/components/ui/MoneyDisplay';
import { COMMITMENT_TYPE_LABELS, PERIODICITY_LABELS, STATUS_LABELS } from '@/features/planning/types';
import { formatFullDate } from '@/features/planning/utils/dateUtils';
import { calcRemainingAmount } from '@/features/planning/utils/amountUtils';
import { soundService } from '@/lib/SoundService';
import { toast } from 'sonner';

interface CommitmentDetailSheetProps {
  commitmentId: string;
  onClose: () => void;
  onEdit: () => void;
}

export function CommitmentDetailSheet({ commitmentId: id, onClose, onEdit }: CommitmentDetailSheetProps) {
  const commitment = useCommitment(id);
  const payments = useCommitmentPayments(id);
  const [showHistory, setShowHistory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pausePeriods, setPausePeriods] = useState<number | ''>('');
  const [pausing, setPausing] = useState(false);

  const handlePause = async (indefinite: boolean) => {
    if (pausing) return;
    
    let untilDate: string | null = null;
    
    if (!indefinite) {
      if (typeof pausePeriods !== 'number' || pausePeriods <= 0) {
         toast.error("Por favor ingresa un número válido mayor a 0.");
         return;
      }
      const now = new Date();
      if (commitment?.periodicity === 'MONTHLY') {
        now.setMonth(now.getMonth() + pausePeriods);
      } else if (commitment?.periodicity === 'WEEKLY') {
        now.setDate(now.getDate() + (pausePeriods * 7));
      } else if (commitment?.periodicity === 'BIWEEKLY') {
        now.setDate(now.getDate() + (pausePeriods * 14));
      } else if (commitment?.periodicity === 'DAILY') {
        now.setDate(now.getDate() + pausePeriods);
      } else if (commitment?.periodicity === 'YEARLY') {
        now.setFullYear(now.getFullYear() + pausePeriods);
      }
      untilDate = now.toISOString();
    }
    
    setPausing(true);
    try {
      await PlanningService.pauseCommitment(id, untilDate);
      soundService.play('success');
      setShowPauseModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setPausing(false);
    }
  };

  const handleHardDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await PlanningService.hardDeleteCommitment(id);
      soundService.play('delete');
      onClose();
    } catch (e) {
      console.error(e);
      setDeleting(false);
    }
  };

  const handleCancelFuture = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await PlanningService.cancelFutureCommitments(id);
      soundService.play('delete');
      onClose();
    } catch (e) {
      console.error(e);
      setDeleting(false);
    }
  };

  if (!commitment) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col p-4 animate-in slide-in-from-right duration-300">
        <div className="flex h-screen items-center justify-center text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  const firstDue = new Date(commitment.firstDueDate);

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="flex flex-col gap-6 w-full pb-16 min-h-screen px-4 max-w-md mx-auto relative pt-4">
        {/* Header */}
        <div className="flex items-center gap-3 mt-2 sticky top-4 z-10 bg-background/80 backdrop-blur-sm p-2 rounded-2xl border border-border/50 shadow-sm">
          <button
            onClick={onClose}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">
              {commitment.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {COMMITMENT_TYPE_LABELS[commitment.type]}
            </p>
          </div>
          <button
            onClick={onEdit}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Editar"
          >
            <Pencil className="w-5 h-5" />
          </button>
        </div>

        {/* Main card */}
        <div className="bg-card rounded-3xl border border-border/50 shadow-sm p-5 flex flex-col gap-4">
          {/* Amount */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                {commitment.isRecurring ? 'Monto mensual' : 'Por cuota'}
              </p>
              <p className="text-3xl font-bold text-foreground flex items-center">
                <MoneyDisplay amount={commitment.installmentAmount} />
              </p>
            </div>
            <div className="text-right">
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  commitment.status === 'ACTIVE'
                    ? 'bg-success/10 text-success'
                    : commitment.status === 'COMPLETED'
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-gold/10 text-gold'
                }`}
              >
                {STATUS_LABELS[commitment.status]}
              </span>
            </div>
          </div>

          {/* Progress bar for installments */}
          {!commitment.isRecurring && commitment.installments && (
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Cuota {commitment.currentInstallment} de {commitment.installments}</span>
                {commitment.remainingAmount !== null && (
                  <span className="flex items-center gap-1">Resta <MoneyDisplay amount={
                    commitment.amountTotal && commitment.installmentAmount
                      ? calcRemainingAmount(commitment.amountTotal, commitment.currentInstallment || 0, commitment.installmentAmount)
                      : (commitment.remainingAmount || 0)
                  } /></span>
                )}
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, ((commitment.currentInstallment || 0) / commitment.installments) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Details */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-muted/60 rounded-2xl p-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                Periodicidad
              </p>
              <p className="text-sm font-semibold text-foreground">
                {PERIODICITY_LABELS[commitment.periodicity]}
              </p>
            </div>
            <div className="bg-muted/60 rounded-2xl p-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                Primer vencimiento
              </p>
              <p className="text-sm font-semibold text-foreground">
                {formatFullDate(firstDue)}
              </p>
            </div>
            {commitment.amountTotal && (
              <div className="bg-muted/60 rounded-2xl p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                  Total comprometido
                </p>
                <p className="text-sm font-semibold text-foreground flex items-center">
                  <MoneyDisplay amount={commitment.amountTotal} />
                </p>
              </div>
            )}
            {commitment.hasReminder && (
              <div className="bg-muted/60 rounded-2xl p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                  Recordatorio
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {commitment.reminderDaysBefore === 0
                    ? 'El mismo día'
                    : `${commitment.reminderDaysBefore} días antes`}
                </p>
              </div>
            )}
          </div>

          {commitment.notes && (
            <div className="bg-muted/40 rounded-2xl p-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Notas
              </p>
              <p className="text-sm text-foreground">{commitment.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowHistory(true)}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-muted text-foreground text-sm font-semibold hover:bg-muted/80 transition-colors"
          >
            <History className="w-4 h-4" />
            Ver historial de pagos ({payments.length})
          </button>

          {commitment.status === 'ACTIVE' && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowPauseModal(true)}
                className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl text-primary text-sm font-semibold hover:bg-primary/5 transition-colors border border-primary/20"
              >
                <PauseCircle className="w-4 h-4" />
                Pausar
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl text-destructive text-sm font-semibold hover:bg-destructive/5 transition-colors border border-destructive/20"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          )}
        </div>

        {/* History sheet */}
        {showHistory && (
          <PaymentHistorySheet
            commitment={commitment}
            payments={payments}
            onClose={() => setShowHistory(false)}
          />
        )}

        {/* Delete confirm */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border shadow-lg rounded-3xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className="mx-auto w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Eliminar compromiso</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Elige cómo deseas proceder. Esta acción no se puede deshacer.
                </p>
                
                <div className="flex flex-col gap-3 text-left">
                  <button
                    onClick={handleCancelFuture}
                    disabled={deleting}
                    className="w-full p-3 rounded-2xl border border-border hover:bg-muted transition-colors"
                  >
                    <p className="font-semibold text-sm">Cancelar futuros</p>
                    <p className="text-xs text-muted-foreground mt-1">Conserva el historial de cuotas pagadas pero no genera más a futuro. Lo marca como cancelado.</p>
                  </button>

                  <button
                    onClick={handleHardDelete}
                    disabled={deleting}
                    className="w-full p-3 rounded-2xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors"
                  >
                    <p className="font-semibold text-sm text-destructive">Eliminar completamente</p>
                    <p className="text-xs text-muted-foreground mt-1">Elimina todo rastro, cuotas, e historial de pagos. ¡Acción irreversible!</p>
                  </button>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="w-full h-12 rounded-full border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors"
                  >
                    Volver
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pause Modal */}
        {showPauseModal && (
          <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border shadow-lg rounded-3xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                  <PauseCircle className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Pausar compromiso</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  El compromiso no generará cuotas durante este tiempo.
                </p>
                
                <div className="flex flex-col gap-3 text-left">
                  <button
                    onClick={() => handlePause(true)}
                    disabled={pausing}
                    className="w-full p-3 rounded-2xl border border-border hover:bg-muted transition-colors"
                  >
                    <p className="font-semibold text-sm">Pausa indefinida</p>
                    <p className="text-xs text-muted-foreground mt-1">Hasta que lo reactives manualmente.</p>
                  </button>

                  <div className="p-3 rounded-2xl border border-border flex flex-col gap-2">
                    <p className="font-semibold text-sm">Pausar temporalmente</p>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        min="1" 
                        max="12" 
                        value={pausePeriods}
                        onChange={(e) => setPausePeriods(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-16 h-10 rounded-lg border border-border bg-background px-3 text-sm text-center"
                      />
                      <span className="text-sm text-muted-foreground">períodos</span>
                    </div>
                    <button
                      onClick={() => handlePause(false)}
                      disabled={pausing}
                      className="mt-2 w-full h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                    >
                      Pausar
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => setShowPauseModal(false)}
                    disabled={pausing}
                    className="w-full h-12 rounded-full border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors"
                  >
                    Volver
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
