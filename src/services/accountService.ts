import { v4 as uuidv4 } from 'uuid';
import { useWorkspaceStore } from '@/store/WorkspaceStore';
import { FinanceCommandDispatcher } from '@/domain/commands/FinanceCommandDispatcher';
import { CreateAccountCommand, UpdateAccountCommand, DeleteAccountCommand, CommandMetadata } from '@/domain/commands/FinanceCommands';

export class AccountService {
  private static getMetadata(): CommandMetadata {
    const state = useWorkspaceStore.getState();
    const workspaceId = state.activeWorkspaceId;
    if (!workspaceId) throw new Error('No active workspace');
    
    return {
      workspaceId,
      userId: 'local-user', // Should be fetched from auth context
      deviceId: 'local-device', // Should be fetched from device context
      timestamp: new Date().toISOString()
    };
  }

  static async createAccount(data: { name: string; balance?: number; type?: string; currency?: string; userId?: string }) {
    const accountId = uuidv4();
    const command: CreateAccountCommand = {
      type: 'CREATE_ACCOUNT',
      metadata: this.getMetadata(),
      payload: {
        accountId,
        name: data.name,
        currency: data.currency || 'USD',
        initialBalance: data.balance || 0,
        type: data.type || 'CASH'
      }
    };

    await FinanceCommandDispatcher.dispatch(command);
    
    // Return mock account for backward compatibility if needed, or rely on UI updating via store
    return { id: accountId, ...data };
  }

  static async updateAccount(id: string, data: { name?: string; currency?: string }) {
    const command: UpdateAccountCommand = {
      type: 'UPDATE_ACCOUNT',
      metadata: this.getMetadata(),
      payload: {
        accountId: id,
        ...data
      }
    };

    await FinanceCommandDispatcher.dispatch(command);
  }

  static async deleteAccount(id: string) {
    const command: DeleteAccountCommand = {
      type: 'DELETE_ACCOUNT',
      metadata: this.getMetadata(),
      payload: {
        accountId: id
      }
    };

    await FinanceCommandDispatcher.dispatch(command);
  }
}
