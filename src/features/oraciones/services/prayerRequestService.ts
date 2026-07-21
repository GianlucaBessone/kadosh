'use client';

import { useMemo, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { addDays } from '@/features/oraciones/utils/formatDisplayName';
import { v4 as uuidv4 } from 'uuid';
import { addToSyncQueue } from '@/services/syncQueueService';
import { syncEngine } from '@/services/syncEngine';
import { processIncomingPrayerRequests } from './prayerSyncPipeline';
import type { MyPrayerRequestDTO, PrayerRequestDTO, CommunityPrayerSummary } from '../types';

const ACTIVE_DAYS = 7;

function formatPrayerRequestRow(row: any): MyPrayerRequestDTO {
  return {
    id: row.id,
    message: row.message,
    status: row.status === 'ARCHIVED' ? 'ARCHIVED' : (new Date(row.expiresAt) > new Date() ? 'ACTIVE' : 'ARCHIVED'),
    prayerCount: row.prayerCount,
    joinedCount: 0,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    archivedAt: row.archivedAt ?? row.expiresAt,
    daysRemaining: Math.max(0, Math.ceil((new Date(row.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
    closeReason: row.status === 'ARCHIVED' ? 'CANCELLED' : (new Date(row.expiresAt) <= new Date() ? 'EXPIRED' : undefined)
  };
}

export async function createPrayerRequest(params: { userId: string; message: string }) {
  const { userId, message } = params;
  if (!userId) throw new Error('Usuario no definido');

  const now = new Date();
  const expiresAt = addDays(now, ACTIVE_DAYS).toISOString();
  const requestId = uuidv4();

  // Guardamos inmediatamente en Dexie (Optimistic UI)
  await db.prayerRequests.put({
    id: requestId,
    workspaceId: null, // REST no requiere COMMUNITY
    userId,
    message: message.trim(),
    status: 'ACTIVE',
    prayerCount: 0,
    joinedCount: 0,
    createdAt: now.toISOString(),
    expiresAt,
    updatedAt: now.toISOString(),
    archivedAt: null,
  });

  // Obtenemos el nombre real del usuario de Dexie para enviarlo
  const user = await db.users.get(userId);
  const name = user?.name || undefined;
  const lastName = user?.lastName || undefined;

  // Encolamos la petición REST en SyncQueue
  await addToSyncQueue('prayerRequests', requestId, 'INSERT', {
    id: requestId,
    userId,
    message: message.trim(),
    name,
    lastName,
  }, { endpoint: '/api/prayer-requests', method: 'POST' });
}

export async function cancelPrayerRequest(requestId: string, userId: string) {
  if (!userId) throw new Error('Usuario no definido');

  const req = await db.prayerRequests.get(requestId);
  if (!req || req.userId !== userId) return;

  // Actualizamos Dexie (Optimistic UI)
  await db.prayerRequests.update(requestId, {
    status: 'ARCHIVED',
    archivedAt: new Date().toISOString()
  });

  // Encolamos cancelación REST
  await addToSyncQueue('prayerRequests', requestId, 'DELETE', { userId }, { endpoint: `/api/prayer-requests/${requestId}/cancel`, method: 'POST' });
}

export async function prayForRequest(requestId: string, userId: string) {
  const interactionId = uuidv4();
  
  // Actualizamos Dexie (Optimistic UI) y SyncQueue de forma ATÓMICA
  await db.transaction('rw', db.prayerRequests, db.prayerInteractions, db.syncQueue, async () => {
    const existing = await db.prayerInteractions.get({ prayerRequestId: requestId, userId, type: 'PRAYED' });
    if (existing) return;

    await db.prayerInteractions.put({
      id: interactionId,
      prayerRequestId: requestId,
      userId,
      type: 'PRAYED',
      createdAt: new Date().toISOString()
    });
    
    const req = await db.prayerRequests.get(requestId);
    if (req) {
      await db.prayerRequests.update(requestId, {
        prayerCount: (req.prayerCount || 0) + 1
      });
    }

    // Encolamos en SyncQueue atómicamente
    await addToSyncQueue('prayerInteractions', interactionId, 'INSERT', {
      prayerRequestId: requestId,
      userId,
      interactionId,
      type: 'PRAYED'
    }, { endpoint: `/api/prayer-requests/${requestId}/pray`, method: 'POST' });
  });

  // Disparamos sincronización inmediata para la comunidad
  syncEngine.sync().catch(console.error);
}

export async function joinPrayerRequest(requestId: string, userId: string) {
  const interactionId = uuidv4();

  // Actualizamos Dexie y SyncQueue de forma ATÓMICA
  await db.transaction('rw', db.prayerRequests, db.prayerInteractions, db.syncQueue, async () => {
    const existing = await db.prayerInteractions.get({ prayerRequestId: requestId, userId, type: 'JOINED' });
    if (existing) return;

    await db.prayerInteractions.put({
      id: interactionId,
      prayerRequestId: requestId,
      userId,
      type: 'JOINED',
      createdAt: new Date().toISOString()
    });
    
    const req = await db.prayerRequests.get(requestId);
    if (req) {
      await db.prayerRequests.update(requestId, {
        joinedCount: (req.joinedCount || 0) + 1
      });
    }

    // Encolamos en SyncQueue atómicamente
    await addToSyncQueue('prayerInteractions', interactionId, 'INSERT', {
      prayerRequestId: requestId,
      userId,
      interactionId,
      type: 'JOINED'
    }, { endpoint: `/api/prayer-requests/${requestId}/join`, method: 'POST' });
  });

  // Disparamos sincronización inmediata para la comunidad
  syncEngine.sync().catch(console.error);
}

export async function prayAllPendingRequests(userId: string): Promise<number> {
  if (!userId) throw new Error('Usuario no definido');

  const now = new Date();
  const interactions = await db.prayerInteractions.where('userId').equals(userId).toArray();
  const prayedSet = new Set(interactions.filter(i => i.type === 'PRAYED').map(i => i.prayerRequestId));

  const pendingRequests = await db.prayerRequests
    .filter(row => 
      row.userId !== userId && 
      (row.workspaceId === 'COMMUNITY' || row.workspaceId === null) &&
      new Date(row.expiresAt) > now &&
      row.status !== 'ARCHIVED' &&
      !prayedSet.has(row.id)
    )
    .toArray();

  for (const request of pendingRequests) {
    await prayForRequest(request.id, userId);
  }

  return pendingRequests.length;
}

export function useMyPrayerRequests(userId: string | null) {
  return useLiveQuery(async () => {
    if (!userId) return { active: [], archived: [] };

    const rows = await db.prayerRequests
      .filter(row => row.userId === userId && (row.workspaceId === 'COMMUNITY' || row.workspaceId === null))
      .toArray();

    const active: MyPrayerRequestDTO[] = [];
    const archived: MyPrayerRequestDTO[] = [];
    const now = new Date();

    rows.forEach(row => {
      const item: MyPrayerRequestDTO = formatPrayerRequestRow(row);
      // Phase 1 mock properties
      item.joinedCount = 0;

      if (item.status === 'ACTIVE' && new Date(row.expiresAt) > now) active.push(item);
      else {
        item.status = 'ARCHIVED'; // ensure status is archived if expired
        item.closeReason = item.closeReason || 'EXPIRED';
        archived.push(item);
      }
    });

    active.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    archived.sort((a, b) => new Date(b.archivedAt || b.expiresAt).getTime() - new Date(a.archivedAt || a.expiresAt).getTime());

    return { active, archived };
  }, [userId]) ?? { active: [], archived: [] };
}

export function useCommunityPrayerRequests(userId: string | null) {
  return useLiveQuery(async () => {
    if (!userId) {
      return { pending: [], prayed: [], summary: { activeCount: 0, pendingCount: 0, unaccompaniedCount: 0, accompaniedCount: 0 } };
    }

    const now = new Date();

    // === Datos locales (Única fuente de verdad) ===
    const combined = await db.prayerRequests
      .filter(row => 
        row.userId !== userId && 
        (row.workspaceId === 'COMMUNITY' || row.workspaceId === null)
      )
      .toArray();

    // === Procesamiento ===
    const interactions = await db.prayerInteractions.where('userId').equals(userId).toArray();
    const prayedSet = new Set(interactions.filter(i => i.type === 'PRAYED').map(i => i.prayerRequestId));
    const joinedSet = new Set(interactions.filter(i => i.type === 'JOINED').map(i => i.prayerRequestId));

    const authorIds = Array.from(new Set(combined.map(r => r.userId)));
    const authors = await db.users.where('id').anyOf(authorIds).toArray();
    const authorMap = Object.fromEntries(authors.map(a => [a.id, a]));

    const pending: PrayerRequestDTO[] = [];
    const prayed: PrayerRequestDTO[] = [];
    const unaccompanied: PrayerRequestDTO[] = [];
    const accompanied: PrayerRequestDTO[] = [];

combined.forEach(row => {
  if (new Date(row.expiresAt) <= now || row.status === 'ARCHIVED') return;

  const author = authorMap[row.userId];
  const rowAny = row as any;
  let displayName = rowAny.authorDisplayName;
  let initial = rowAny.authorInitial;

  if (!displayName) {
    if (author) {
      const name = author.name?.trim();
      const lastName = author.lastName?.trim();
      const alias = (author as any).alias?.trim(); // if alias exists in the future

      if (name && lastName) {
        displayName = `${name.split(' ')[0]} ${lastName[0].toUpperCase()}.`;
        initial = name[0].toUpperCase();
      } else if (name) {
        displayName = name.split(' ')[0];
        initial = name[0].toUpperCase();
      } else if (alias) {
        displayName = alias;
        initial = alias[0].toUpperCase();
      } else {
        displayName = 'Usuario';
        initial = 'U';
        console.warn(`[PrayerModule] Warning: Public name fallback to 'Usuario' used for userId: ${row.userId}`);
      }
    } else {
      displayName = 'Usuario';
      initial = 'U';
      console.warn(`[PrayerModule] Warning: Author not found, falling back to 'Usuario' for userId: ${row.userId}`);
    }
  }

  const item: PrayerRequestDTO = {
    id: row.id,
    message: row.message,
    status: 'ACTIVE' as const,
    prayerCount: row.prayerCount || 0,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    archivedAt: row.archivedAt ?? null,
    daysRemaining: Math.max(0, Math.ceil((new Date(row.expiresAt).getTime() - now.getTime()) / (86400000))),
    authorDisplayName: displayName,
    authorInitial: initial,
    hasPrayed: prayedSet.has(row.id),
    joinedCount: row.joinedCount || 0,
    hasJoined: (row as any).hasJoined ?? joinedSet.has(row.id),
  };

  item.hasPrayed ? prayed.push(item) : pending.push(item);
  item.hasJoined ? accompanied.push(item) : unaccompanied.push(item);
});

    const activeCount = pending.length + prayed.length;
    const unaccompaniedCount = unaccompanied.length;
    const accompaniedCount = accompanied.length;

    pending.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    prayed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    unaccompanied.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    accompanied.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      pending,
      prayed,
      unaccompanied,
      accompanied,
      summary: { 
        activeCount, 
        pendingCount: pending.length, 
        unaccompaniedCount, 
        accompaniedCount 
      }
    };
  }, [userId]) ?? { pending: [], prayed: [], unaccompanied: [], accompanied: [], summary: { activeCount: 0, pendingCount: 0, unaccompaniedCount: 0, accompaniedCount: 0 } };
}

export function usePrayerStats(userId: string | null): number {
  const localCount = useLiveQuery(async () => {
    if (!userId) return 0;
    const now = new Date();
    
    // Contamos solo peticiones de otros usuarios en comunidad que no han expirado ni están archivadas
    const count = await db.prayerRequests
      .filter(row => 
        row.userId !== userId && 
        (row.workspaceId === 'COMMUNITY' || row.workspaceId === null) &&
        new Date(row.expiresAt) > now &&
        row.status !== 'ARCHIVED'
      )
      .count();
      
    return count;
  }, [userId]) ?? 0;

  return localCount;
}

export function useSyncPrayerRequests(userId: string | null) {
  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    const syncData = async () => {
      try {
        const params = new URLSearchParams({ scope: 'community', userId });
        const res = await fetch(`/api/prayer-requests?${params}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          const serverRequestRows = [...(data.pending || []), ...(data.prayed || [])];
          
          // Agregamos currentUserId al DTO para que el pipeline sincronice los interacciones del usuario actual
          const requestsForPipeline = serverRequestRows.map(r => ({ ...r, currentUserId: userId }));
          
          await processIncomingPrayerRequests(requestsForPipeline);
        }
      } catch (e) {
        console.error('Error fetching community prayers from API:', e);
      }
    };

    // Sincronización inicial
    syncData();

    // Intervalo de sincronización periódico (ej. cada 60 seg) para respaldar el Realtime
    const intervalId = setInterval(syncData, 60000);

    // Recuperación ante suspensión de pestaña o desconexión
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncData();
      }
    };
    const handleOnline = () => {
      syncData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [userId]);
}