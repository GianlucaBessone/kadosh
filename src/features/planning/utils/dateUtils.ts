import { CommitmentPeriodicity } from '@/lib/db';
import type { FinancialCommitment } from '@/lib/db';

/**
 * Given a commitment and a target month/year, returns the due date for that period.
 * Returns null if the commitment does not apply to that month.
 */
export function getDueDateForMonth(
  commitment: FinancialCommitment,
  month: number, // 1-12
  year: number
): Date | null {
  const first = new Date(commitment.firstDueDate);
  const firstMonth = first.getUTCMonth() + 1; // 1-12
  const firstYear = first.getUTCFullYear();

  // Target is before the first due date month → not applicable
  if (year < firstYear || (year === firstYear && month < firstMonth)) return null;

  // If commitment is completed/cancelled, check end date
  if (commitment.endDate) {
    const end = new Date(commitment.endDate);
    const endMonth = end.getUTCMonth() + 1;
    const endYear = end.getUTCFullYear();
    if (year > endYear || (year === endYear && month > endMonth)) return null;
  }

  const day = commitment.dayOfMonth ?? first.getUTCDate();
  const daysInMonth = new Date(year, month, 0).getDate();
  const actualDay = Math.min(day, daysInMonth);

  return new Date(year, month - 1, actualDay);
}

/**
 * Checks whether a given commitment applies (has a payment due) in a given month/year,
 * considering its periodicity.
 */
export function commitmentAppliesToMonth(
  commitment: FinancialCommitment,
  month: number, // 1-12
  year: number
): boolean {
  const first = new Date(commitment.firstDueDate);
  const firstMonth = first.getUTCMonth() + 1;
  const firstYear = first.getUTCFullYear();

  if (year < firstYear || (year === firstYear && month < firstMonth)) return false;

  // Check if commitment is still active for this month
  if (commitment.endDate) {
    const end = new Date(commitment.endDate);
    if (year > end.getUTCFullYear() || (year === end.getUTCFullYear() && month > end.getUTCMonth() + 1)) {
      return false;
    }
  }

  // Check installment count limit for non-recurring
  if (!commitment.isRecurring && commitment.installments !== null) {
    // How many periods have elapsed since start?
    const elapsed = monthsBetween(firstYear, firstMonth, year, month);
    const periodMultiplier = periodicityToMonths(commitment.periodicity);
    const periodIndex = Math.floor(elapsed / periodMultiplier);
    if (periodIndex >= commitment.installments) return false;
  }

  const elapsed = monthsBetween(firstYear, firstMonth, year, month);
  return isInPeriodicityCycle(elapsed, commitment.periodicity);
}

/** How many months elapsed from (fromYear, fromMonth) to (toYear, toMonth) */
export function monthsBetween(
  fromYear: number, fromMonth: number,
  toYear: number, toMonth: number
): number {
  return (toYear - fromYear) * 12 + (toMonth - fromMonth);
}

/** Returns true if the elapsed months fall on a payment cycle */
function isInPeriodicityCycle(elapsed: number, periodicity: CommitmentPeriodicity): boolean {
  const cycle = periodicityToMonths(periodicity);
  return elapsed >= 0 && elapsed % cycle === 0;
}

/** Converts periodicity to a month multiplier */
export function periodicityToMonths(periodicity: CommitmentPeriodicity): number {
  switch (periodicity) {
    case CommitmentPeriodicity.DAILY:
    case CommitmentPeriodicity.WEEKLY:
    case CommitmentPeriodicity.MONTHLY:
      return 1;
    case CommitmentPeriodicity.BIMONTHLY:
      return 2;
    case CommitmentPeriodicity.QUARTERLY:
      return 3;
    case CommitmentPeriodicity.SEMIANNUAL:
      return 6;
    case CommitmentPeriodicity.YEARLY:
      return 12;
    case CommitmentPeriodicity.CUSTOM:
      return 1;
  }
}

/** Returns the installment number (1-based) for a given month */
export function getInstallmentNumberForMonth(
  commitment: FinancialCommitment,
  month: number,
  year: number
): number {
  const first = new Date(commitment.firstDueDate);
  const elapsed = monthsBetween(first.getFullYear(), first.getMonth() + 1, year, month);
  const cycle = periodicityToMonths(commitment.periodicity);
  return Math.floor(elapsed / cycle) + 1;
}

/** Short formatted date string, e.g. "15 Ago" */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

/** Full formatted date string, e.g. "15 de agosto de 2026" */
export function formatFullDate(date: Date): string {
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Month name, e.g. "Agosto" */
export function monthName(month: number, year: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('es-AR', { month: 'long' });
}

/** Short month name, e.g. "Ago" */
export function shortMonthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleDateString('es-AR', { month: 'short' });
}
