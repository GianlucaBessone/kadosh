/**
 * Amount calculation utilities for the Planning module.
 * All calculations are deterministic and pure (no side effects).
 */

/**
 * Mode A: Given total amount and number of installments,
 * calculate the value per installment.
 */
export function calcInstallmentAmount(total: number, installments: number): number {
  if (installments <= 0) return 0;
  return Math.ceil(total / installments); // Round up to avoid under-counting
}

/**
 * Mode B: Given installment amount and number of installments,
 * calculate the total amount.
 */
export function calcTotalAmount(installmentAmount: number, installments: number): number {
  return installmentAmount * installments;
}

/**
 * Calculate the remaining amount after a payment.
 */
export function calcRemainingAmount(
  totalAmount: number,
  paidInstallments: number,
  installmentAmount: number
): number {
  const paid = paidInstallments * installmentAmount;
  return Math.max(0, totalAmount - paid);
}

/**
 * Given an installmentAmount and currentInstallment (0-based),
 * returns the total amount paid so far.
 */
export function calcPaidAmount(installmentAmount: number, currentInstallment: number): number {
  return installmentAmount * currentInstallment;
}

/**
 * Returns the percentage of the commitment that has been paid.
 */
export function calcProgressPercent(
  currentInstallment: number,
  totalInstallments: number
): number {
  if (!totalInstallments || totalInstallments <= 0) return 0;
  return Math.min(100, Math.round((currentInstallment / totalInstallments) * 100));
}

/**
 * Calculates the projected balance for a month simulation.
 */
export function calcProjectedBalance(params: {
  incomeExpected: number;
  additionalIncome: number;
  totalCommitted: number;
  extraordinaryExpenses: number;
}): number {
  const totalIn = params.incomeExpected + params.additionalIncome;
  const totalOut = params.totalCommitted + params.extraordinaryExpenses;
  return totalIn - totalOut;
}

/**
 * Calculates the estimated tithe (10% of income).
 * This is a suggestion only — never automatically deducted.
 */
export function calcTitheEstimate(income: number): number {
  return income * 0.1;
}

/**
 * Calculates the percentage of income committed.
 */
export function calcPercentageCommitted(totalCommitted: number, totalIncome: number): number {
  if (totalIncome <= 0) return 0;
  return Math.min(100, Math.round((totalCommitted / totalIncome) * 100));
}
