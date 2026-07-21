import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { db } from '@/lib/db';
import { addToSyncQueue, processSyncQueue } from '@/services/syncQueueService';

describe('SyncQueueService', () => {
  beforeEach(async () => {
    await db.syncQueue.clear();
    // Interceptar global fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe agregar un item a la cola en estado PENDING', async () => {
    await addToSyncQueue('prayerInteractions', 'record-1', 'INSERT', {
      prayerRequestId: 'req-1',
      userId: 'user-1'
    }, { endpoint: '/api/test', method: 'POST' });

    const queue = await db.syncQueue.toArray();
    expect(queue).toHaveLength(1);
    expect(queue[0].status).toBe('PENDING');
    expect(queue[0].operation).toBe('INSERT');
    expect(queue[0].payload.prayerRequestId).toBe('req-1');
  });

  it('debe procesar un item PENDING y marcarlo como SYNCED si la red es exitosa', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    await addToSyncQueue('testTable', 'record-2', 'INSERT', { a: 1 }, { endpoint: '/api/test', method: 'POST' });
    
    // Forzamos que navegador esté online para el test
    const originalNavigator = global.navigator;
    Object.defineProperty(global, 'navigator', {
      value: { onLine: true },
      writable: true
    });

    await processSyncQueue();

    const queue = await db.syncQueue.toArray();
    expect(queue[0].status).toBe('SYNCED');

    global.navigator = originalNavigator;
  });

  it('debe reintentar items en estado ERROR o PENDING', async () => {
    // Primero falla
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    await addToSyncQueue('testTable', 'record-3', 'INSERT', { a: 1 }, { endpoint: '/api/test', method: 'POST' });
    
    Object.defineProperty(global, 'navigator', { value: { onLine: true }, writable: true });

    await processSyncQueue();
    let queue = await db.syncQueue.toArray();
    expect(queue[0].status).toBe('ERROR');
    expect(queue[0].attempts).toBe(1);

    // Luego funciona
    (global.fetch as any).mockResolvedValueOnce({ ok: true, status: 200 });
    
    await processSyncQueue();
    queue = await db.syncQueue.toArray();
    expect(queue[0].status).toBe('SYNCED');
  });

  it('debe recuperar items atascados en estado PROCESSING', async () => {
    await db.syncQueue.add({
      id: 'stuck-1',
      tableName: 'test',
      recordId: 'rec-4',
      operation: 'INSERT',
      payload: { _rest: { endpoint: '/api/test', method: 'POST' } },
      status: 'PROCESSING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Simulamos que se quedó atascado hace 3 minutos
      lastAttempt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      attempts: 0
    });

    (global.fetch as any).mockResolvedValueOnce({ ok: true, status: 200 });
    Object.defineProperty(global, 'navigator', { value: { onLine: true }, writable: true });

    await processSyncQueue();

    const queue = await db.syncQueue.toArray();
    expect(queue[0].status).toBe('SYNCED');
  });

  it('debe arrojar error si la respuesta del servidor es HTTP 500', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: false, status: 500 });
    
    await db.syncQueue.put({
      id: 'task-500',
      tableName: 'prayerInteractions',
      recordId: 'req-test',
      operation: 'INSERT',
      payload: { 
        prayerRequestId: 'req-1', 
        userId: 'user-1',
        _rest: { endpoint: '/api/test', method: 'POST' }
      },
      status: 'PENDING',
      attempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAttempt: null
    });

    await processSyncQueue();

    const task = await db.syncQueue.get('task-500');
    expect(task?.status).toBe('ERROR');
    expect(task?.attempts).toBe(1);
  });

  it('debe marcar ERROR directamente si el endpoint no esta configurado', async () => {
    await db.syncQueue.put({
      id: 'task-no-endpoint',
      tableName: 'prayerInteractions',
      recordId: 'req-test',
      operation: 'INSERT',
      payload: { },
      status: 'PENDING',
      attempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAttempt: null
    });

    await processSyncQueue();

    const task = await db.syncQueue.get('task-no-endpoint');
    expect(task?.status).toBe('ERROR');
  });

  it('debe limpiar las tareas SYNCED con mas de 7 dias de antigüedad', async () => {
    // Use a date strictly older than 8 days to ensure it passes the < comparison
    // Add a PENDING item so processSyncQueue doesn't return early
    await db.syncQueue.put({
      id: 'task-dummy',
      tableName: 'prayerInteractions',
      recordId: 'req-test',
      operation: 'INSERT',
      payload: {},
      status: 'PENDING',
      attempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAttempt: null
    });

    const oldDate = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString();
    
    await db.syncQueue.put({
      id: 'task-old',
      tableName: 'prayerInteractions',
      recordId: 'req-test',
      operation: 'INSERT',
      payload: { },
      status: 'SYNCED',
      attempts: 1,
      createdAt: oldDate,
      updatedAt: oldDate,
      lastAttempt: null
    });

    await processSyncQueue();

    const task = await db.syncQueue.get('task-old');
    expect(task).toBeUndefined();
  });
});
