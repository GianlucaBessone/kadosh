'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Pencil, Trash2, History } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useCommitment, useCommitmentPayments } from '@/features/planning/hooks/usePlanningData';
import { PaymentHistorySheet } from '@/features/planning/components/PaymentHistorySheet';
import { PlanningService } from '@/features/planning/services/planningService';
import { formatMoney } from '@/lib/utils';
import { COMMITMENT_TYPE_LABELS, PERIODICITY_LABELS, STATUS_LABELS } from '@/features/planning/types';
import { formatFullDate } from '@/features/planning/utils/dateUtils';
import Link from 'next/link';

export default function CommitmentDetailPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line
    setIsMounted(true);
  }, []);
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id || '';

  const commitment = useCommitment(id);
  const payments = useCommitmentPayments(id);
  const [showHistory, setShowHistory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await PlanningService.cancelCommitment(id);
      router.replace('/planning');
    } catch (e) {
      console.error(e);
      setDeleting(false);
    }
  };

  if (!isMounted) return null;

  if (!commitment) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Cargando...
      </div>
    );
  }

  const firstDue = new Date(commitment.firstDueDate);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={() => router.back()}
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
        <Link
          href={`/planning/${id}/edit`}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Editar"
        >
          <Pencil className="w-5 h-5" />
        </Link>
      </div>

      {/* Main card */}
      <div className="bg-card rounded-3xl border border-border/50 shadow-sm p-5 flex flex-col gap-4">
        {/* Amount */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
              {commitment.isRecurring ? 'Monto mensual' : 'Por cuota'}
            </p>
            <p className="text-3xl font-bold text-foreground">
              {formatMoney(commitment.installmentAmount)}
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
                <span>Resta {formatMoney(commitment.remainingAmount)}</span>
              )}
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, (commitment.currentInstallment / commitment.installments) * 100)}%`,
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
              <p className="text-sm font-semibold text-foreground">
                {formatMoney(commitment.amountTotal)}
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
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl text-destructive text-sm font-semibold hover:bg-destructive/5 transition-colors border border-destructive/20"
          >
            <Trash2 className="w-4 h-4" />
            Cancelar compromiso
          </button>
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
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border shadow-lg rounded-3xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-semibold mb-2">¿Cancelar compromiso?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Se marcará como cancelado y dejará de aparecer en tu planificación.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full h-12 rounded-full bg-destructive text-destructive-foreground font-semibold text-sm hover:bg-destructive/90 transition-colors"
                >
                  {deleting ? 'Cancelando...' : 'Sí, cancelar'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
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
  );
}
