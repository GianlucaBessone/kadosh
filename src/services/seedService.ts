import { db, SeedGoal, SeedContribution } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { addToSyncQueue } from './syncQueueService';

export class SeedService {
  static async createSeedGoal(data: Omit<SeedGoal, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    const id = uuidv4();
    const now = new Date().toISOString();
    const seedGoal: SeedGoal = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await db.transaction('rw', db.seedGoals, db.syncQueue, async () => {
      await db.seedGoals.add(seedGoal);
      await addToSyncQueue('SeedGoal', id, 'INSERT', seedGoal);
    });

    return seedGoal;
  }

  static async addContribution(data: Omit<SeedContribution, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    const id = uuidv4();
    const now = new Date().toISOString();
    const contribution: SeedContribution = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await db.transaction('rw', db.seedGoals, db.seedContributions, db.syncQueue, async () => {
      await db.seedContributions.add(contribution);
      await addToSyncQueue('SeedContribution', id, 'INSERT', contribution);

      const goal = await db.seedGoals.get(data.seedGoalId);
      if (goal) {
        const newAmount = goal.currentAmount + data.amount;
        await db.seedGoals.update(goal.id, { currentAmount: newAmount, updatedAt: now });
        await addToSyncQueue('SeedGoal', goal.id, 'UPDATE', { currentAmount: newAmount, updatedAt: now });
      }
    });

    return contribution;
  }

  static async harvestSeed(seedGoalId: string) {
    const now = new Date().toISOString();
    
    await db.transaction('rw', db.seedGoals, db.accounts, db.transactions, db.syncQueue, async () => {
      const goal = await db.seedGoals.get(seedGoalId);
      if (!goal || goal.status === 'HARVESTED') return;

      // Mark as harvested
      await db.seedGoals.update(goal.id, { status: 'HARVESTED', updatedAt: now });
      await addToSyncQueue('SeedGoal', goal.id, 'UPDATE', { status: 'HARVESTED', updatedAt: now });

      // Find user account
      const account = await db.accounts.where('userId').equals(goal.userId).first();
      if (!account) return;

      // Create transaction for the harvest (Income)
      const { TransactionService } = await import('./transactionService');
      await TransactionService.createTransaction({
        userId: goal.userId,
        accountId: account.id,
        categoryId: null, // No category needed specifically
        amount: goal.currentAmount,
        type: 'INCOME',
        date: now,
        notes: `Cosecha de semilla: ${goal.name}`,
      });
    });
  }

  static async waterSeed(seedGoalId: string, amount: number) {
    const now = new Date().toISOString();
    
    await db.transaction('rw', db.seedGoals, db.seedContributions, db.accounts, db.transactions, db.syncQueue, async () => {
      const goal = await db.seedGoals.get(seedGoalId);
      if (!goal) return;

      // Add contribution
      await SeedService.addContribution({
        seedGoalId,
        amount,
        date: now,
        notes: 'Riego',
      });

      // Find user account and deduct the watered amount (Expense)
      const account = await db.accounts.where('userId').equals(goal.userId).first();
      if (!account) return;

      const { TransactionService } = await import('./transactionService');
      await TransactionService.createTransaction({
        userId: goal.userId,
        accountId: account.id,
        categoryId: null,
        amount,
        type: 'EXPENSE', // Money is moved from balance to seed
        date: now,
        notes: `Riego a semilla: ${goal.name}`,
      });
    });
  }
}
