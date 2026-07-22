import { CommitmentType, CommitmentPeriodicity } from '@/lib/db';

export interface CommitmentFormData {
  name: string;
  type: CommitmentType;
  periodicity: CommitmentPeriodicity;
  firstDueDate: string;
  dayOfMonth: number | null;
  isRecurring: boolean;
  // Mode A
  amountTotal: number | null;
  installments: number | null;
  // Mode B / direct
  installmentAmount: number | null;
  categoryId: string | null;
  description: string | null;
  hasReminder: boolean;
  reminderDaysBefore: number;
  reminderTime?: string;
  notes: string | null;
  customPeriodicityDays?: number | null;
  customTypeName?: string | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof CommitmentFormData, string>>;
}

export function validateCommitmentForm(data: CommitmentFormData): ValidationResult {
  const errors: Partial<Record<keyof CommitmentFormData, string>> = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'El nombre debe tener al menos 2 caracteres.';
  }

  if (!data.type) {
    errors.type = 'Seleccioná un tipo de compromiso.';
  }

  if (!data.periodicity) {
    errors.periodicity = 'Seleccioná la periodicidad.';
  } else if (data.periodicity === CommitmentPeriodicity.CUSTOM) {
    if (!data.customPeriodicityDays || data.customPeriodicityDays < 1) {
      errors.customPeriodicityDays = 'Ingresá una cantidad de días válida.';
    }
  }

  if (data.type === CommitmentType.CUSTOM && (!data.customTypeName || data.customTypeName.trim().length < 2)) {
    errors.customTypeName = 'Ingresá un nombre para el tipo personalizado.';
  }

  if (!data.firstDueDate) {
    errors.firstDueDate = 'Ingresá la fecha del primer vencimiento.';
  }

  if (!data.isRecurring) {
    if (!data.installments || data.installments < 1) {
      errors.installments = 'Ingresá la cantidad de cuotas.';
    }
    if (!data.amountTotal || data.amountTotal <= 0) {
      errors.amountTotal = 'El monto total debe ser mayor a 0.';
    }
    if (!data.installmentAmount || data.installmentAmount <= 0) {
      errors.installmentAmount = 'El valor de la cuota debe ser mayor a 0.';
    }
  } else {
    if (!data.installmentAmount || data.installmentAmount <= 0) {
      errors.installmentAmount = 'El monto mensual debe ser mayor a 0.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
