'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { addDays } from '@/features/oraciones/utils/formatDisplayName';
import { PrayerCommandDispatcher } from '@/domain/commands/PrayerCommandDispatcher';
import { v4 as uuidv4 } from 'uuid';
import type { MyPrayerRequestDTO, PrayerRequestDTO, CommunityPrayerSummary } from '../types';

const ACTIVE_DAYS = 7;

function formatPrayerRequestRow(row: any): MyPrayerRequestDTO {
  return {
    id: row.id,
    message: row.message,
    status: new Date(row.expiresAt) > new Date() ? 'ACTIVE' : 'ARCHIVED',
    prayerCount: row.prayerCount,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    archivedAt: row.archivedAt ?? row.expiresAt,
    daysRemaining: Math.max(0, Math.ceil((new Date(row.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  };
}

export async function createPrayerRequest(params: { userId: string; workspaceId: string | null; message: string }) {
  const { userId, workspaceId, message } = params;
  if (!userId) {
    throw new Error('Usuario no definido');
  }

  const now = new Date();
  const expiresAt = addDays(now, ACTIVE_DAYS).toISOString();
  
  // Para peticiones comunitarias, usamos un workspace especial
  const targetWorkspaceId = workspaceId || 'COMMUNITY';
  
  const command = {
    type: 'CREATE_PRAYER_REQUEST' as const,
    metadata: {
      workspaceId: targetWorkspaceId, // Siempre string, COMMUNITY para peticiones generales
      userId,
      deviceId: 'local-device',
      timestamp: now.toISOString()
    },
    payload: {
      prayerRequestId: uuidv4(),
      workspaceId: targetWorkspaceId, // Siempre string, COMMUNITY para peticiones generales
      userId,
      message: message.trim(),
      expiresAt
    }
  };

  await PrayerCommandDispatcher.dispatch(command);
  
  // Crear también en la base de datos central para que esté disponible inmediatamente
  // para otros usuarios que acceden a través de la API
  try {
    const response = await fetch('/api/prayer-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        // Pasar COMMUNITY como workspaceId para indicar que es una petición comunitaria
        workspaceId: workspaceId || 'COMMUNITY',
        message: message.trim(),
      }),
    });
    
    if (!response.ok) {
      console.error('Error creando petición de oración en la base de datos central:', await response.text());
    }
  } catch (error) {
    console.error('Error de red creando petición de oración en la base de datos central:', error);
  }
}

export async function prayForRequest(requestId: string, userId: string, workspaceId: string | null) {
  const targetWorkspaceId = workspaceId || 'COMMUNITY';
  
  const command = {
    type: 'PRAY_FOR_REQUEST' as const,
    metadata: {
      workspaceId: targetWorkspaceId,
      userId,
      deviceId: 'local-device',
      timestamp: new Date().toISOString()
    },
    payload: {
      prayerRequestId: requestId,
      userId,
      interactionId: uuidv4()
    }
  };

  await PrayerCommandDispatcher.dispatch(command);
  
  // También registrar la oración en la base de datos central
  try {
    const response = await fetch(`/api/prayer-requests/${requestId}/pray`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    
    if (!response.ok) {
      console.error('Error registrando oración en la base de datos central:', await response.text());
    }
  } catch (error) {
    console.error('Error de red registrando oración en la base de datos central:', error);
  }
}

export async function prayAllPendingRequests(userId: string, workspaceId: string | null): Promise<number> {
  if (!userId) {
    throw new Error('Usuario no definido');
  }

  const now = new Date();
  
  // Para peticiones comunitarias, obtener de cualquier workspace (o sin workspace)
  let requests;
  if (workspaceId && workspaceId !== 'COMMUNITY') {
    requests = await db.prayerRequests
      .where('workspaceId')
      .equals(workspaceId)
      .filter((row) => row.userId !== userId && new Date(row.expiresAt) > now)
      .toArray();
  } else {
    // Si no hay workspaceId o es COMMUNITY, obtener peticiones sin workspace (comunitarias)
    requests = await db.prayerRequests
      .filter((row) => 
        row.userId !== userId && 
        (row.workspaceId === null || row.workspaceId === 'COMMUNITY') && 
        new Date(row.expiresAt) > now
      )
      .toArray();
  }

  const interactions = await db.prayerInteractions.where('userId').equals(userId).toArray();
  const prayedSet = new Set(interactions.map((interaction) => interaction.prayerRequestId));

  const pendingRequests = requests.filter((request) => !prayedSet.has(request.id));

  for (const request of pendingRequests) {
    await prayForRequest(request.id, userId, workspaceId);
  }

  return pendingRequests.length;
}

export function useMyPrayerRequests(userId: string | null, workspaceId: string | null) {
  const result = useLiveQuery(async () => {
    if (!userId) {
      return { active: [], archived: [] };
    }

    let rows;
    if (workspaceId && workspaceId !== 'COMMUNITY') {
      rows = await db.prayerRequests
        .where('workspaceId')
        .equals(workspaceId)
        .filter((row) => row.userId === userId)
        .toArray();
    } else {
      // Para peticiones comunitarias, obtener las que no tienen workspace o son COMMUNITY
      rows = await db.prayerRequests
        .filter((row) => row.userId === userId && (row.workspaceId === null || row.workspaceId === 'COMMUNITY'))
        .toArray();
    }

    const active: MyPrayerRequestDTO[] = [];
    const archived: MyPrayerRequestDTO[] = [];
    const now = new Date();

    rows.forEach((row) => {
      const item = formatPrayerRequestRow(row);
      if (new Date(row.expiresAt) > now) {
        active.push(item);
      } else {
        archived.push(item);
      }
    });

    active.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    archived.sort((a, b) => new Date(b.archivedAt || b.expiresAt).getTime() - new Date(a.archivedAt || a.expiresAt).getTime());

    return { active, archived };
  }, [userId, workspaceId]) ?? { active: [], archived: [] };

  return result;
}

export function useCommunityPrayerRequests(userId: string | null, workspaceId: string | null) {
  const result = useLiveQuery(async () => {
    if (!userId) {
      return { pending: [], prayed: [], summary: { activeCount: 0, pendingCount: 0, prayedCount: 0 } };
    }

    const now = new Date();
    
    // Obtener peticiones de oración de la base de datos local (Dexie)
    // Para peticiones comunitarias, obtener las que no tienen workspace o pertenecen al workspace especificado
    let localRequestRows;
    if (workspaceId && workspaceId !== 'COMMUNITY') {
      localRequestRows = await db.prayerRequests
        .where('workspaceId')
        .equals(workspaceId)
        .filter((row) => row.userId !== userId)
        .toArray();
    } else {
      // Obtener peticiones comunitarias (sin workspace o COMMUNITY)
      localRequestRows = await db.prayerRequests
        .filter((row) => 
          row.userId !== userId && 
          (row.workspaceId === null || row.workspaceId === 'COMMUNITY')
        )
        .toArray();
    }

    // Obtener también peticiones de la base de datos central (desde la API)
    let serverRequestRows = [];
    try {
      // Construir URL con parámetros válidos, omitiendo nulos
      const params = new URLSearchParams();
      params.append('scope', 'community');
      params.append('userId', userId);
      
      // Pasar COMMUNITY si no hay workspace específico
      if (!workspaceId) {
        params.append('workspaceId', 'COMMUNITY');
      } else if (workspaceId && workspaceId !== 'null') {
        params.append('workspaceId', workspaceId);
      }
      
      const queryString = params.toString();
      const response = await fetch(`/api/prayer-requests?${queryString}`);
      if (response.ok) {
        const data = await response.json();
        serverRequestRows = data.pending.concat(data.prayed);
      }
    } catch (error) {
      console.error('Error obteniendo peticiones de oración del servidor:', error);
      // Continuar con solo los datos locales si falla la llamada al servidor
    }

    // Combinar datos locales y del servidor, evitando duplicados
    const combinedRequestRows = [...localRequestRows];
    const existingIds = new Set(localRequestRows.map(row => row.id));
    
    for (const serverRow of serverRequestRows) {
      if (!existingIds.has(serverRow.id)) {
        combinedRequestRows.push({
          id: serverRow.id,
          message: serverRow.message,
          status: serverRow.status,
          prayerCount: serverRow.prayerCount,
          createdAt: serverRow.createdAt,
          updatedAt: serverRow.updatedAt || serverRow.createdAt,
          expiresAt: serverRow.expiresAt,
          archivedAt: serverRow.archivedAt,
          userId: serverRow.userId,
          workspaceId: serverRow.workspaceId || null
        });
        existingIds.add(serverRow.id);
      }
    }

    const interactions = await db.prayerInteractions.where('userId').equals(userId).toArray();
    const prayedSet = new Set(interactions.map((interaction) => interaction.prayerRequestId));

    // Obtener autores de las peticiones combinadas
    const authorIds = Array.from(new Set(combinedRequestRows.map((row) => row.userId)));
    const authors = await db.users.where('id').anyOf(authorIds).toArray();
    const authorMap = Object.fromEntries(authors.map((author) => [author.id, author]));

    const pending: PrayerRequestDTO[] = [];
    const prayed: PrayerRequestDTO[] = [];

    combinedRequestRows.forEach((row) => {
      if (new Date(row.expiresAt) <= now) {
        return;
      }
      const author = authorMap[row.userId];
      const displayName = author ? `${(author.name || 'Hermano').split(' ')[0]}${author.lastName ? ` ${author.lastName[0].toUpperCase()}.` : ''}` : 'Hermano';
      const initial = author ? (author.name?.trim()?.[0]?.toUpperCase() ?? 'H') : 'H';
      const item: PrayerRequestDTO = {
        id: row.id,
        message: row.message,
        status: 'ACTIVE',
        prayerCount: row.prayerCount,
        createdAt: row.createdAt,
        expiresAt: row.expiresAt,
        archivedAt: row.archivedAt ?? null,
        daysRemaining: Math.max(0, Math.ceil((new Date(row.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))),
        authorDisplayName: displayName,
        authorInitial: initial,
        hasPrayed: prayedSet.has(row.id)
      };

      if (item.hasPrayed) {
        prayed.push(item);
      } else {
        pending.push(item);
      }
    });

    const activeCount = pending.length + prayed.length;
    const prayedCount = prayed.length;
    const pendingCount = pending.length;

    pending.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    prayed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      pending,
      prayed,
      summary: { activeCount, pendingCount, prayedCount }
    };
  }, [userId, workspaceId]) ?? { pending: [], prayed: [], summary: { activeCount: 0, pendingCount: 0, prayedCount: 0 } };

  return result;
}

export function usePrayerStats(userId: string | null, workspaceId: string | null) {
  const result = useLiveQuery(async () => {
    if (!userId) {
      return 0;
    }

    const now = new Date();
    
    // Obtener conteo de la base de datos local
    let localCount;
    if (workspaceId && workspaceId !== 'COMMUNITY') {
      localCount = await db.prayerRequests
        .where('workspaceId')
        .equals(workspaceId)
        .filter((row) => row.userId !== userId && new Date(row.expiresAt) > now)
        .count();
    } else {
      localCount = await db.prayerRequests
        .filter((row) => 
          row.userId !== userId && 
          (row.workspaceId === null || row.workspaceId === 'COMMUNITY') && 
          new Date(row.expiresAt) > now
        )
        .count();
    }

    // Obtener conteo del servidor también
    let serverCount = 0;
    try {
      // Construir URL con parámetros válidos, omitiendo nulos
      const params = new URLSearchParams();
      params.append('scope', 'stats');
      params.append('excludeUserId', userId);
      
      // Pasar COMMUNITY si no hay workspace específico
      if (!workspaceId) {
        params.append('workspaceId', 'COMMUNITY');
      } else if (workspaceId && workspaceId !== 'null') {
        params.append('workspaceId', workspaceId);
      }
      
      const queryString = params.toString();
      const response = await fetch(`/api/prayer-requests?${queryString}`);
      if (response.ok) {
        const data = await response.json();
        serverCount = data.activeCount || 0;
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas de oración del servidor:', error);
    }

    // Retornar el máximo de ambos conteos para mostrar la cantidad total disponible
    return Math.max(localCount, serverCount);
  }, [userId, workspaceId]) ?? 0;

  return result;
}