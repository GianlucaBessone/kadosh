import { v4 as uuidv4 } from 'uuid';
import { db, CommitmentStatus } from '@/lib/db';
import type { FinancialCommitment, CommitmentPayment } from '@/lib/db';
import { addToSyncQueue } from '@/services/syncQueueService';
import { PlanningRepository } from '../repositories/planningRepository';
import { generateInstallmentsForMonth, getNextDate } from '../utils/dateUtils';
import { calcProjectedBalance, calcTitheEstimate, calcPercentageCommitted } from '../utils/amountUtils';
import type { MonthlySimulation, MonthlyCommitmentItem } from '../types';

// ... (imports) ...

type CreateCommitmentInput = Omit<
  FinancialCommitment,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'currentInstallment' | 'status'
>;

export class PlanningService {
  /**
   * Creates a new FinancialCommitment in Dexie and enqueues for sync.
   */
  static async createCommitment(data: CreateCommitmentInput): Promise<FinancialCommitment> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const commitment: FinancialCommitment = {
      ...data,
      id,
      status: CommitmentStatus.ACTIVE,
      currentInstallment: 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await db.transaction('rw', db.financialCommitments, db.syncQueue, async () => {
      await PlanningRepository.addCommitment(commitment);
      await addToSyncQueue('FinancialCommitment', id, 'INSERT', commitment);
    });

    return commitment;
  }

  /**
   * Updates an existing commitment and enqueues for sync.
   */
  static async updateCommitment(
    id: string,
    changes: Partial<FinancialCommitment>
  ): Promise<void> {
    const now = new Date().toISOString();
    const payload = { ...changes, updatedAt: now };

    await db.transaction('rw', db.financialCommitments, db.syncQueue, async () => {
      await PlanningRepository.updateCommitment(id, payload);
      await addToSyncQueue('FinancialCommitment', id, 'UPDATE', payload);
    });
  }

  /**
   * Soft-deletes (cancels) a commitment and enqueues for sync.
   * Note: We are migrating to hardDeleteCommitment and cancelFutureCommitments.
   */
  static async cancelCommitment(id: string): Promise<void> {
    const now = new Date().toISOString();
    const payload = { deletedAt: now, updatedAt: now, status: CommitmentStatus.CANCELLED };

    await db.transaction('rw', db.financialCommitments, db.syncQueue, async () => {
      await PlanningRepository.softDeleteCommitment(id);
      await addToSyncQueue('FinancialCommitment', id, 'UPDATE', payload);
    });
  }

  /**
   * Hard-deletes a commitment and all associated records (payments, transactions).
   */
  static async hardDeleteCommitment(id: string): Promise<void> {
    const commitment = await PlanningRepository.getCommitmentById(id);
    if (!commitment) return;

    await db.transaction(
      'rw',
      db.financialCommitments,
      db.commitmentPayments,
      db.transactions,
      db.accounts,
      db.syncQueue,
      async () => {
        // 1. Find all payments
        const payments = await PlanningRepository.getPaymentsForCommitment(id);

        // 2. For each payment, revert transaction and restore balance
        for (const payment of payments) {
          if (payment.transactionId) {
            const tx = await db.transactions.get(payment.transactionId);
            if (tx) {
              await db.transactions.delete(payment.transactionId);
              await addToSyncQueue('Transaction', payment.transactionId, 'DELETE', null);

              const account = await db.accounts.get(tx.accountId);
              if (account) {
                const newBalance = account.balance + payment.amount;
                await db.accounts.update(account.id, { balance: newBalance, updatedAt: new Date().toISOString() });
                await addToSyncQueue('Account', account.id, 'UPDATE', { balance: newBalance, updatedAt: new Date().toISOString() });
              }
            }
          }
          await db.commitmentPayments.delete(payment.id);
          await addToSyncQueue('CommitmentPayment', payment.id, 'DELETE', null);
        }

        // 3. Delete commitment
        await db.financialCommitments.delete(id);
        await addToSyncQueue('FinancialCommitment', id, 'DELETE', null);
      }
    );
  }

  /**
   * Cancels a commitment so it doesn't generate future installments.
   * Keeps past history (does not set deletedAt).
   */
  static async cancelFutureCommitments(id: string): Promise<void> {
    const commitment = await PlanningRepository.getCommitmentById(id);
    if (!commitment) return;

    const now = new Date();
    
    // 1. End of current month
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // 2. Date of last paid installment
    let lastPaidDate = new Date(0);
    if (commitment.currentInstallment > 0) {
      lastPaidDate = getNextDate(commitment, new Date(commitment.firstDueDate), commitment.currentInstallment - 1);
    }
    
    // Set endDate to whichever is further in the future
    const finalEndDate = new Date(Math.max(endOfCurrentMonth.getTime(), lastPaidDate.getTime())).toISOString();

    const payload = { 
      status: CommitmentStatus.CANCELLED, 
      endDate: finalEndDate, 
      updatedAt: now.toISOString() 
    };

    await db.transaction('rw', db.financialCommitments, db.syncQueue, async () => {
      // @ts-ignore
      await db.financialCommitments.update(id, payload);
      await addToSyncQueue('FinancialCommitment', id, 'UPDATE', payload);
    });
  }

