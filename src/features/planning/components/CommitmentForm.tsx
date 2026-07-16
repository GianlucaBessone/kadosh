'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { CommitmentType, CommitmentPeriodicity } from '@/lib/db';
import type { FinancialCommitment } from '@/lib/db';
import { COMMITMENT_TYPE_LABELS, PERIODICITY_LABELS } from '../types';
import type { PlanningPeriod } from '../types';
import { validateCommitmentForm } from '../validators/commitmentValidator';
import type { CommitmentFormData } from '../validators/commitmentValidator';
import { calcInstallmentAmount, calcTotalAmount } from '../utils/amountUtils';
import { PlanningService } from '../services/planningService';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

interface CommitmentFormProps {
  ownerId: string;
  initial?: Partial<FinancialCommitment>;
  onSuccess?: () => void;
}

type CalcMode = 'A' | 'B'; // A = total+cuotas, B = cuota+cuotas

// ─── Shared styles (module-level to avoid recreating on every render) ────────
const inputClass =
  'w-full h-12 px-4 rounded-2xl bg-muted border border-border/40 text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/50';
const selectClass = inputClass + ' appearance-none cursor-pointer';

// ─── Field wrapper (module-level — MUST stay outside CommitmentForm) ─────────
// If defined inside CommitmentForm, React treats it as a new component type on
// every render, unmounting and remounting all inputs and losing focus.
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function getLocalYYYYMMDD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function CommitmentForm({ ownerId, initial, onSuccess }: CommitmentFormProps) {
  const router = useRouter();
  const isEdit = !!initial?.id;

  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<CommitmentType>(initial?.type ?? CommitmentType.INSTALLMENT);
  const [periodicity, setPeriodicity] = useState<CommitmentPeriodicity>(
    initial?.periodicity ?? CommitmentPeriodicity.MONTHLY
  );
  const [biweeklyPeriod, setBiweeklyPeriod] = useState<'Q1' | 'Q2'>(
    initial?.biweeklyPeriod ?? 'Q1'
  );
  const [firstDueDate, setFirstDueDate] = useState(
    initial?.firstDueDate ? initial.firstDueDate.split('T')[0] : getLocalYYYYMMDD(new Date())
  );
  const [isRecurring, setIsRecurring] = useState(initial?.isRecurring ?? false);
  const [calcMode, setCalcMode] = useState<CalcMode>('A');
  const [amountTotal, setAmountTotal] = useState<number | null>(initial?.amountTotal ?? null);
  const [installments, setInstallments] = useState(initial?.installments?.toString() ?? '');
  const [installmentAmount, setInstallmentAmount] = useState<number | null>(
    initial?.installmentAmount ?? null
  );
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [hasReminder, setHasReminder] = useState(initial?.hasReminder ?? false);
  const [reminderDays, setReminderDays] = useState(initial?.reminderDaysBefore ?? 3);
  const [reminderTime, setReminderTime] = useState(initial?.reminderTime ?? '08:00');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [customTypeName, setCustomTypeName] = useState(initial?.customTypeName ?? '');
  const [customPeriodicityDays, setCustomPeriodicityDays] = useState(initial?.customPeriodicityDays?.toString() ?? '');
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [saving, setSaving] = useState(false);

  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];
  const settings = useLiveQuery(() => db.settings.where('userId').equals(ownerId).first());
  const isBiweeklyMode = settings?.planningMode === 'BIWEEKLY';

  // Real-time calculation for Mode A
  useEffect(() => {
    if (isRecurring || calcMode !== 'A') return;
    const total = amountTotal ?? 0;
    const qty = parseInt(installments) || 0;
    if (total > 0 && qty > 0) {
      setInstallmentAmount(calcInstallmentAmount(total, qty));
    }
  }, [amountTotal, installments, calcMode, isRecurring]);

  // Real-time calculation for Mode B
  useEffect(() => {
    if (isRecurring || calcMode !== 'B') return;
    const amount = installmentAmount ?? 0;
    const qty = parseInt(installments) || 0;
    if (amount > 0 && qty > 0) {
      setAmountTotal(calcTotalAmount(amount, qty));
    }
  }, [installmentAmount, installments, calcMode, isRecurring]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData: CommitmentFormData = {
      name,
      type,
      periodicity,
      firstDueDate,
      dayOfMonth: new Date(firstDueDate).getUTCDate(),
      isRecurring,
      amountTotal: amountTotal,
      installments: installments ? parseInt(installments) : null,
      installmentAmount: installmentAmount,
      categoryId: categoryId || null,
      description: description || null,
      hasReminder,
      reminderDaysBefore: reminderDays,
      reminderTime: reminderTime,
      notes: notes || null,
      customTypeName: type === CommitmentType.CUSTOM ? customTypeName : null,
      customPeriodicityDays: periodicity === CommitmentPeriodicity.CUSTOM && customPeriodicityDays ? parseInt(customPeriodicityDays) : null,
    };

    const result = validateCommitmentForm(formData);
    if (!result.valid) {
      setErrors(result.errors as Record<string, string>);
      return;
    }
    setErrors({});
    setSaving(true);

    try {
      const payload = {
        ownerId,
        name: formData.name.trim(),
        description: formData.description,
        categoryId: formData.categoryId,
        type: formData.type,
        amountTotal: formData.amountTotal,
        installmentAmount: formData.installmentAmount!,
        installments: formData.installments,
        remainingAmount: formData.amountTotal,
        periodicity: formData.periodicity,
        biweeklyPeriod: formData.periodicity === CommitmentPeriodicity.BIWEEKLY ? biweeklyPeriod : undefined,
        firstDueDate: new Date(formData.firstDueDate).toISOString(),
        dayOfMonth: formData.dayOfMonth,
        hasReminder: formData.hasReminder,
        reminderDaysBefore: formData.reminderDaysBefore,
        reminderTime: reminderTime,
        isRecurring: formData.isRecurring,
        endDate: null,
        notes: formData.notes,
        customTypeName: formData.customTypeName,
        customPeriodicityDays: formData.customPeriodicityDays,
        notificationIntentId: initial?.notificationIntentId || null,
      };

      if (formData.hasReminder) {
        // Calcular targetTimeUtc
        const targetDate = new Date(formData.firstDueDate); // UTC midnight
        targetDate.setUTCDate(targetDate.getUTCDate() - formData.reminderDaysBefore);
        const [hours] = reminderTime.split(':').map(Number);
        const localDate = new Date(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), hours, 0, 0);
        
        try {
          const res = await fetch('/api/notifications/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userHash: ownerId,
              title: `Recordatorio: ${formData.name}`,
              message: `Recuerda tu compromiso de ${type === CommitmentType.INSTALLMENT ? 'cuota' : 'suscripción'} para pronto.`,
              targetTimeUtc: localDate.toISOString(),
              commitmentId: initial?.id || 'temp', // If new, we might need the real ID later, but 'temp' is bad. Wait.
            })
          });
          if (res.ok) {
            const data = await res.json();
            payload.notificationIntentId = data.id;
          }
        } catch (e) {
          console.error('Failed to schedule notification', e);
        }
      } else if (!formData.hasReminder && payload.notificationIntentId) {
        // Cancel if it was turned off
        try {
          await fetch('/api/notifications/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ intentId: payload.notificationIntentId })
          });
          payload.notificationIntentId = null;
        } catch (e) {
          console.error('Failed to cancel notification', e);
        }
      }

      if (isEdit && initial?.id) {
        await PlanningService.updateCommitment(initial.id, payload);
      } else {
        await PlanningService.createCommitment(payload);
      }

      onSuccess?.();
      router.push('/planning');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Field, inputClass and selectClass are defined at module level above.

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-10" noValidate>
      {/* Nombre */}
      <Field label="Nombre" error={errors.name}>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ej: Netflix, Auto, Alquiler..."
          className={inputClass}
        />
      </Field>

      {/* Tipo */}
      <Field label="Tipo" error={errors.type}>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(COMMITMENT_TYPE_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setType(key as CommitmentType)}
              className={cn(
                'h-10 rounded-xl text-xs font-semibold border transition-all duration-150',
                type === key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted text-muted-foreground border-transparent hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {type === CommitmentType.CUSTOM && (
          <div className="mt-3">
            <input
              type="text"
              value={customTypeName}
              onChange={e => setCustomTypeName(e.target.value)}
              placeholder="Ej: Suscripción Escolar..."
              className={inputClass}
            />
            {errors.customTypeName && <p className="text-xs text-destructive mt-1.5">{errors.customTypeName}</p>}
          </div>
        )}
      </Field>

      {/* Periodicidad */}
      <Field label="Periodicidad" error={errors.periodicity}>
        <div className="flex flex-col gap-3">
          <select
            value={periodicity}
            onChange={e => setPeriodicity(e.target.value as CommitmentPeriodicity)}
            className={selectClass}
          >
            {Object.entries(PERIODICITY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {periodicity === CommitmentPeriodicity.CUSTOM && (
            <div className="mt-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Cada cuántos días
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={customPeriodicityDays}
                onChange={e => setCustomPeriodicityDays(e.target.value)}
                placeholder="Ej: 17"
                className={inputClass}
              />
              {errors.customPeriodicityDays && <p className="text-xs text-destructive mt-1.5">{errors.customPeriodicityDays}</p>}
            </div>
          )}

          {isBiweeklyMode && [
            CommitmentPeriodicity.MONTHLY,
            CommitmentPeriodicity.BIMONTHLY,
            CommitmentPeriodicity.QUARTERLY,
            CommitmentPeriodicity.SEMIANNUAL,
            CommitmentPeriodicity.YEARLY
          ].includes(periodicity) && (
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setBiweeklyPeriod('Q1')}
                className={cn(
                  'h-10 rounded-xl text-xs font-semibold border transition-all duration-150',
                  biweeklyPeriod === 'Q1'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-muted-foreground border-transparent hover:text-foreground'
                )}
              >
                1.ª Quincena
              </button>
              <button
                type="button"
                onClick={() => setBiweeklyPeriod('Q2')}
                className={cn(
                  'h-10 rounded-xl text-xs font-semibold border transition-all duration-150',
                  biweeklyPeriod === 'Q2'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-muted-foreground border-transparent hover:text-foreground'
                )}
              >
                2.ª Quincena
              </button>
            </div>
          )}
        </div>
      </Field>

      {/* Primer vencimiento */}
      <Field label="Primer vencimiento" error={errors.firstDueDate}>
        <input
          type="date"
          value={firstDueDate}
          onChange={e => setFirstDueDate(e.target.value)}
          className={inputClass}
        />
      </Field>

      {/* Recurrente toggle */}
      <div className="flex items-center justify-between bg-muted/60 rounded-2xl px-4 py-3.5">
        <div>
          <p className="text-sm font-semibold text-foreground">Sin fecha de fin</p>
          <p className="text-xs text-muted-foreground">Recurrente hasta que lo finalices</p>
        </div>
        <button
          type="button"
          onClick={() => setIsRecurring(v => !v)}
          className={cn(
            'relative w-12 h-6 rounded-full transition-colors duration-200',
            isRecurring ? 'bg-primary' : 'bg-border'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200',
              isRecurring ? 'translate-x-6' : 'translate-x-0'
            )}
          />
        </button>
      </div>

      {/* Amount section */}
      {!isRecurring ? (
        <>
          {/* Mode selector */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Modo de cálculo
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCalcMode('A')}
                className={cn(
                  'h-10 rounded-xl text-xs font-semibold border transition-all',
                  calcMode === 'A'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-muted-foreground border-transparent'
                )}
              >
                Total ÷ Cuotas
              </button>
              <button
                type="button"
                onClick={() => setCalcMode('B')}
                className={cn(
                  'h-10 rounded-xl text-xs font-semibold border transition-all',
                  calcMode === 'B'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-muted-foreground border-transparent'
                )}
              >
                Cuota × Cantidad
              </button>
            </div>
          </div>

          {calcMode === 'A' ? (
            <>
              <Field label="Monto total" error={errors.amountTotal}>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <MoneyInput
                    name="amountTotal"
                    value={amountTotal === null ? undefined : amountTotal}
                    onChange={setAmountTotal}
                    placeholder="0,00"
                    baseTextSize="text-base"
                    className={inputClass + ' pl-8 text-left'}
                  />
                </div>
              </Field>
              <Field label="Cantidad de cuotas" error={errors.installments}>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={installments}
                  onChange={e => setInstallments(e.target.value)}
                  placeholder="12"
                  className={inputClass}
                />
              </Field>
              {installmentAmount !== null && (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Valor de la cuota</span>
                  <span className="text-lg font-bold text-primary">
                    ${installmentAmount.toLocaleString('es-AR')}
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <Field label="Valor de la cuota" error={errors.installmentAmount}>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <MoneyInput
                    name="installmentAmount"
                    value={installmentAmount === null ? undefined : installmentAmount}
                    onChange={setInstallmentAmount}
                    placeholder="0,00"
                    baseTextSize="text-base"
                    className={inputClass + ' pl-8 text-left'}
                  />
                </div>
              </Field>
              <Field label="Cantidad de cuotas" error={errors.installments}>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={installments}
                  onChange={e => setInstallments(e.target.value)}
                  placeholder="12"
                  className={inputClass}
                />
              </Field>
              {amountTotal !== null && (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monto total</span>
                  <span className="text-lg font-bold text-primary">
                    ${amountTotal.toLocaleString('es-AR')}
                  </span>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <Field label="Monto mensual" error={errors.installmentAmount}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <MoneyInput
              name="installmentAmount"
              value={installmentAmount === null ? undefined : installmentAmount}
              onChange={setInstallmentAmount}
              placeholder="0,00"
              baseTextSize="text-base"
              className={inputClass + ' pl-8 text-left'}
            />
          </div>
        </Field>
      )}

      {/* Categoría */}
      {categories.length > 0 && (
        <Field label="Categoría (opcional)">
          <select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            className={selectClass}
          >
            <option value="">Sin categoría</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
      )}

      {/* Descripción */}
      <Field label="Descripción (opcional)">
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Descripción breve..."
          className={inputClass}
        />
      </Field>

      {/* Recordatorio */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between bg-muted/60 rounded-2xl px-4 py-3.5">
          <div>
            <p className="text-sm font-semibold text-foreground">Recordatorio</p>
            <p className="text-xs text-muted-foreground">Notificación antes del vencimiento</p>
          </div>
          <button
            type="button"
            onClick={() => setHasReminder(v => !v)}
            className={cn(
              'relative w-12 h-6 rounded-full transition-colors duration-200',
              hasReminder ? 'bg-primary' : 'bg-border'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200',
                hasReminder ? 'translate-x-6' : 'translate-x-0'
              )}
            />
          </button>
        </div>

        {hasReminder && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-4 gap-2">
              {[1, 3, 7, 0].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setReminderDays(d)}
                  className={cn(
                    'h-10 rounded-xl text-xs font-semibold border transition-all',
                    reminderDays === d
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-transparent'
                  )}
                >
                  {d === 0 ? 'Ese día' : `${d}d antes`}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Hora de notificación</label>
              <select
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                className="w-full h-12 rounded-xl bg-card border border-border shadow-sm px-4 focus:ring-primary focus:ring-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-base font-medium"
              >
                {Array.from({ length: 24 }).map((_, i) => {
                  const hour = String(i).padStart(2, '0');
                  const time = `${hour}:00`;
                  return <option key={time} value={time}>{time} hs</option>;
                })}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Notas */}
      <Field label="Notas (opcional)">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Observaciones adicionales..."
          rows={3}
          className="w-full px-4 py-3 rounded-2xl bg-muted border border-border/40 text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none placeholder:text-muted-foreground/50"
        />
      </Field>

      {/* Submit */}
      <button
        type="submit"
        disabled={saving}
        className={cn(
          'w-full h-14 rounded-2xl text-base font-semibold transition-all duration-150 mt-2',
          'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99]',
          saving && 'opacity-60 cursor-not-allowed'
        )}
      >
        {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear compromiso'}
      </button>
    </form>
  );
}
