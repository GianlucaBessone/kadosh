/**
 * Re-exports and extra types for the Planning feature.
 * Enums and core interfaces live in `src/lib/db.ts` to keep Dexie
 * table definitions and TypeScript types in a single source of truth.
 */

export {
  CommitmentType,
  CommitmentPeriodicity,
  CommitmentStatus,
  type FinancialCommitment,
  type CommitmentPayment,
} from '@/lib/db';

// ─── Derived / view-only types ──────────────────────────────────────────────

export type PlanningPeriod = 'MONTH' | 'Q1' | 'Q2';


export interface MonthlyCommitmentItem {
  commitment: import('@/lib/db').FinancialCommitment;
  dueDate: Date;
  installmentIndex: number;
}

/** Result of simulating a month's financial balance */
export interface MonthlySimulation {
  month: number; // 1-12
  year: number;
  commitments: MonthlyCommitmentItem[];
  totalCommitted: number;
  incomeExpected: number;
  additionalIncome: number;
  extraordinaryExpenses: number;
  desiredSavings: number;
  titheEstimate: number;
  projectedBalance: number;
  percentageCommitted: number;
  savingsCapacity: number;
  isPositive: boolean;
}

/** Labels shown in the UI for CommitmentType */
export const COMMITMENT_TYPE_LABELS: Record<import('@/lib/db').CommitmentType, string> = {
  INSTALLMENT: 'Cuotas',
  SUBSCRIPTION: 'Suscripción',
  SERVICE: 'Servicio',
  LOAN: 'Préstamo',
  TAX: 'Impuesto',
  RENT: 'Alquiler',
  INSURANCE: 'Seguro',
  UTILITY: 'Servicio básico',
  CUSTOM: 'Personalizado',
};

/** Labels shown in the UI for CommitmentPeriodicity */
export const PERIODICITY_LABELS: Record<import('@/lib/db').CommitmentPeriodicity, string> = {
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
  BIMONTHLY: 'Bimestral',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  YEARLY: 'Anual',
  BIWEEKLY: 'Quincenal',
  CUSTOM: 'Personalizado',
};

/** Labels shown in the UI for CommitmentStatus */
export const STATUS_LABELS: Record<import('@/lib/db').CommitmentStatus, string> = {
  ACTIVE: 'Activo',
  PAUSED: 'Pausado',
  COMPLETED: 'Finalizado',
  CANCELLED: 'Cancelado',
};
