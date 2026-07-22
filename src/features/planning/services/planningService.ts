import { v4 as uuidv4 } from 'uuid';
import { db, CommitmentStatus } from '@/lib/db';
import type { FinancialCommitment, CommitmentPayment } from '@/lib/db';
import { addToSyncQueue } from '@/services/syncQueueService';
import { PlanningRepository } from '../repositories/planningRepository';
import { generateInstallmentsForMonth, getNextDate } from '../utils/dateUtils';
import { calcProjectedBalance, calcTitheEstimate, calcPercentageCommitted } from '../utils/amountUtils';
import type { MonthlySimulation, MonthlyCommitmentItem } from '../types';
import { useWorkspaceStore } from '@/store/WorkspaceStore';
import { FinanceCommandDispatcher } from '@/domain/commands/FinanceCommandDispatcher';
import { CreateCommitmentCommand, PayCommitmentCommand, CommandMetadata, UpdateCommitmentCommand, DeleteCommitmentCommand, DeletePaymentCommand } from '@/domain/commands/FinanceCommands';

export class PlanningService {
  private static getMetadata(): CommandMetadata {
    const state = useWorkspaceStore.getState();
    const workspaceId = state.activeWorkspaceId;
    if (!workspaceId) throw new Error('No active workspace');
    
    return {
      workspaceId,
      userId: 'local-user',
      deviceId: 'local-device',
      timestamp: new Date().toISOString()
    };
  }

  static async createCommitment(data: Omit<
    FinancialCommitment,
    'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'currentInstallment' | 'status'
  >): Promise<FinancialCommitment> {
    const commitmentId = uuidv4();
    const now = new Date().toISOString();
    
    const command: CreateCommitmentCommand = {
      type: 'CREATE_COMMITMENT',
      metadata: this.getMetadata(),
      payload: {
        commitmentId,
        name: data.name,
        amount: data.amount,
        installmentAmount: data.installmentAmount,
        periodicity: data.periodicity as any,
        type: data.type as any,
        firstDueDate: (data.firstDueDate as any),
        endDate: (data.endDate as any) || undefined,
        notes: data.notes,
        isRecurring: data.isRecurring,
        installments: data.installments,
        customPeriodicityDays: data.customPeriodicityDays,
        dayOfMonth: data.dayOfMonth,
        biweeklyPeriod: data.biweeklyPeriod,
        amountTotal: data.amountTotal,
        categoryId: data.categoryId,
        description: data.description,
      }
    };

    await FinanceCommandDispatcher.dispatch(command);

    // Mock return to satisfy UI
    return {
      ...data,
      id: commitmentId,
      status: CommitmentStatus.ACTIVE,
      currentInstallment: 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
  }

  static async updateCommitment(id: string, changes: Partial<FinancialCommitment>): Promise<void> {
    const command: UpdateCommitmentCommand = {
      type: 'UPDATE_COMMITMENT',
      metadata: this.getMetadata(),
      payload: {
        commitmentId: id,
        changes: changes as any
      }
    };
    await FinanceCommandDispatcher.dispatch(command);
  }

  static async cancelCommitment(id: string): Promise<void> {
    await this.updateCommitment(id, { status: CommitmentStatus.CANCELLED });
  }

  static async hardDeleteCommitment(id: string): Promise<void> {
    const command: DeleteCommitmentCommand = {
      type: 'DELETE_COMMITMENT',
      metadata: this.getMetadata(),
      payload: {
        commitmentId: id
      }
    };
    await FinanceCommandDispatcher.dispatch(command);
  }

  static async cancelFutureCommitments(id: string): Promise<void> {
    const commitment = await PlanningRepository.getCommitmentById(id);
    if (!commitment) return;
    
    const payments = await db.commitmentPayments.where('commitmentId').equals(id).filter(p => !p.deletedAt).toArray();
    let maxPaidDueDate = new Date(0);
    
    if (payments.length > 0) {
      const maxInstallmentIndex = Math.max(...payments.map(p => p.installmentNumber)) - 1;
      const firstDate = new Date(commitment.firstDueDate);
      const d = new Date(firstDate.getUTCFullYear(), firstDate.getUTCMonth(), firstDate.getUTCDate());
      maxPaidDueDate = getNextDate(commitment, d, maxInstallmentIndex);
    }
    
    const now = new Date();
    const endDateToUse = maxPaidDueDate > now ? maxPaidDueDate : now;

    await this.updateCommitment(id, { 
      status: CommitmentStatus.CANCELLED,
      endDate: endDateToUse.toISOString()
    });
  }

  static async pauseCommitment(id: string, untilDate?: string | null): Promise<void> {
    await this.updateCommitment(id, { status: CommitmentStatus.PAUSED, pausedUntil: untilDate || undefined });
  }

  static async unpauseCommitment(id: string): Promise<void> {
    await this.updateCommitment(id, { status: CommitmentStatus.ACTIVE, pausedUntil: undefined });
  }

  static async registerPayment(
    commitmentId: string,
    installmentNumber: number,
    notes?: string
  ): Promise<{ payment: CommitmentPayment; isCompleted: boolean }> {
    const paymentId = uuidv4();
    const transactionId = uuidv4();
    const now = new Date().toISOString();

    const commitment = await PlanningRepository.getCommitmentById(commitmentId);
    if (!commitment) throw new Error('Commitment not found');

    const command: PayCommitmentCommand = {
      type: 'PAY_COMMITMENT',
      metadata: this.getMetadata(),
      payload: {
        commitmentId,
        paymentId,
        transactionId,
        amount: commitment.installmentAmount,
        date: now,
        installmentNumber
      } as any
    };

    await FinanceCommandDispatcher.dispatch(command);

    // Mock return
    return { 
      payment: {
        id: paymentId,
        commitmentId,
        installmentNumber,
        amount: commitment.installmentAmount,
        date: now,
        status: 'PAID',
        notes: notes || undefined,
        transactionId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null
      }, 
      isCompleted: false 
    };
  }

  static async deletePayment(paymentId: string): Promise<void> {
    const payment = await db.commitmentPayments.get(paymentId);
    if (!payment) throw new Error('Payment not found');

    const command: DeletePaymentCommand = {
      type: 'DELETE_PAYMENT',
      metadata: this.getMetadata(),
      payload: {
        paymentId,
        commitmentId: payment.commitmentId
      }
    };
    await FinanceCommandDispatcher.dispatch(command);
  }

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

  static async getNextCommitment(ownerId: string): Promise<MonthlyCommitmentItem | null> {
    // Dummy query to ensure dexie-react-hooks tracks this table before any await
    await db.commitmentPayments.limit(1).toArray();
    await db.financialCommitments.limit(1).toArray();
    
    const now = new Date();
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
        
        // Skip if already paid
        const paymentsCount = await db.commitmentPayments
          .where('commitmentId')
          .equals(item.commitment.id)
          .filter(p => !p.deletedAt && p.installmentNumber === item.installmentIndex + 1)
          .count();
          
        if (paymentsCount > 0) continue;

        if (!bestCandidate || item.dueDate < bestCandidate.dueDate) {
          bestCandidate = item;
        }
      }
      if (bestCandidate) break;
    }

    return bestCandidate;
  }

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
