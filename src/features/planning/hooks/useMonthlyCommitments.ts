'use client';

import { useMemo } from 'react';
import type { FinancialCommitment } from '@/lib/db';
import { commitmentAppliesToMonth, getDueDateForMonth, commitmentAppliesToPeriod } from '../utils/dateUtils';
import type { PlanningPeriod } from '../types';

/**
 * Filters a list of commitments to those applicable in a specific month/year.
 * Also returns the due date for each commitment in that month.
 * Pure computation — no Dexie queries. Works on top of useAllCommitments.
 */
export function useMonthlyCommitments(
  commitments: FinancialCommitment[],
  month: number, // 1-12
  year: number,
  period: PlanningPeriod = 'MONTH'
): Array<{ commitment: FinancialCommitment; dueDate: Date }> {
  return useMemo(() => {
    const result: Array<{ commitment: FinancialCommitment; dueDate: Date }> = [];

    for (const c of commitments) {
      if (c.status === 'CANCELLED' || c.status === 'COMPLETED') continue;
      if (!commitmentAppliesToPeriod(c, month, year, period)) continue;

      const dueDate = getDueDateForMonth(c, month, year);
      if (!dueDate) continue;

      result.push({ commitment: c, dueDate });
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
    const monthly = commitments.filter(
      c =>
        c.status !== 'CANCELLED' &&
        c.status !== 'COMPLETED' &&
        commitmentAppliesToPeriod(c, month, year, period)
    );

    const totalCommitted = monthly.reduce((sum, c) => sum + c.installmentAmount, 0);

    // Find the earliest due date this month
    let nextDueDate: Date | null = null;
    let totalQ1 = 0;
    let totalQ2 = 0;

    for (const c of monthly) {
      const d = getDueDateForMonth(c, month, year);
      if (!d) continue;

      if (d.getDate() <= 15) {
        totalQ1 += c.installmentAmount;
      } else {
        totalQ2 += c.installmentAmount;
      }

      if (!nextDueDate || d < nextDueDate) nextDueDate = d;
    }

    return {
      count: monthly.length,
      totalCommitted,
      totalQ1,
      totalQ2,
      nextDueDate,
    };
  }, [commitments, month, year, period]);
}
