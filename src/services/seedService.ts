import { v4 as uuidv4 } from 'uuid';
import { useWorkspaceStore } from '@/store/WorkspaceStore';
import { FinanceCommandDispatcher } from '@/domain/commands/FinanceCommandDispatcher';
import { PlantSeedCommand, HarvestSeedCommand, CommandMetadata } from '@/domain/commands/FinanceCommands';

export class SeedService {
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

  static async createSeedGoal(data: { name: string; targetAmount: number; userId?: string }) {
    const seedId = uuidv4();
    const command: PlantSeedCommand = {
      type: 'PLANT_SEED',
      metadata: this.getMetadata(),
      payload: {
        seedId,
        name: data.name,
        targetAmount: data.targetAmount,
        date: new Date().toISOString()
      }
    };

    await FinanceCommandDispatcher.dispatch(command);
    return { id: seedId, ...data };
  }

  static async addContribution(data: any) {
    console.warn("addContribution not fully supported in FinanceCommands yet");
  }

  static async harvestSeed(seedGoalId: string, amount: number = 0) {
    const metadata = this.getMetadata();

    const { db } = await import('@/lib/db');
    const seed = await db.seedGoals.get(seedGoalId);
    const actualAmount = amount > 0 ? amount : (seed?.currentAmount || 0);

    if (seed && actualAmount > 0) {
      const accounts = await db.accounts.where('workspaceId').equals(metadata.workspaceId).toArray();
      const mainAccount = accounts.filter(a => !a.deletedAt)[0];
      
      if (mainAccount) {
        const { TransactionService } = await import('./transactionService');
        await TransactionService.createTransaction({
          accountId: mainAccount.id,
          amount: actualAmount,
          type: 'INCOME',
          categoryId: 'seed_transfer',
          notes: 'Cosecha de semilla',
        });
      }
    }

    const command: HarvestSeedCommand = {
      type: 'HARVEST_SEED',
      metadata,
      payload: {
        seedId: seedGoalId,
        amount: actualAmount,
        date: new Date().toISOString()
      }
    };
    await FinanceCommandDispatcher.dispatch(command);
  }

  static async waterSeed(seedGoalId: string, amount: number) {
    const metadata = this.getMetadata();
    
    // Find main account to deduct from
    const { db } = await import('@/lib/db');
    const accounts = await db.accounts.where('workspaceId').equals(metadata.workspaceId).toArray();
    const mainAccount = accounts.filter(a => !a.deletedAt)[0];
    
    if (mainAccount) {
      const { TransactionService } = await import('./transactionService');
      await TransactionService.createTransaction({
        accountId: mainAccount.id,
        amount: amount,
        type: 'EXPENSE',
        categoryId: 'seed_transfer',
        notes: 'Aporte a semilla',
      });
    }

    const command = {
      type: 'WATER_SEED' as const,
      metadata,
      payload: {
        seedId: seedGoalId,
        contributionId: uuidv4(),
        amount: amount,
        date: new Date().toISOString()
      }
    };
    await FinanceCommandDispatcher.dispatch(command);
  }

  static async withdrawSeed(seedGoalId: string, amount: number) {
    const metadata = this.getMetadata();
    
    // Find main account to return funds to
    const { db } = await import('@/lib/db');
    const accounts = await db.accounts.where('workspaceId').equals(metadata.workspaceId).toArray();
    const mainAccount = accounts.filter(a => !a.deletedAt)[0];
    
    if (mainAccount) {
      const { TransactionService } = await import('./transactionService');
      await TransactionService.createTransaction({
        accountId: mainAccount.id,
        amount: amount,
        type: 'INCOME',
        categoryId: 'seed_transfer',
        notes: 'Retiro de semilla',
      });
    }

    const command = {
      type: 'WITHDRAW_SEED' as const,
      metadata,
      payload: {
        seedId: seedGoalId,
        withdrawalId: uuidv4(),
        amount: amount,
        date: new Date().toISOString()
      }
    };
    await FinanceCommandDispatcher.dispatch(command);
  }

  static async deleteSeed(seedGoalId: string, restoreBalance: boolean) {
    const metadata = this.getMetadata();

    if (restoreBalance) {
      const { db } = await import('@/lib/db');
      const seed = await db.seedGoals.get(seedGoalId);
      if (seed && seed.currentAmount > 0) {
        const accounts = await db.accounts.where('workspaceId').equals(metadata.workspaceId).toArray();
        const mainAccount = accounts.filter(a => !a.deletedAt)[0];
        
        if (mainAccount) {
          const { TransactionService } = await import('./transactionService');
          await TransactionService.createTransaction({
            accountId: mainAccount.id,
            amount: seed.currentAmount,
            type: 'INCOME',
            categoryId: 'seed_transfer',
            notes: 'Devolución por semilla eliminada',
          });
        }
      }
    }

    const command = {
      type: 'DELETE_SEED' as const,
      metadata,
      payload: {
        seedId: seedGoalId,
        restoreBalance: restoreBalance
      }
    };
    await FinanceCommandDispatcher.dispatch(command);
  }
}
