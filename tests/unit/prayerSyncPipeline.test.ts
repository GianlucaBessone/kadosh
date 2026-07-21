import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@/lib/db';
import { 
  processIncomingPrayerRequests, 
  processIncomingPrayerInteraction 
} from '@/features/oraciones/services/prayerSyncPipeline';

describe('PrayerSyncPipeline', () => {
  beforeEach(async () => {
    // Limpiar base de datos en memoria (fake-indexeddb se encarga de que sea fresca)
    await db.prayerRequests.clear();
    await db.prayerInteractions.clear();
    await db.users.clear();
  });

  it('debe insertar peticiones nuevas correctamente en Dexie', async () => {
    const mockRequest = {
      id: 'req-1',
      userId: 'user-1',
      message: 'Oración de prueba',
      status: 'ACTIVE',
      prayerCount: 5,
      joinedCount: 2,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      authorDisplayName: 'Juan P.',
      name: 'Juan',
      lastName: 'Perez'
    };

    await processIncomingPrayerRequests([mockRequest]);

    const reqInDb = await db.prayerRequests.get('req-1');
    expect(reqInDb).toBeDefined();
    expect(reqInDb?.prayerCount).toBe(5);

    const userInDb = await db.users.get('user-1');
    expect(userInDb).toBeDefined();
    expect(userInDb?.name).toBe('Juan');
  });


  describe('processIncomingPrayerInteraction (Idempotencia)', () => {
    it('debe incrementar el prayerCount y guardar la interacción', async () => {
      await db.prayerRequests.put({
        id: 'req-3',
        userId: 'user-3',
        message: 'Por sanidad',
        status: 'ACTIVE',
        prayerCount: 0,
        joinedCount: 0,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        workspaceId: null,
        archivedAt: null,
        updatedAt: new Date().toISOString()
      });

      const interaction = {
        id: 'int-1',
        prayer_request_id: 'req-3',
        userId: 'user-4',
        type: 'PRAYED',
        createdAt: new Date().toISOString()
      };

      await processIncomingPrayerInteraction(interaction);

      const reqInDb = await db.prayerRequests.get('req-3');
      expect(reqInDb?.prayerCount).toBe(1);

      const storedInteraction = await db.prayerInteractions.get('int-1');
      expect(storedInteraction).toBeDefined();
    });

    it('debe ignorar una interacción si el ID ya existe (Idempotencia natural)', async () => {
      await db.prayerRequests.put({
        id: 'req-4',
        userId: 'user-3',
        message: 'Por paz',
        status: 'ACTIVE',
        prayerCount: 5, // empieza en 5
        joinedCount: 0,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        workspaceId: null,
        archivedAt: null,
        updatedAt: new Date().toISOString()
      });

      const interaction = {
        id: 'int-2',
        prayer_request_id: 'req-4',
        userId: 'user-4',
        type: 'PRAYED',
        createdAt: new Date().toISOString()
      };

      // Primera vez
      await processIncomingPrayerInteraction(interaction);
      let reqInDb = await db.prayerRequests.get('req-4');
      expect(reqInDb?.prayerCount).toBe(6); // 5 + 1

      // Segunda vez (mismo ID) - Simula desconexión y re-envío de WebSocket
      await processIncomingPrayerInteraction(interaction);
      reqInDb = await db.prayerRequests.get('req-4');
      
      // Debe seguir siendo 6, NO 7
      expect(reqInDb?.prayerCount).toBe(6);
    });
  });

  it('debe registrar JOINED si req tiene hasJoined true en processIncomingPrayerRequests', async () => {
    const request = {
      id: 'req-join',
      userId: 'user-other',
      message: 'Test join',
      status: 'active' as const,
      hasJoined: true, // Esto dispara la lógica JOINED
      currentUserId: 'user-1',
      prayerCount: 0,
      joinedCount: 0,
      createdAt: new Date().toISOString()
    };

    await db.prayerRequests.put(request as any);
    await processIncomingPrayerRequests([request]);

    const joinInteraction = await db.prayerInteractions.get({
      prayerRequestId: 'req-join',
      userId: 'user-1',
      type: 'JOINED'
    });
    
    expect(joinInteraction).toBeDefined();
    expect(joinInteraction?.type).toBe('JOINED');
  });

  it('debe actualizar joinedCount en processIncomingPrayerInteraction si type es JOINED', async () => {
    const request = {
      id: 'req-interaction-join',
      userId: 'user-1',
      message: 'Test',
      status: 'active' as const,
      prayerCount: 0,
      joinedCount: 5,
      createdAt: new Date().toISOString()
    };

    await db.prayerRequests.put(request as any);

    const interaction = {
      id: 'int-join',
      prayer_request_id: 'req-interaction-join',
      userId: 'user-2',
      type: 'JOINED'
    };

    await processIncomingPrayerInteraction(interaction);

    const updatedRequest = await db.prayerRequests.get('req-interaction-join');
    expect(updatedRequest?.joinedCount).toBe(6);
  });
});

