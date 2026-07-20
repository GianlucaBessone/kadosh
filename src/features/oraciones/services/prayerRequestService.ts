'use client';

import { useMemo, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { addDays } from '@/features/oraciones/utils/formatDisplayName';
import { v4 as uuidv4 } from 'uuid';
import { addToSyncQueue } from '@/services/syncQueueService';
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
  
  // Verificamos si ya oramos localmente
  const existing = await db.prayerInteractions.get({ prayerRequestId: requestId, userId, type: 'PRAYED' });
  if (existing) return;

  // Actualizamos Dexie (Optimistic UI)
  await db.transaction('rw', db.prayerRequests, db.prayerInteractions, async () => {
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
  });

  // Encolamos en SyncQueue
  await addToSyncQueue('prayerInteractions', interactionId, 'INSERT', {
    prayerRequestId: requestId,
    userId,
    interactionId,
    type: 'PRAYED'
  }, { endpoint: `/api/prayer-requests/${requestId}/pray`, method: 'POST' });
}

export async function joinPrayerRequest(requestId: string, userId: string) {
  const interactionId = uuidv4();

  const existing = await db.prayerInteractions.get({ prayerRequestId: requestId, userId, type: 'JOINED' });
  if (existing) return;

  // Actualizamos Dexie (Optimistic UI)
  await db.transaction('rw', db.prayerRequests, db.prayerInteractions, async () => {
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
  });

  // Encolamos en SyncQueue
  await addToSyncQueue('prayerInteractions', interactionId, 'INSERT', {
    prayerRequestId: requestId,
    userId,
    interactionId,
    type: 'JOINED'
  }, { endpoint: `/api/prayer-requests/${requestId}/join`, method: 'POST' });
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

    // === Datos locales ===
    const localRequestRows = await db.prayerRequests
      .filter(row => 
        row.userId !== userId && 
        (row.workspaceId === 'COMMUNITY' || row.workspaceId === null)
      )
      .toArray();

    // === Datos del servidor ===
    let serverRequestRows: any[] = [];
    try {
      const params = new URLSearchParams({ scope: 'community', userId });
      const res = await fetch(`/api/prayer-requests?${params}`);
      if (res.ok) {
        const data = await res.json();
        serverRequestRows = [...(data.pending || []), ...(data.prayed || [])];
      }
    } catch (e) {
      console.error('Error fetching from API:', e);
    }

    // Combinar evitando duplicados
    const combined = [...localRequestRows];
    const existing = new Set(localRequestRows.map(r => r.id));

    for (const srv of serverRequestRows) {
      if (!existing.has(srv.id)) {
        combined.push(srv);
        existing.add(srv.id);
      }
    }

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
  const [serverCount, setServerCount] = useState<number>(0);

  const localRows = useLiveQuery(
    () => {
      if (!userId) return [];
      const now = new Date();
      return db.prayerRequests
        .filter(
          (row) =>
            row.userId !== userId &&
            (row.workspaceId === 'COMMUNITY' || row.workspaceId === null) &&
            new Date(row.expiresAt) > now &&
            row.status !== 'ARCHIVED'
        )
        .toArray();
    },
    [userId]
  );

  const localCount = useMemo(() => {
    if (!localRows) return 0;
    return new Set(localRows.map((r) => r.userId)).size;
  }, [localRows]);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const params = new URLSearchParams();
        params.set('scope', 'stats');
        if (userId) params.set('excludeUserId', userId);

        const res = await fetch(`/api/prayer-requests?${params.toString()}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setServerCount(data.activeCount || 0);
        }
      } catch (e) {
        console.error('Error fetching stats from API:', e);
      }
    };

    fetchStats();
    const intervalId = setInterval(fetchStats, 10000); // Poll every 10 seconds

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [userId]);

  return Math.max(localCount, serverCount);
}