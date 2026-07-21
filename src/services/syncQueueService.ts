import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function addToSyncQueue(
  tableName: string,
  recordId: string,
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
  payload: any,
  restConfig?: { endpoint: string; method: string }
) {
  if (restConfig) {
    payload._rest = restConfig;
  }

  await db.syncQueue.add({
    id: uuidv4(),
    tableName,
    recordId,
    operation,
    payload,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attempts: 0,
    lastAttempt: null,
  });
}

export async function processSyncQueue() {
  if (typeof window === 'undefined' || !navigator.onLine) return;

  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const pending = await db.syncQueue
    .filter(item => 
      item.status === 'PENDING' || 
      item.status === 'ERROR' || 
      (item.status === 'PROCESSING' && (!item.lastAttempt || item.lastAttempt < twoMinutesAgo))
    )
    .toArray();

  if (pending.length === 0) return;

  for (const item of pending) {
    try {
      await db.syncQueue.update(item.id, { 
        status: 'PROCESSING',
        lastAttempt: new Date().toISOString()
      });
      
      let endpoint = '';
      let method = '';
      let bodyData = { ...item.payload };

      if (bodyData._rest) {
        endpoint = bodyData._rest.endpoint;
        method = bodyData._rest.method;
        delete bodyData._rest; // clean it up before sending
      }

      if (endpoint) {
        const res = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });
        
        if (res.ok || res.status === 410 || res.status === 400 || res.status === 404) {
          await db.syncQueue.update(item.id, { status: 'SYNCED', lastAttempt: new Date().toISOString() });
        } else {
          throw new Error(`Server returned ${res.status}`);
        }
      } else {
        // Fallback for non-REST queue items (or unconfigured)
        await db.syncQueue.update(item.id, { status: 'ERROR', lastAttempt: new Date().toISOString() });
      }
    } catch (e) {
      console.error('SyncQueue error:', e);
      await db.syncQueue.update(item.id, { 
        status: 'ERROR', 
        attempts: (item.attempts || 0) + 1, 
        lastAttempt: new Date().toISOString() 
      });
    }
  }

  // Cleanup SYNCED older than 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const syncedItems = await db.syncQueue.toArray();
  const oldSyncedIds = syncedItems
    .filter(item => item.status === 'SYNCED' && item.updatedAt < sevenDaysAgo)
    .map(item => item.id);
    
  if (oldSyncedIds.length > 0) {
    await db.syncQueue.bulkDelete(oldSyncedIds as string[]);
  }
}
