import { v4 as uuidv4 } from 'uuid';
import { useWorkspaceStore } from '@/store/WorkspaceStore';
import { FinanceCommandDispatcher } from '@/domain/commands/FinanceCommandDispatcher';
import { 
  CreateTransactionCommand, 
  UpdateTransactionCommand, 
  DeleteTransactionCommand, 
  CommandMetadata 
} from '@/domain/commands/FinanceCommands';

export class TransactionService {
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

  static async createTransaction(data: { 
    accountId: string; 
    amount: number; 
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER'; 
    categoryId?: string; 
    date?: string; 
    notes?: string; 
    transferAccountId?: string; 
  }) {
    const transactionId = uuidv4();
    const command: CreateTransactionCommand = {
      type: 'CREATE_TRANSACTION',
      metadata: this.getMetadata(),
      payload: {
        transactionId,
        accountId: data.accountId,
        amount: data.amount,
        type: data.type,
        categoryId: data.categoryId,
        date: data.date || new Date().toISOString(),
        description: data.notes,
        transferAccountId: data.transferAccountId
      }
    };

    await FinanceCommandDispatcher.dispatch(command);
    
    return { id: transactionId, ...data };
  }

  static async updateTransaction(id: string, data: any) {
    const command: UpdateTransactionCommand = {
      type: 'UPDATE_TRANSACTION',
      metadata: this.getMetadata(),
      payload: {
        transactionId: id,
        accountId: data.accountId,
        amount: data.amount,
        type: data.type,
        categoryId: data.categoryId,
        date: data.date,
        description: data.notes || data.description,
        transferAccountId: data.transferAccountId
      }
    };

    await FinanceCommandDispatcher.dispatch(command);
  }

  static async deleteTransaction(id: string) {
    const command: DeleteTransactionCommand = {
      type: 'DELETE_TRANSACTION',
      metadata: this.getMetadata(),
      payload: {
        transactionId: id
      }
    };

    await FinanceCommandDispatcher.dispatch(command);
  }
}
