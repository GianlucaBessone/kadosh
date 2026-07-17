'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  MoreHorizontal,
  CheckCircle2,
  Pencil,
  RefreshCw,
  Tv,
  Zap,
  Landmark,
  Home,
  ShieldCheck,
  Droplet,
  FileText,
  CreditCard,
  Pin,
  Bell,
  BellOff,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoneyDisplay } from '@/components/ui/MoneyDisplay';
import { formatShortDate } from '../utils/dateUtils';
import { calcRemainingAmount } from '../utils/amountUtils';
import { COMMITMENT_TYPE_LABELS } from '../types';
import type { FinancialCommitment } from '@/lib/db';
import { CommitmentStatus, CommitmentType } from '@/lib/db';
import PaymentSuccessAnimation from './PaymentSuccessAnimation';
import { PlanningService } from '../services/planningService';
import { useCommitmentPayments } from '../hooks/usePlanningData';

interface CommitmentCardProps {
  commitment: FinancialCommitment;
  dueDate: Date;
  installmentNumber: number;
  onEdit?: () => void;
  onViewHistory?: () => void;
  onPaymentDone?: () => void;
  onUpdateAlarm?: (hasReminder: boolean, time: string, days: number) => Promise<void>;
}

import { ChevronDown, ChevronUp } from 'lucide-react';

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

