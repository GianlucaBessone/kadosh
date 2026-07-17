'use client';

import { useState } from 'react';
import { CheckCircle2, Clock, Circle, Trash2 } from 'lucide-react';
import { MoneyDisplay } from '@/components/ui/MoneyDisplay';
import type { CommitmentPayment, FinancialCommitment } from '@/lib/db';
import { formatShortDate } from '../utils/dateUtils';
import { PlanningService } from '../services/planningService';

interface PaymentHistorySheetProps {
  commitment: FinancialCommitment;
  payments: CommitmentPayment[];
  onClose: () => void;
}

export function PaymentHistorySheet({ commitment, payments, onClose }: PaymentHistorySheetProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const isRecurring = commitment.isRecurring ?? (commitment.type === 'SUBSCRIPTION' || commitment.type === 'SERVICE' || !commitment.installments);
  const totalInstallments = commitment.installments ?? '∞';
  const currentInstallment = commitment.currentInstallment ?? payments.length;
  const paidSet = new Set(payments.map(p => p.installmentNumber));

  // Build a full list of installment slots
  const slots = isRecurring
      ? payments.map((_, i) => i + 1)
      : Array.from({ length: commitment.installments ?? 0 }, (_, i) => i + 1);

  const handleDelete = async (paymentId: string) => {
    if (deletingId) return;
    setDeletingId(paymentId);
    try {
      await PlanningService.deletePayment(paymentId);
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t border-border/50 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[75vh] flex flex-col max-w-md mx-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 border-b border-border/40">
          <h3 className="text-lg font-semibold text-foreground">{commitment.name}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isRecurring
              ? `${payments.length} pagos registrados`
              : `${currentInstallment} de ${totalInstallments} cuotas pagadas`}
          </p>
        </div>

        {/* History list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-0">
          {slots.length === 0 && payments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aún no hay pagos registrados.
            </p>
          )}

          {payments.map((payment, index) => (
            <div key={payment.id} className="flex items-center gap-4 py-3.5 relative">
              {/* Timeline line */}
              {index < payments.length - 1 && (
                <div className="absolute left-[19px] top-[50%] bottom-0 w-px bg-border/60" />
              )}

              {/* Status icon */}
              <div className="relative z-10 flex-none">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-success" strokeWidth={1.5} />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {commitment.isRecurring ? `Pago ${index + 1}` : `Cuota ${payment.installmentNumber}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatShortDate(new Date(payment.date))}
                </p>
                {payment.notes && (
                  <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{payment.notes}</p>
                )}
              </div>

              {/* Amount & Actions */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  <MoneyDisplay amount={payment.amount} />
                </span>
                <button
                  onClick={() => setConfirmDeleteId(payment.id)}
                  disabled={deletingId === payment.id}
                  className="p-1.5 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                  aria-label="Eliminar pago"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Pending installments (non-recurring only) */}
          {!commitment.isRecurring &&
            slots
              .filter(n => !paidSet.has(n))
              .slice(0, 5)
              .map(n => (
                <div key={`pending-${n}`} className="flex items-center gap-4 py-3.5 opacity-40">
                  <div className="flex-none w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Circle className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Cuota {n}</p>
                    <p className="text-xs text-muted-foreground">Pendiente</p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    <MoneyDisplay amount={commitment.installmentAmount} />
                  </span>
                </div>
              ))}
        </div>

        {/* Close button */}
        <div className="px-5 pb-8 pt-3 border-t border-border/40">
          <button
            onClick={onClose}
            className="w-full h-12 rounded-2xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 p-6">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-xl border border-border/50 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-foreground mb-2">Eliminar pago</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              ¿Estás seguro de que querés eliminar este pago? El monto se devolverá al balance de tu cuenta y la cuota volverá a estar pendiente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={!!deletingId}
                className="flex-1 h-12 rounded-2xl bg-muted text-foreground font-semibold hover:bg-muted/80 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={!!deletingId}
                className="flex-1 h-12 rounded-2xl bg-destructive text-destructive-foreground font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {deletingId === confirmDeleteId ? (
                  <Clock className="w-5 h-5 animate-pulse" />
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
