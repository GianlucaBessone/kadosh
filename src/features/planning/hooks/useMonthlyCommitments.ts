'use client';

import { useMemo } from 'react';
import type { FinancialCommitment } from '@/lib/db';
import { commitmentAppliesToMonth, getDueDateForMonth } from '../utils/dateUtils';

/**
 * Filters a list of commitments to those applicable in a specific month/year.
 * Also returns the due date for each commitment in that month.
 * Pure computation — no Dexie queries. Works on top of useAllCommitments.
 */
export function useMonthlyCommitments(
  commitments: FinancialCommitment[],
  month: number, // 1-12
  year: number
): Array<{ commitment: FinancialCommitment; dueDate: Date }> {
  return useMemo(() => {
    const result: Array<{ commitment: FinancialCommitment; dueDate: Date }> = [];

    for (const c of commitments) {
      if (c.status === 'CANCELLED' || c.status === 'COMPLETED') continue;
      if (!commitmentAppliesToMonth(c, month, year)) continue;

      const dueDate = getDueDateForMonth(c, month, year);
      if (!dueDate) continue;

      result.push({ commitment: c, dueDate });
    }

    // Sort by due date ascending
    result.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    return result;
  }, [commitments, month, year]);
}

/**
 * Returns monthly summary stats for the given month.
 */
export function useMonthlySummary(
  commitments: FinancialCommitment[],
  month: number,
  year: number
) {
  return useMemo(() => {
    const monthly = commitments.filter(
      c =>
        c.status !== 'CANCELLED' &&
        c.status !== 'COMPLETED' &&
        commitmentAppliesToMonth(c, month, year)
    );

    const totalCommitted = monthly.reduce((sum, c) => sum + c.installmentAmount, 0);

    // Find the earliest due date this month
    let nextDueDate: Date | null = null;
    for (const c of monthly) {
      const d = getDueDateForMonth(c, month, year);
      if (!d) continue;
      if (!nextDueDate || d < nextDueDate) nextDueDate = d;
    }

    return {
      count: monthly.length,
      totalCommitted,
      nextDueDate,
    };
  }, [commitments, month, year]);
}
