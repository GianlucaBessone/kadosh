import { db } from '@/lib/db';
import { soundService } from '@/lib/SoundService';
import { processSyncQueue } from '@/services/syncQueueService';

export class SyncEngine {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  async start(intervalMs: number = 30000) {
    if (typeof window === 'undefined') return;

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
      // 1. Siempre procesar la cola REST (peticiones de oración, invitados, etc.)
      await processSyncQueue();

      // 2. Comprobar si el usuario tiene cuenta en la nube para sincronizar E2EE (Finanzas)
      const user = await db.users.orderBy('id').first();
      const hasSupabaseSession = document.cookie.split(';').some(c => c.trim().startsWith('sb-'));
      
      const canSyncCloud = 
        user && 
        user.isCloudLinked && 
        user.isEmailConfirmed !== false && 
        hasSupabaseSession;

      if (canSyncCloud) {
        await this.pushChanges();
        await this.pullChanges();
      }
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
    // 1. Get pending events
    const pendingEvents = await db.workspaceEvents
      .where('syncStatus')
      .anyOf(['PENDING', 'ERROR'])
      .toArray();

    if (pendingEvents.length === 0) return;

    // Mark as processing
    await db.workspaceEvents.bulkUpdate(
      pendingEvents.map((item) => ({ key: item.id, changes: { syncStatus: 'PROCESSING' } }))
    );

    try {
      const response = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: pendingEvents }),
      });

      if (response.status === 401) {
        await db.workspaceEvents.bulkUpdate(
          pendingEvents.map((item) => ({ key: item.id, changes: { syncStatus: 'PENDING' } }))
        );
        return;
      }

      if (!response.ok) {
        throw new Error('Push failed');
      }

      // Mark as synced
      await db.workspaceEvents.bulkUpdate(
        pendingEvents.map((item) => ({ key: item.id, changes: { syncStatus: 'SYNCED' } }))
      );
    } catch (error) {
      await db.workspaceEvents.bulkUpdate(
        pendingEvents.map((item) => ({ key: item.id, changes: { syncStatus: 'ERROR' } }))
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
    
    // Process incoming events
    await db.transaction('rw', [
      db.workspaceEvents, db.workspaceSnapshots, db.workspaceKeys, 
      db.deviceWorkspaceKeys, db.settings, db.notifications
    ], async () => {
      // Eventos
      for (const e of data.workspaceEvents || []) {
        const existing = await db.workspaceEvents.get(e.id);
        if (!existing) {
          await db.workspaceEvents.put({ ...e, syncStatus: 'SYNCED' });
        }
      }

      // Snapshots
      for (const snap of data.workspaceSnapshots || []) {
        const existing = await db.workspaceSnapshots.get(snap.id);
        if (!existing) {
          await db.workspaceSnapshots.put(snap);
        }
      }

      // Llaves del Workspace
      for (const wk of data.workspaceKeys || []) {
        const existing = await db.workspaceKeys.get(wk.id);
        if (!existing) {
          await db.workspaceKeys.put(wk);
        }
      }

      // Mis llaves cifradas (DeviceWorkspaceKey)
      for (const dwk of data.deviceWorkspaceKeys || []) {
        const existing = await db.deviceWorkspaceKeys.get(dwk.id);
        if (!existing) {
          await db.deviceWorkspaceKeys.put(dwk);
        }
      }

      // Settings (Non-financial, LWW)
      for (const s of data.settings || []) {
        const existing = await db.settings.get(s.id);
        if (!existing || new Date(s.updatedAt) > new Date(existing.updatedAt)) {
          await db.settings.put(s);
        }
      }
    });

    // Notify state reducer that new events arrived
    window.dispatchEvent(new CustomEvent('workspace-events-updated'));

    // Update last sync time
    await db.metadata.update('sync-metadata', { lastSyncAt: serverTimestamp });
  }
}

export const syncEngine = new SyncEngine();