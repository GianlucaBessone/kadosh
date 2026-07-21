import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@/lib/db';
import { addToSyncQueue, processSyncQueue } from '@/services/syncQueueService';

describe('Stress Test: SyncQueue Saturator', () => {
  beforeEach(async () => {
    await db.syncQueue.clear();
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  it('encola y procesa secuencialmente 500 tareas sin agotar recursos de red o memoria', async () => {
    // 1. Encolar 500 tareas rápidamente
    const tasks = Array.from({ length: 500 }).map((_, i) => 
      addToSyncQueue('prayerInteractions', `rec-${i}`, 'INSERT', {
        userId: `user-${i}`
      }, { endpoint: '/api/test', method: 'POST' })
    );

    await Promise.all(tasks);

    // Verificamos que las 500 estén PENDING
    let queue = await db.syncQueue.toArray();
    expect(queue.length).toBe(500);
    expect(queue.every(q => q.status === 'PENDING')).toBe(true);

    // 2. Ejecutar procesamiento
    await processSyncQueue();

    // 3. Verificamos que todas pasaron a SYNCED
    queue = await db.syncQueue.toArray();
    expect(queue.every(q => q.status === 'SYNCED')).toBe(true);
    
    // Y que el fetch se llamó 500 veces
    expect(global.fetch).toHaveBeenCalledTimes(500);
  });
});
