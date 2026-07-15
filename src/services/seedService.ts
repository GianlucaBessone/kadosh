import { db, SeedGoal, SeedContribution } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { addToSyncQueue } from './syncQueueService';
import { TransactionService } from './transactionService';

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
      const account = await db.accounts.orderBy('id').first();
      if (!account) return;

      // Create transaction for the harvest (Income)
      const transactionId = uuidv4();
      const transaction = {
        id: transactionId,
        userId: goal.userId,
        accountId: account.id,
        categoryId: null,
        amount: goal.currentAmount,
        type: 'INCOME',
        date: now,
        notes: `Cosecha de semilla: ${goal.name}`,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      await db.transactions.add(transaction);
      await addToSyncQueue('Transaction', transactionId, 'INSERT', transaction);

      // Update Account Balance
      const newBalance = account.balance + goal.currentAmount;
      await db.accounts.update(account.id, { balance: newBalance, updatedAt: now });
      await addToSyncQueue('Account', account.id, 'UPDATE', { balance: newBalance, updatedAt: now });
    });
  }

  static async waterSeed(seedGoalId: string, amount: number) {
    const now = new Date().toISOString();
    
    await db.transaction('rw', db.seedGoals, db.seedContributions, db.accounts, db.transactions, db.syncQueue, async () => {
      const goal = await db.seedGoals.get(seedGoalId);
      if (!goal) return;

      // Add contribution
      const contributionId = uuidv4();
      const contribution = {
        id: contributionId,
        seedGoalId,
        amount,
        date: now,
        notes: 'Riego',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      await db.seedContributions.add(contribution);
      await addToSyncQueue('SeedContribution', contributionId, 'INSERT', contribution);

      const newAmount = goal.currentAmount + amount;
      await db.seedGoals.update(goal.id, { currentAmount: newAmount, updatedAt: now });
      await addToSyncQueue('SeedGoal', goal.id, 'UPDATE', { currentAmount: newAmount, updatedAt: now });

      // Find user account and deduct the watered amount (Expense)
      const account = await db.accounts.orderBy('id').first();
      if (!account) return;

      const transactionId = uuidv4();
      const transaction = {
        id: transactionId,
        userId: goal.userId,
        accountId: account.id,
        categoryId: 'seed_transfer',
        amount,
        type: 'EXPENSE',
        date: now,
        notes: `Riego a semilla: ${goal.name}`,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      await db.transactions.add(transaction);
      await addToSyncQueue('Transaction', transactionId, 'INSERT', transaction);

      const newBalance = account.balance - amount;
      await db.accounts.update(account.id, { balance: newBalance, updatedAt: now });
      await addToSyncQueue('Account', account.id, 'UPDATE', { balance: newBalance, updatedAt: now });
    });
  }

  static async withdrawSeed(seedGoalId: string, amount: number) {
    const now = new Date().toISOString();
    
    await db.transaction('rw', db.seedGoals, db.seedContributions, db.accounts, db.transactions, db.syncQueue, async () => {
      const goal = await db.seedGoals.get(seedGoalId);
      if (!goal) return;

      if (goal.currentAmount < amount) {
        throw new Error('Insufficient funds in seed');
      }

      // Add negative contribution
      const contributionId = uuidv4();
      const contribution = {
        id: contributionId,
        seedGoalId,
        amount: -amount,
        date: now,
        notes: 'Retiro',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      await db.seedContributions.add(contribution);
      await addToSyncQueue('SeedContribution', contributionId, 'INSERT', contribution);

      const newAmount = goal.currentAmount - amount;
      await db.seedGoals.update(goal.id, { currentAmount: newAmount, updatedAt: now });
      await addToSyncQueue('SeedGoal', goal.id, 'UPDATE', { currentAmount: newAmount, updatedAt: now });

      // Find user account and add the withdrawn amount (Income)
      const account = await db.accounts.orderBy('id').first();
      if (!account) return;

      const transactionId = uuidv4();
      const transaction = {
        id: transactionId,
        userId: goal.userId,
        accountId: account.id,
        categoryId: 'seed_transfer',
        amount,
        type: 'INCOME',
        date: now,
        notes: `Retiro de semilla: ${goal.name}`,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      await db.transactions.add(transaction);
      await addToSyncQueue('Transaction', transactionId, 'INSERT', transaction);

      const newBalance = account.balance + amount;
      await db.accounts.update(account.id, { balance: newBalance, updatedAt: now });
      await addToSyncQueue('Account', account.id, 'UPDATE', { balance: newBalance, updatedAt: now });
    });
  }

  static async deleteSeed(seedGoalId: string, restoreBalance: boolean) {
    const now = new Date().toISOString();
    
    await db.transaction('rw', db.seedGoals, db.seedContributions, db.accounts, db.transactions, db.syncQueue, async () => {
      const goal = await db.seedGoals.get(seedGoalId);
      if (!goal || goal.deletedAt) return;

      // Soft delete the goal
      await db.seedGoals.update(goal.id, { deletedAt: now, updatedAt: now });
      await addToSyncQueue('SeedGoal', goal.id, 'UPDATE', { deletedAt: now, updatedAt: now });

      // Soft delete all contributions
      const contributions = await db.seedContributions.where('seedGoalId').equals(seedGoalId).toArray();
      for (const contrib of contributions) {
        if (!contrib.deletedAt) {
          await db.seedContributions.update(contrib.id, { deletedAt: now, updatedAt: now });
          await addToSyncQueue('SeedContribution', contrib.id, 'UPDATE', { deletedAt: now, updatedAt: now });
        }
      }

      if (restoreBalance && goal.currentAmount > 0) {
        const account = await db.accounts.orderBy('id').first();
        if (account) {
          const transactionId = uuidv4();
          const transaction = {
            id: transactionId,
            userId: goal.userId,
            accountId: account.id,
            categoryId: null, // or some specific category if needed
            amount: goal.currentAmount,
            type: 'INCOME',
            date: now,
            notes: `Devolución por semilla eliminada: ${goal.name}`,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
          };
          await db.transactions.add(transaction);
          await addToSyncQueue('Transaction', transactionId, 'INSERT', transaction);

          const newBalance = account.balance + goal.currentAmount;
          await db.accounts.update(account.id, { balance: newBalance, updatedAt: now });
          await addToSyncQueue('Account', account.id, 'UPDATE', { balance: newBalance, updatedAt: now });
        }
      }
    });
  }
}
