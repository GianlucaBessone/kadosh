import type { FinancialCommitment, CommitmentPayment } from '@/lib/db';
import { db } from '@/lib/db';

/**
 * Data access for the Planning module using Dexie read models.
 */
export const PlanningRepository = {
  async getAllCommitments(ownerId: string): Promise<FinancialCommitment[]> {
    const all = await db.financialCommitments.toArray();
    return all.filter(c => c.deletedAt === null || c.deletedAt === undefined);
  },

  async getActiveCommitments(ownerId: string): Promise<FinancialCommitment[]> {
    const all = await this.getAllCommitments(ownerId);
    return all.filter(c => c.status === 'ACTIVE');
  },

  async getPausedCommitments(ownerId: string): Promise<FinancialCommitment[]> {
    const all = await this.getAllCommitments(ownerId);
    return all.filter(c => c.status === 'PAUSED');
  },

  async getCommitmentById(id: string): Promise<FinancialCommitment | undefined> {
    const c = await db.financialCommitments.get(id);
    return c && (c.deletedAt === null || c.deletedAt === undefined) ? c : undefined;
  },

  async addCommitment(commitment: FinancialCommitment): Promise<void> {
    console.warn('PlanningRepository.addCommitment is mocked for CQRS transition.');
  },

  async updateCommitment(id: string, changes: Partial<FinancialCommitment>): Promise<void> {
    console.warn('PlanningRepository.updateCommitment is mocked for CQRS transition.');
  },

  async softDeleteCommitment(id: string): Promise<void> {
    console.warn('PlanningRepository.softDeleteCommitment is mocked for CQRS transition.');
  },

  async getPaymentsForCommitment(commitmentId: string): Promise<CommitmentPayment[]> {
    return []; // Payments are no longer in DB nor WorkspaceStore currently.
  },

  async addPayment(payment: CommitmentPayment): Promise<void> {
    console.warn('PlanningRepository.addPayment is mocked for CQRS transition.');
  },

  async countActiveCommitments(ownerId: string): Promise<number> {
    const all = await this.getActiveCommitments(ownerId);
    return all.length;
  },
};
