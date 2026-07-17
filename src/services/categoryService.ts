import { v4 as uuidv4 } from 'uuid';
import { useWorkspaceStore } from '@/store/WorkspaceStore';
import { FinanceCommandDispatcher } from '@/domain/commands/FinanceCommandDispatcher';
import { CreateCategoryCommand, DeleteCategoryCommand, CommandMetadata } from '@/domain/commands/FinanceCommands';

export class CategoryService {
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

  static async createCategory(data: { name: string; type: 'INCOME' | 'EXPENSE'; icon?: string; color?: string; userId?: string }) {
    const categoryId = uuidv4();
    const command: CreateCategoryCommand = {
      type: 'CREATE_CATEGORY',
      metadata: this.getMetadata(),
      payload: {
        categoryId,
        name: data.name,
        type: data.type,
        icon: data.icon,
        color: data.color
      }
    };

    await FinanceCommandDispatcher.dispatch(command);
    
    return { id: categoryId, ...data };
  }

  static async updateCategory(id: string, data: any) {
    // Note: UPDATE_CATEGORY is not in FinanceCommands yet. If needed, we should add it.
    // Assuming for now it's not supported or we ignore it.
    console.warn("Update Category not supported in FinanceCommands yet");
  }

  static async deleteCategory(id: string) {
    const command: DeleteCategoryCommand = {
      type: 'DELETE_CATEGORY',
      metadata: this.getMetadata(),
      payload: {
        categoryId: id
      }
    };

    await FinanceCommandDispatcher.dispatch(command);
  }
}
