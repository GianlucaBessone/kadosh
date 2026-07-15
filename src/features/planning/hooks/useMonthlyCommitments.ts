'use client';

import { useMemo } from 'react';
import type { FinancialCommitment } from '@/lib/db';
import { generateInstallmentsForMonth, installmentAppliesToPeriod } from '../utils/dateUtils';
import type { PlanningPeriod, MonthlyCommitmentItem } from '../types';

/**
 * Filters a list of commitments to those applicable in a specific month/year.
 * Also returns the due date and installment index for each instance in that month.
 * Pure computation — no Dexie queries. Works on top of useAllCommitments.
 */
export function useMonthlyCommitments(
  commitments: FinancialCommitment[],
  month: number, // 1-12
  year: number,
  period: PlanningPeriod = 'MONTH'
): MonthlyCommitmentItem[] {
  return useMemo(() => {
    const result: MonthlyCommitmentItem[] = [];

    for (const c of commitments) {
      // CANCELLED and COMPLETED commitments are handled by generateInstallmentsForMonth
      // which respects c.endDate and c.installments limit.
      
      const generated = generateInstallmentsForMonth(c, month, year);
      
      for (const inst of generated) {
        if (installmentAppliesToPeriod(c, inst, period)) {
          // If it's not recurring and the index exceeds total installments, it's ignored during generation anyway.
          // Check if it's already paid? The component usually handles paid states by checking if there's a payment record.
          result.push({
            commitment: c,
            dueDate: inst.dueDate,
            installmentIndex: inst.installmentIndex
          });
        }
      }
    }

    // Sort by due date ascending
    result.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    return result;
  }, [commitments, month, year, period]);
}

/**
 * Returns monthly summary stats for the given month.
 */
export function useMonthlySummary(
  commitments: FinancialCommitment[],
  month: number,
  year: number,
  period: PlanningPeriod = 'MONTH'
) {
  return useMemo(() => {
    let totalCommitted = 0;
    let totalQ1 = 0;
    let totalQ2 = 0;
    let nextDueDate: Date | null = null;
    let count = 0;

    for (const c of commitments) {
      // Allow CANCELLED and COMPLETED so they contribute to past months' summaries
      
      const generated = generateInstallmentsForMonth(c, month, year);
      
      for (const inst of generated) {
        if (installmentAppliesToPeriod(c, inst, period)) {
          count++;
          totalCommitted += c.installmentAmount;
          
          if (inst.dueDate.getDate() <= 15) {
            totalQ1 += c.installmentAmount;
          } else {
            totalQ2 += c.installmentAmount;
          }

          if (!nextDueDate || inst.dueDate < nextDueDate) {
            nextDueDate = inst.dueDate;
          }
        }
      }
    }

    return {
      count,
      totalCommitted,
      totalQ1,
      totalQ2,
      nextDueDate,
    };
  }, [commitments, month, year, period]);
}
