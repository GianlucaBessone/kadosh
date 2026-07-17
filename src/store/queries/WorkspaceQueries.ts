import { useWorkspaceStore } from '../WorkspaceStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

export const WorkspaceQueries = {
  /**
   * Retrieves the current active workspace ID.
   */
  useActiveWorkspaceId(): string | null {
    return useWorkspaceStore(state => state.activeWorkspaceId);
  },

  /**
   * Retrieves the current active workspace state.
   */
  useActiveWorkspace(): any {
    // For now returning basic info, adapt if UI expects full state
    const wsId = this.useActiveWorkspaceId();
    return useLiveQuery(() => wsId ? db.workspaces.get(wsId) : (Promise.resolve(undefined) as any), [wsId]) as any;
  },

  useSettings(): any {
    // Basic fallback to global settings
    return useLiveQuery(() => db.settings.orderBy('id').first()) || {};
  },

  /**
   * Retrieves all active accounts as an array.
   */
  useAccounts(): any[] {
    const wsId = this.useActiveWorkspaceId();
    return useLiveQuery(async () => {
      if (!wsId) return [];
      const accounts = await db.accounts.where('workspaceId').equals(wsId).toArray();
      return accounts.filter(a => !a.deletedAt);
    }, [wsId]) || [];
  },

  /**
   * Retrieves all active transactions as an array, sorted by date (descending).
   */
  useTransactions(): any[] {
    const wsId = this.useActiveWorkspaceId();
    return useLiveQuery(async () => {
      if (!wsId) return [];
      const txs = await db.transactions.where('workspaceId').equals(wsId).toArray();
      return txs.filter(t => !t.deletedAt).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [wsId]) || [];
  },

  /**
   * Calculates the global balance across all cash/bank accounts.
   */
  useGlobalBalance(): number {
    const accounts = this.useAccounts();
    return accounts.reduce((acc, account) => acc + account.balance, 0);
  },

  /**
   * Gets a specific account by ID.
   */
  useAccount(accountId: string): any {
    return useLiveQuery(async () => {
      const acc = await db.accounts.get(accountId);
      return acc && !acc.deletedAt ? acc : undefined;
    }, [accountId]);
  },

  /**
   * Retrieves all categories as an array.
   */
  useCategories(): any[] {
    const wsId = this.useActiveWorkspaceId();
    return useLiveQuery(async () => {
      if (!wsId) return [];
      const cats = await db.categories.where('workspaceId').equals(wsId).toArray();
      return cats.filter(c => !c.deletedAt);
    }, [wsId]) || [];
  },

  /**
   * Retrieves all tithes as an array.
   */
  useTithes(): any[] {
    const wsId = this.useActiveWorkspaceId();
    return useLiveQuery(async () => {
      if (!wsId) return [];
      const tithes = await db.tithes.where('workspaceId').equals(wsId).toArray();
      return tithes.filter(t => !t.deletedAt);
    }, [wsId]) || [];
  },

  /**
   * Retrieves all seed goals as an array.
   */
  useSeeds(): any[] {
    const wsId = this.useActiveWorkspaceId();
    return useLiveQuery(async () => {
      if (!wsId) return [];
      const seeds = await db.seedGoals.where('workspaceId').equals(wsId).toArray();
      return seeds.filter(s => !s.deletedAt);
    }, [wsId]) || [];
  },

  /**
   * Retrieves all commitments as an array.
   */
  useCommitments(): any[] {
    const wsId = this.useActiveWorkspaceId();
    return useLiveQuery(async () => {
      if (!wsId) return [];
      // Note: commitments schema might use ownerId instead of workspaceId based on previous iteration
      const commitments = await db.financialCommitments.where('ownerId').equals(wsId).toArray();
      return commitments.filter(c => !c.deletedAt);
    }, [wsId]) || [];
  }
};
