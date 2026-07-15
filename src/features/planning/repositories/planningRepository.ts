import { db } from '@/lib/db';
import type { FinancialCommitment, CommitmentPayment, CommitmentStatus } from '@/lib/db';

/**
 * Raw Dexie data access for the Planning module.
 * No business logic here — only CRUD operations.
 */
export const PlanningRepository = {
  async getAllCommitments(ownerId: string): Promise<FinancialCommitment[]> {
    return db.financialCommitments
      .where('ownerId')
      .equals(ownerId)
      .filter(c => c.deletedAt === null)
      .toArray();
  },

  async getActiveCommitments(ownerId: string): Promise<FinancialCommitment[]> {
    return db.financialCommitments
      .where('ownerId')
      .equals(ownerId)
      .filter(c => c.deletedAt === null && c.status === 'ACTIVE')
      .toArray();
  },

  async getPausedCommitments(ownerId: string): Promise<FinancialCommitment[]> {
    return db.financialCommitments
      .where('ownerId')
      .equals(ownerId)
      .filter(c => c.deletedAt === null && c.status === 'PAUSED')
      .toArray();
  },

  async getCommitmentById(id: string): Promise<FinancialCommitment | undefined> {
    return db.financialCommitments.get(id);
  },

  async addCommitment(commitment: FinancialCommitment): Promise<void> {
    await db.financialCommitments.add(commitment);
  },

  async updateCommitment(id: string, changes: Partial<FinancialCommitment>): Promise<void> {
    await db.financialCommitments.update(id, { ...changes, updatedAt: new Date().toISOString() });
  },

  async softDeleteCommitment(id: string): Promise<void> {
    const now = new Date().toISOString();
    await db.financialCommitments.update(id, {
      deletedAt: now,
      updatedAt: now,
      status: 'CANCELLED' as CommitmentStatus,
    });
  },

  async getPaymentsForCommitment(commitmentId: string): Promise<CommitmentPayment[]> {
    return db.commitmentPayments
      .where('commitmentId')
      .equals(commitmentId)
      .filter(p => p.deletedAt === null)
      .sortBy('installmentNumber');
  },

  async addPayment(payment: CommitmentPayment): Promise<void> {
    await db.commitmentPayments.add(payment);
  },

  async countActiveCommitments(ownerId: string): Promise<number> {
    return db.financialCommitments
      .where('ownerId')
      .equals(ownerId)
      .filter(c => c.deletedAt === null && c.status === 'ACTIVE')
      .count();
  },
};
