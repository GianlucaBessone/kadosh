import { db } from '@/lib/db';

export class SyncEngine {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  start(intervalMs: number = 30000) {
    if (typeof window === 'undefined') return;

    // Only sync if user has a linked cloud account (Supabase session cookie exists)
    const hasSupabaseSession = document.cookie.split(';').some(c => c.trim().startsWith('sb-'));
    if (!hasSupabaseSession) {
      console.log('Sync disabled: no cloud account linked.');
      return;
    }

    // Listen to online events
    window.addEventListener('online', this.sync);

    // Initial sync
    this.sync();

    // Periodic sync
    if (!this.syncInterval) {
      this.syncInterval = setInterval(() => {
        if (navigator.onLine) {
          this.sync();
        }
      }, intervalMs);
    }
  }

  stop() {
    if (typeof window === 'undefined') return;
    window.removeEventListener('online', this.sync);
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  sync = async () => {
    if (this.isSyncing || typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }

    this.isSyncing = true;
    try {
      await this.pushChanges();
      await this.pullChanges();
    } catch (error: any) {
      if (error instanceof TypeError && (error.message === 'Failed to fetch' || error.message === 'Load failed')) {
        console.log('Sync paused: device is offline or server unreachable.');
      } else {
        console.error('Sync failed:', error);
      }
    } finally {
      this.isSyncing = false;
    }
  };

  private async pushChanges() {
    // 1. Get pending items from sync queue
    const pendingItems = await db.syncQueue
      .where('status')
      .anyOf(['PENDING', 'ERROR'])
      .toArray();

    if (pendingItems.length === 0) return;

    // Mark as processing
    await db.syncQueue.bulkUpdate(
      pendingItems.map((item) => ({ key: item.id, changes: { status: 'PROCESSING', attempts: item.attempts + 1, lastAttempt: new Date().toISOString() } }))
    );

    try {
      const response = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations: pendingItems }),
      });

      if (response.status === 401) {
        // User not synced with cloud. Revert to PENDING.
        await db.syncQueue.bulkUpdate(
          pendingItems.map((item) => ({ key: item.id, changes: { status: 'PENDING' } }))
        );
        return;
      }

      if (!response.ok) {
        throw new Error('Push failed');
      }

      // Mark as synced (delete or update status)
      // Usually it's better to just delete synced items to keep the queue small
      const idsToDelete = pendingItems.map((i) => i.id);
      await db.syncQueue.bulkDelete(idsToDelete);
    } catch (error) {
      // Revert to error status
      await db.syncQueue.bulkUpdate(
        pendingItems.map((item) => ({ key: item.id, changes: { status: 'ERROR' } }))
      );
      throw error;
    }
  }

  private async pullChanges() {
    // 1. Get last sync time
    let metadata = await db.metadata.get('sync-metadata');
    if (!metadata) {
      metadata = { id: 'sync-metadata', lastSyncAt: null, deviceId: null };
      await db.metadata.add(metadata);
    }

    const lastSyncAt = metadata.lastSyncAt;

    // 2. Fetch changes
    const response = await fetch(`/api/sync/pull${lastSyncAt ? `?lastSyncAt=${encodeURIComponent(lastSyncAt)}` : ''}`);
    if (response.status === 401) {
      // User is not synced with cloud. Just ignore.
      return;
    }
    if (!response.ok) {
      throw new Error('Pull failed');
    }

    const data = await response.json();
    const serverTimestamp = data.serverTimestamp;
    
    // Process incoming data (Last Write Wins)
    await db.transaction('rw', [db.transactions, db.categories, db.accounts, db.seedGoals, db.seedContributions, db.tithes, db.settings, db.notifications], async () => {
      // Transactions
      for (const t of data.transactions || []) {
        const existing = await db.transactions.get(t.id);
        if (!existing || new Date(t.updatedAt) > new Date(existing.updatedAt)) {
          await db.transactions.put(t);
        }
      }

      // Categories
      for (const c of data.categories || []) {
        const existing = await db.categories.get(c.id);
        if (!existing || new Date(c.updatedAt) > new Date(existing.updatedAt)) {
          await db.categories.put(c);
        }
      }

      // Accounts
      for (const a of data.accounts || []) {
        const existing = await db.accounts.get(a.id);
        if (!existing || new Date(a.updatedAt) > new Date(existing.updatedAt)) {
          await db.accounts.put(a);
        }
      }

      // SeedGoals
      for (const s of data.seedGoals || []) {
        const existing = await db.seedGoals.get(s.id);
        if (!existing || new Date(s.updatedAt) > new Date(existing.updatedAt)) {
          await db.seedGoals.put(s);
        }
      }
      
      // SeedContributions
      for (const sc of data.seedContributions || []) {
        const existing = await db.seedContributions.get(sc.id);
        if (!existing || new Date(sc.updatedAt) > new Date(existing.updatedAt)) {
          await db.seedContributions.put(sc);
        }
      }

      // Tithes
      for (const t of data.tithes || []) {
        const existing = await db.tithes.get(t.id);
        if (!existing || new Date(t.updatedAt) > new Date(existing.updatedAt)) {
          await db.tithes.put(t);
        }
      }

      // Settings
      for (const s of data.settings || []) {
        const existing = await db.settings.get(s.id);
        if (!existing || new Date(s.updatedAt) > new Date(existing.updatedAt)) {
          await db.settings.put(s);
        }
      }
    });

    // Update last sync time
    await db.metadata.update('sync-metadata', { lastSyncAt: serverTimestamp });
  }
}

export const syncEngine = new SyncEngine();