export function CommitmentCard({
  commitment,
  dueDate,
  installmentNumber,
  onEdit,
  onViewHistory,
  onPaymentDone,
  onUpdateAlarm,
}: CommitmentCardProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showAlarmDialog, setShowAlarmDialog] = useState(false);
  
  const [tempHasReminder, setTempHasReminder] = useState(commitment.hasReminder);
  const [tempReminderTime, setTempReminderTime] = useState(commitment.reminderTime || '08:00');
  const [tempReminderDays, setTempReminderDays] = useState(commitment.reminderDaysBefore);
  const [showLatePayments, setShowLatePayments] = useState(false);

  const isCompleted = commitment.status === CommitmentStatus.COMPLETED || commitment.status === CommitmentStatus.CANCELLED;
  const isPaused = commitment.status === CommitmentStatus.PAUSED;
  const isRecurring = commitment.isRecurring;
  const hasInstallments = !isRecurring && commitment.installments !== null;
  const IconComponent = TYPE_ICONS[commitment.type] ?? Pin;
  const typeLabel = commitment.type === CommitmentType.CUSTOM && commitment.customTypeName 
    ? commitment.customTypeName 
    : COMMITMENT_TYPE_LABELS[commitment.type];

  const payments = useCommitmentPayments(commitment.id);
  const isPaid = payments.some(p => p.installmentNumber === installmentNumber);

  const pastUnpaidInstallments = useMemo(() => {
    const unpaid = [];
    for (let i = 1; i < installmentNumber; i++) {
      if (!payments.some(p => p.installmentNumber === i)) {
        unpaid.push(i);
      }
    }
    return unpaid;
  }, [installmentNumber, payments]);

  const totalAtrasado = pastUnpaidInstallments.length * commitment.installmentAmount;
  const totalAPagar = totalAtrasado + (isPaid ? 0 : commitment.installmentAmount);

  // eslint-disable-next-line react-hooks/purity
  const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysUntil < 0;
  const isUrgent = daysUntil >= 0 && daysUntil <= 3;

  const handleRegisterPayment = async () => {
    if (registering) return;
    setRegistering(true);
    try {
      await PlanningService.registerPayment(commitment.id, installmentNumber);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onPaymentDone?.();
      }, 1800);
    } catch (e) {
      console.error('Payment failed', e);
    } finally {
      setRegistering(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a')) {
      return;
    }
    setShowOptions(v => !v);
  };

  return (
    <>
      {showSuccess && <PaymentSuccessAnimation />}

      <div
        onClick={handleCardClick}
        className={cn(
          'relative bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-md hover:border-border/80',
          isCompleted && 'opacity-60',
          isPaused && 'border-dashed'
        )}
      >
        {/* Urgency / overdue indicator */}
        {(isUrgent || isOverdue) && !isCompleted && (
          <>
            <div
              className={cn(
                'absolute -top-4 left-0 right-0 h-8 opacity-20 blur-xl',
                isOverdue ? 'bg-destructive' : 'bg-gold'
              )}
            />
          </>
        )}

        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-none">
                <IconComponent className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <Link href={`/planning/${commitment.id}`} className="hover:underline">
                  <h3 className="font-semibold text-foreground text-base leading-tight truncate">
                    {commitment.name}
                  </h3>
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">{typeLabel}</p>
              </div>
            </div>

          </div>

          {/* Description & Notes */}
          {(commitment.description || commitment.notes) && (
            <div className="mt-3 text-sm text-muted-foreground/90 leading-relaxed border-l-2 border-primary/20 pl-3">
              {commitment.description && <p>{commitment.description}</p>}
              {commitment.notes && <p className="italic text-xs mt-1">{commitment.notes}</p>}
            </div>
          )}

          {/* Installment info */}
          {hasInstallments && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Cuota {installmentNumber}/{commitment.installments}
              </span>
              {/* Progress bar */}
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/40 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, ((commitment.currentInstallment || 0) / commitment.installments!) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {isRecurring && (
            <div className="mt-2 flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Recurrente</span>
            </div>
          )}

          {/* Late Payments */}
          {pastUnpaidInstallments.length > 0 && !isCompleted && (
            <div className="mt-4 rounded-2xl bg-destructive/5 border border-destructive/10 overflow-hidden">
              <button 
                onClick={() => setShowLatePayments(v => !v)}
                className="w-full flex items-center justify-between p-3 text-destructive hover:bg-destructive/10 transition-colors"
              >
                <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                  Pagos atrasados ({pastUnpaidInstallments.length})
                </span>
                {showLatePayments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {showLatePayments && (
                <div className="p-3 pt-0 text-sm text-foreground animate-in slide-in-from-top-2">
                  <div className="flex flex-col gap-2 pt-2 border-t border-destructive/10">
                    {pastUnpaidInstallments.map(cuotaNum => (
                      <div key={cuotaNum} className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Cuota {cuotaNum}</span>
                        <span className="font-semibold text-destructive/80">
                          <MoneyDisplay amount={commitment.installmentAmount} />
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-destructive/10 font-bold text-destructive">
                      <span>Total Atrasado</span>
                      <MoneyDisplay amount={totalAtrasado} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Amount row */}
          <div className="mt-4 flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                {pastUnpaidInstallments.length > 0 ? 'Total a Pagar' : 'Cuota Actual'}
              </span>
              <span className="text-2xl font-bold text-foreground tracking-tight flex items-center">
                <MoneyDisplay amount={pastUnpaidInstallments.length > 0 ? totalAPagar : commitment.installmentAmount} />
              </span>
              {hasInstallments && commitment.remainingAmount !== null && commitment.remainingAmount !== undefined && !Number.isNaN(commitment.remainingAmount) && (
                <span className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  Restan <MoneyDisplay amount={
                    commitment.amountTotal && commitment.installmentAmount
                      ? calcRemainingAmount(commitment.amountTotal, commitment.currentInstallment || 0, commitment.installmentAmount)
                      : (commitment.remainingAmount || 0)
                  } />
                </span>
              )}
            </div>

            {/* Due date badge */}
            <div
              className={cn(
                'flex flex-col items-end gap-0.5',
                isOverdue ? 'text-destructive' : isUrgent ? 'text-gold' : 'text-muted-foreground'
              )}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider">Vence</span>
              <span className="text-sm font-bold">{formatShortDate(dueDate)}</span>
              {isOverdue && (
                <span className="text-[10px] font-medium">Vencido</span>
              )}
              {isUrgent && !isOverdue && (
                <span className="text-[10px] font-medium">
                  {daysUntil === 0 ? 'Hoy' : daysUntil === 1 ? 'Mañana' : `En ${daysUntil}d`}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          {!isCompleted && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleRegisterPayment}
                disabled={registering || isPaid}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 h-10 rounded-2xl text-sm font-semibold transition-all duration-150',
                  isPaid 
                    ? 'bg-success/20 text-success' 
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]',
                  (registering || isPaid) && 'opacity-60 cursor-not-allowed'
                )}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isPaid ? 'Pago registrado' : 'Registrar pago'}
              </button>

              {onEdit && (
                <button
                  onClick={onEdit}
                  className="flex items-center justify-center w-10 h-10 rounded-2xl bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  aria-label="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Options menu */}
          {showOptions && (
            <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
              <button
                onClick={() => { setShowAlarmDialog(true); setShowOptions(false); }}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {commitment.hasReminder ? (
                  <><Bell className="w-3.5 h-3.5 text-gold" /> {commitment.reminderTime || '08:00'} ({commitment.reminderDaysBefore === 0 ? 'Día' : `-${commitment.reminderDaysBefore}d`})</>
                ) : (
                  <><BellOff className="w-3.5 h-3.5" /> Sin alarma</>
                )}
              </button>

              {onViewHistory && (
                <button
                  onClick={() => { setShowOptions(false); onViewHistory(); }}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Ver pagos
                </button>
              )}

              <Link
                href={`/planning/${commitment.id}`}
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Ver detalles
              </Link>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showAlarmDialog} onOpenChange={setShowAlarmDialog}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">Configurar Notificación</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-6 mt-4">
            <div className="flex items-center justify-between bg-muted/60 rounded-2xl px-4 py-3.5">
              <div>
                <p className="text-sm font-semibold text-foreground">Recordatorio</p>
                <p className="text-xs text-muted-foreground">Activar para este compromiso</p>
              </div>
              <button
                type="button"
                onClick={() => setTempHasReminder(v => !v)}
                className={cn(
                  'relative w-12 h-6 rounded-full transition-colors duration-200',
                  tempHasReminder ? 'bg-primary' : 'bg-border'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200',
                    tempHasReminder ? 'translate-x-6' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            {tempHasReminder && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Anticipación</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 3, 7, 0].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setTempReminderDays(d)}
                        className={cn(
                          'h-10 rounded-xl text-xs font-semibold border transition-all',
                          tempReminderDays === d
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted text-muted-foreground border-transparent'
                        )}
                      >
                        {d === 0 ? 'Ese día' : `${d}d antes`}
                      </button>
                    ))}
                  </div>
                </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Hora de notificación</label>
                    <Select value={tempReminderTime} onValueChange={setTempReminderTime}>
                    <SelectTrigger className="w-full h-12 rounded-xl bg-card border border-border shadow-sm px-4 focus:ring-primary focus:ring-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-base font-medium">
                      <SelectValue placeholder="Seleccionar hora" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[250px]">
                      {Array.from({ length: 48 }).map((_, i) => {
                        const hour = String(Math.floor(i / 2)).padStart(2, '0');
                        const min = i % 2 === 0 ? '00' : '30';
                        const time = `${hour}:${min}`;
                        return (
                          <SelectItem key={time} value={time}>
                            {time} hs
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <button
              onClick={async () => {
                if (onUpdateAlarm) {
                  await onUpdateAlarm(!!tempHasReminder, tempReminderTime, tempReminderDays || 0);
                }
                setShowAlarmDialog(false);
              }}
              className="w-full h-12 rounded-full font-medium bg-gold hover:bg-gold/90 text-gold-foreground transition-colors"
            >
              Guardar Cambios
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
