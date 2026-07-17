import { v4 as uuidv4 } from 'uuid';
import { useWorkspaceStore } from '@/store/WorkspaceStore';
import { FinanceCommandDispatcher } from '@/domain/commands/FinanceCommandDispatcher';
import { RegisterTitheCommand, CommandMetadata } from '@/domain/commands/FinanceCommands';

export class TitheService {
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

  static async createTithe(data: { amount: number; month: number; year: number; date?: string; notes?: string; userId?: string }) {
    const titheId = uuidv4();
    const command: RegisterTitheCommand = {
      type: 'REGISTER_TITHE',
      metadata: this.getMetadata(),
      payload: {
        titheId,
        amount: data.amount,
        month: data.month,
        year: data.year,
        date: data.date || new Date().toISOString(),
        notes: data.notes
      }
    };

    await FinanceCommandDispatcher.dispatch(command);
    return { id: titheId, ...data };
  }

  static async updateTithe(id: string, data: any) {
    console.warn("Update Tithe not supported in FinanceCommands yet");
  }

  static async deleteTithe(id: string) {
    console.warn("Delete Tithe not supported in FinanceCommands yet");
  }
}
