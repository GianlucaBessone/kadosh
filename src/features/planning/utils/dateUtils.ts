import { CommitmentPeriodicity } from '@/lib/db';
import type { FinancialCommitment } from '@/lib/db';
import type { PlanningPeriod } from '@/features/planning/types';

export interface GeneratedInstallment {
  installmentIndex: number;
  dueDate: Date;
}

/**
 * Generates all applicable installments for a commitment within a specific month and year.
 */
export function generateInstallmentsForMonth(
  commitment: FinancialCommitment,
  targetMonth: number, // 1-12
  targetYear: number
): GeneratedInstallment[] {
  const first = new Date(commitment.firstDueDate);
  const firstDate = new Date(first.getUTCFullYear(), first.getUTCMonth(), first.getUTCDate());
  
  const results: GeneratedInstallment[] = [];
  
  let currentIndex = 0;
  let currentDate = firstDate;
  
  const targetEnd = new Date(targetYear, targetMonth, 0); // last day of target month
  const targetStart = new Date(targetYear, targetMonth - 1, 1);
  
  const endLimit = commitment.endDate ? new Date(commitment.endDate) : null;
  
  // Failsafe limit to avoid infinite loops in case of errors
  let iterations = 0;
  const MAX_ITERATIONS = 50000;
  
  while (currentDate <= targetEnd) {
    if (iterations++ > MAX_ITERATIONS) break;
    if (endLimit && currentDate > endLimit) break;
    if (!commitment.isRecurring && commitment.installments !== null && commitment.installments !== undefined && currentIndex >= commitment.installments) break;
    
    // Check if the current date falls within the target month
    if (currentDate >= targetStart && currentDate <= targetEnd) {
      // Check if it's not a past installment that has already been paid?
      // Wait, the status and currentInstallment are checked later or here?
      // For now we generate all theoretical dates that fall in this month. 
      // It's up to the caller to filter out paid ones if needed, but usually we just want to know if it's due this month.
      // Wait, if it's `isRecurring === false`, we skip if currentIndex < commitment.currentInstallment?
      // Actually, if it's paid, it still belongs to the month. We filter by status in the hooks.
      results.push({
        installmentIndex: currentIndex,
        dueDate: new Date(currentDate)
      });
    }
    
    // Calculate next date
    currentIndex++;
    currentDate = getNextDate(commitment, firstDate, currentIndex);
  }
  
  return results;
}

/**
 * Gets the exact due date for a specific installment index (0-based).
 */
export function getNextDate(
  commitment: FinancialCommitment,
  firstDate: Date,
  index: number
): Date {
  const periodicity = commitment.periodicity;
  
  if (periodicity === CommitmentPeriodicity.DAILY) {
    const next = new Date(firstDate);
    next.setDate(next.getDate() + index);
    return next;
  }
  
  if (periodicity === CommitmentPeriodicity.WEEKLY) {
    const next = new Date(firstDate);
    next.setDate(next.getDate() + index * 7);
    return next;
  }
  
  if (periodicity === CommitmentPeriodicity.CUSTOM) {
    const days = commitment.customPeriodicityDays ?? 1;
    const next = new Date(firstDate);
    next.setDate(next.getDate() + index * days);
    return next;
  }
  
  if (periodicity === CommitmentPeriodicity.BIWEEKLY) {
    const firstDay = firstDate.getDate();
    const isFirstQ2 = firstDay >= 16;
    const startIndex = isFirstQ2 ? 1 : 0;
    
    const startOfPeriod = isFirstQ2 ? 16 : 1;
    const dayOfPeriod = (firstDay - startOfPeriod) + 1;
    
    const totalIndex = startIndex + index;
    const monthOffset = Math.floor(totalIndex / 2);
    const isQ2 = totalIndex % 2 === 1;
    
    const targetMonth = firstDate.getMonth() + monthOffset;
    const targetYear = firstDate.getFullYear();
    
    const targetStartOfPeriod = isQ2 ? 16 : 1;
    let targetDay = targetStartOfPeriod + dayOfPeriod - 1;
    
    // Clamp to month end if needed
    const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    targetDay = Math.min(targetDay, daysInTargetMonth);
    
    return new Date(targetYear, targetMonth, targetDay);
  }
  
  // For monthly, bimonthly, etc.
  const monthsMultiplier = periodicityToMonths(periodicity);
  const targetMonth = firstDate.getMonth() + index * monthsMultiplier;
  
  // Preserve the original day of month, clamped to the target month's days
  const originalDay = commitment.dayOfMonth ?? firstDate.getDate();
  const targetYear = firstDate.getFullYear();
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const actualDay = Math.min(originalDay, daysInTargetMonth);
  
  return new Date(targetYear, targetMonth, actualDay);
}

/** Converts periodicity to a month multiplier (for month-based periodicities) */
export function periodicityToMonths(periodicity: CommitmentPeriodicity): number {
  switch (periodicity) {
    case CommitmentPeriodicity.MONTHLY: return 1;
    case CommitmentPeriodicity.BIMONTHLY: return 2;
    case CommitmentPeriodicity.QUARTERLY: return 3;
    case CommitmentPeriodicity.SEMIANNUAL: return 6;
    case CommitmentPeriodicity.YEARLY: return 12;
    default: return 1; // Fallback
  }
}

/**
 * Checks if a specific installment falls into the requested PlanningPeriod (MONTH, Q1, Q2)
 */
export function installmentAppliesToPeriod(
  commitment: FinancialCommitment,
  installment: GeneratedInstallment,
  period: PlanningPeriod
): boolean {
  if (period === 'MONTH') return true;

  const isMonthlyOrHigher = [
    CommitmentPeriodicity.MONTHLY,
    CommitmentPeriodicity.BIMONTHLY,
    CommitmentPeriodicity.QUARTERLY,
    CommitmentPeriodicity.SEMIANNUAL,
    CommitmentPeriodicity.YEARLY
  ].includes(commitment.periodicity);
  
  if (isMonthlyOrHigher && commitment.biweeklyPeriod) {
    const assignedPeriod = commitment.biweeklyPeriod === 1 ? 'Q1' : 'Q2';
    if (assignedPeriod === period) return true;
    
    // If viewing Q2, carry over unpaid Q1 commitments
    if (period === 'Q2' && assignedPeriod === 'Q1') {
      const isUnpaid = installment.installmentIndex >= (commitment.currentInstallment || 0);
      if (isUnpaid) return true;
    }
    
    return false;
  }
  
  // Otherwise, fallback to the actual date
  const day = installment.dueDate.getDate();
  const isQ1 = day <= 15;
  const isQ2 = day > 15;
  
  if (period === 'Q1' && isQ1) return true;
  if (period === 'Q2' && isQ2) return true;
  
  // Carry over unpaid Q1 items to Q2
  if (period === 'Q2' && isQ1) {
    const isUnpaid = installment.installmentIndex >= (commitment.currentInstallment || 0);
    if (isUnpaid) return true;
  }
  
  return false;
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