  /**
   * Pauses a commitment indefinitely or until a specific date.
   */
  static async pauseCommitment(id: string, untilDate?: string | null): Promise<void> {
    const now = new Date().toISOString();
    const payload = { 
      status: CommitmentStatus.PAUSED, 
      pausedUntil: untilDate || null, 
      updatedAt: now 
    };

    await db.transaction('rw', db.financialCommitments, db.syncQueue, async () => {
      await db.financialCommitments.update(id, payload as any);
      await addToSyncQueue('FinancialCommitment', id, 'UPDATE', payload);
    });
  }

  /**
   * Unpauses a commitment.
   */
  static async unpauseCommitment(id: string): Promise<void> {
    const now = new Date().toISOString();
    const payload = { 
      status: CommitmentStatus.ACTIVE, 
      pausedUntil: null, 
      updatedAt: now 
    };

    await db.transaction('rw', db.financialCommitments, db.syncQueue, async () => {
      await db.financialCommitments.update(id, payload as any);
      await addToSyncQueue('FinancialCommitment', id, 'UPDATE', payload);
    });
  }

  /**
   * Registers a payment for an installment.
   * Creates a Transaction, updates the commitment's installment counter,
   * and marks as COMPLETED if all installments are paid.
   */
  static async registerPayment(
    commitmentId: string,
    installmentNumber: number,
    notes?: string
  ): Promise<{ payment: CommitmentPayment; isCompleted: boolean }> {
    const now = new Date().toISOString();
    const commitment = await PlanningRepository.getCommitmentById(commitmentId);
    if (!commitment) throw new Error('Commitment not found');

    const paymentId = uuidv4();
    const transactionId = uuidv4();

    const payment: CommitmentPayment = {
      id: paymentId,
      commitmentId,
      installmentNumber,
      amount: commitment.installmentAmount,
      date: now,
      notes: notes ?? null,
      transactionId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    const newInstallment = commitment.currentInstallment + 1;
    const isCompleted =
      !commitment.isRecurring &&
      commitment.installments !== null &&
      newInstallment >= commitment.installments;

    const newStatus = isCompleted ? CommitmentStatus.COMPLETED : commitment.status;
    const newRemaining =
      commitment.remainingAmount !== null
        ? Math.max(0, commitment.remainingAmount - commitment.installmentAmount)
        : null;

    await db.transaction(
      'rw',
      db.commitmentPayments,
      db.financialCommitments,
      db.transactions,
      db.accounts,
      db.syncQueue,
      async () => {
        // 1. Create payment record
        await PlanningRepository.addPayment(payment);
        await addToSyncQueue('CommitmentPayment', paymentId, 'INSERT', payment);

        // 2. Update commitment state
        const commitmentUpdate = {
          currentInstallment: newInstallment,
          remainingAmount: newRemaining,
          status: newStatus,
          updatedAt: now,
        };
        await PlanningRepository.updateCommitment(commitmentId, commitmentUpdate);
        await addToSyncQueue('FinancialCommitment', commitmentId, 'UPDATE', commitmentUpdate);

        // 3. Create a financial transaction (EXPENSE)
        const account = await db.accounts.orderBy('id').first();
        if (account) {
          const tx = {
            id: transactionId,
            userId: commitment.ownerId,
            accountId: account.id,
            categoryId: commitment.categoryId,
            type: 'EXPENSE',
            amount: commitment.installmentAmount,
            date: now,
            notes: commitment.isRecurring
              ? `Pago: ${commitment.name}`
              : `Cuota ${newInstallment}/${commitment.installments} — ${commitment.name}`,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
          };
          await db.transactions.add(tx);
          await addToSyncQueue('Transaction', transactionId, 'INSERT', tx);

          // 4. Update account balance
          const newBalance = account.balance - commitment.installmentAmount;
          await db.accounts.update(account.id, { balance: newBalance, updatedAt: now });
          await addToSyncQueue('Account', account.id, 'UPDATE', {
            balance: newBalance,
            updatedAt: now,
          });
        }
      }
    );

    return { payment, isCompleted };
  }

  /**
   * Deletes a registered payment, reverting the transaction and restoring balance.
   */
  static async deletePayment(paymentId: string): Promise<void> {
    const payment = await db.commitmentPayments.get(paymentId);
    if (!payment) throw new Error('Payment not found');
    const commitment = await db.financialCommitments.get(payment.commitmentId);
    if (!commitment) throw new Error('Commitment not found');

    const now = new Date().toISOString();
    const newInstallment = commitment.currentInstallment - 1;
    const newRemaining = commitment.remainingAmount !== null 
      ? commitment.remainingAmount + payment.amount 
      : null;
    const newStatus = CommitmentStatus.ACTIVE; // If it was completed, it goes back to active

    await db.transaction(
      'rw',
      db.commitmentPayments,
      db.financialCommitments,
      db.transactions,
      db.accounts,
      db.syncQueue,
      async () => {
        // 1. Delete the payment
        await db.commitmentPayments.delete(paymentId);
        await addToSyncQueue('CommitmentPayment', paymentId, 'DELETE', null);

        // 2. Revert commitment state
        const commitmentUpdate = {
          currentInstallment: Math.max(0, newInstallment),
          remainingAmount: newRemaining,
          status: newStatus,
          updatedAt: now,
        };
        await PlanningRepository.updateCommitment(commitment.id, commitmentUpdate);
        await addToSyncQueue('FinancialCommitment', commitment.id, 'UPDATE', commitmentUpdate);

        // 3. Delete the transaction and revert balance if exists
        if (payment.transactionId) {
          const tx = await db.transactions.get(payment.transactionId);
          if (tx) {
            await db.transactions.delete(payment.transactionId);
            await addToSyncQueue('Transaction', payment.transactionId, 'DELETE', null);

            const account = await db.accounts.get(tx.accountId);
            if (account) {
              const newBalance = account.balance + payment.amount;
              await db.accounts.update(account.id, { balance: newBalance, updatedAt: now });
              await addToSyncQueue('Account', account.id, 'UPDATE', {
                balance: newBalance,
                updatedAt: now,
              });
            }
          }
        }
      }
    );
  }

  /**
   * Returns all applicable installments for a given month/year.
   */
  static async getCommitmentsForMonth(
    ownerId: string,
    month: number,
    year: number
  ): Promise<MonthlyCommitmentItem[]> {
    const all = await PlanningRepository.getAllCommitments(ownerId);
    const results: MonthlyCommitmentItem[] = [];

    for (const c of all) {
      const generated = generateInstallmentsForMonth(c, month, year);
      for (const inst of generated) {
        results.push({
          commitment: c,
          dueDate: inst.dueDate,
          installmentIndex: inst.installmentIndex
        });
      }
    }
    
    return results.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  /**
   * Returns the next upcoming commitment by due date.
   */
  static async getNextCommitment(ownerId: string): Promise<MonthlyCommitmentItem | null> {
    const now = new Date();
    // Start search from today
    now.setHours(0, 0, 0, 0);
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    let bestCandidate: MonthlyCommitmentItem | null = null;
    const searchMonths = [
      { m: month, y: year },
      { m: month === 12 ? 1 : month + 1, y: month === 12 ? year + 1 : year },
    ];

    for (const { m, y } of searchMonths) {
      const monthInstallments = await PlanningService.getCommitmentsForMonth(ownerId, m, y);
      for (const item of monthInstallments) {
        if (item.dueDate < now) continue;
        if (!bestCandidate || item.dueDate < bestCandidate.dueDate) {
          bestCandidate = item;
        }
      }
      if (bestCandidate) break;
    }

    return bestCandidate;
  }

  /**
   * Simulates the financial balance for a given month.
   */
  static async simulateMonth(
    ownerId: string,
    month: number,
    year: number,
    params: {
      incomeExpected: number;
      additionalIncome: number;
      extraordinaryExpenses: number;
      desiredSavings: number;
    }
  ): Promise<MonthlySimulation> {
    const commitments = await PlanningService.getCommitmentsForMonth(ownerId, month, year);
    const totalCommitted = commitments.reduce((sum, item) => sum + item.commitment.installmentAmount, 0);
    const totalIncome = params.incomeExpected + params.additionalIncome;

    const projectedBalance = calcProjectedBalance({
      incomeExpected: params.incomeExpected,
      additionalIncome: params.additionalIncome,
      totalCommitted,
      extraordinaryExpenses: params.extraordinaryExpenses,
    });

    const titheEstimate = calcTitheEstimate(totalIncome);
    const percentageCommitted = calcPercentageCommitted(totalCommitted, totalIncome);
    const savingsCapacity = projectedBalance - params.desiredSavings;

    return {
      month,
      year,
      commitments,
      totalCommitted,
      incomeExpected: params.incomeExpected,
      additionalIncome: params.additionalIncome,
      extraordinaryExpenses: params.extraordinaryExpenses,
      desiredSavings: params.desiredSavings,
      titheEstimate,
      projectedBalance,
      percentageCommitted,
      savingsCapacity,
      isPositive: projectedBalance > 0,
    };
  }
}
