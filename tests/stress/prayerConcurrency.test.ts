import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { processIncomingPrayerInteraction } from '@/features/oraciones/services/prayerSyncPipeline';

describe('Stress Test: Prayer Concurrency', () => {
  beforeEach(async () => {
    await db.prayerRequests.clear();
    await db.prayerInteractions.clear();
  });

  it('procesa 100 interacciones concurrentes sin perder incrementos (ACID)', async () => {
    // 1. Preparar la petición inicial
    await db.prayerRequests.put({
      id: 'req-stress-1',
      userId: 'author-1',
      message: 'Oración por paz',
      status: 'ACTIVE',
      prayerCount: 0,
      joinedCount: 0,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      workspaceId: null,
      archivedAt: null,
      updatedAt: new Date().toISOString()
    });

    // 2. Crear 100 interacciones simultáneas de usuarios distintos
    const concurrentInteractions = Array.from({ length: 100 }).map((_, i) => ({
      id: `int-stress-${i}`,
      prayer_request_id: 'req-stress-1',
      userId: `user-sim-${i}`,
      type: 'PRAYED',
      createdAt: new Date().toISOString()
    }));

    // 3. Ejecutarlas todas al mismo tiempo usando Promise.all
    // Esto simulará la contención en IndexedDB
    await Promise.all(
      concurrentInteractions.map(interaction => processIncomingPrayerInteraction(interaction))
    );

    // 4. Verificar que el contador llegó a 100 exactamente
    const finalRequest = await db.prayerRequests.get('req-stress-1');
    expect(finalRequest?.prayerCount).toBe(100);

    // 5. Verificar que se guardaron las 100 interacciones
    const interactionsCount = await db.prayerInteractions.count();
    expect(interactionsCount).toBe(100);
  });

  it('procesa 50 uniones y 50 oraciones concurrentes', async () => {
    await db.prayerRequests.put({
      id: 'req-stress-2',
      userId: 'author-1',
      message: 'Oración por salud',
      status: 'ACTIVE',
      prayerCount: 0,
      joinedCount: 0,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      workspaceId: null,
      archivedAt: null,
      updatedAt: new Date().toISOString()
    });

    const interactions = Array.from({ length: 100 }).map((_, i) => ({
      id: `int-mixed-${i}`,
      prayer_request_id: 'req-stress-2',
      userId: `user-mixed-${i}`,
      type: i % 2 === 0 ? 'JOINED' : 'PRAYED',
      createdAt: new Date().toISOString()
    }));

    await Promise.all(
      interactions.map(interaction => processIncomingPrayerInteraction(interaction))
    );

    const req = await db.prayerRequests.get('req-stress-2');
    expect(req?.joinedCount).toBe(50);
    expect(req?.prayerCount).toBe(50);
  });
});
