import { db } from '@/lib/db';
import type { PrayerRequestDTO } from '../types';

/**
 * Procesa las peticiones de oración entrantes (desde REST o Realtime)
 * y las persiste en Dexie garantizando una única fuente de verdad.
 */
export async function processIncomingPrayerRequests(requests: any[]) {
  if (!requests || requests.length === 0) return;

  await db.transaction('rw', db.prayerRequests, db.users, db.prayerInteractions, async () => {
    const now = new Date().toISOString();
    
    for (const req of requests) {
      // 1. Upsert User stub if not exists locally (so UI can resolve the name)
      if (req.userId && (req.name || req.authorDisplayName)) {
        const existingUser = await db.users.get(req.userId);
        if (!existingUser) {
          await db.users.put({
            id: req.userId,
            email: `guest-${req.userId}@local.kadosh`,
            name: req.name || req.authorDisplayName || 'Usuario',
            lastName: req.lastName || null,
            avatarUrl: null,
            isCloudLinked: false,
            createdAt: now,
            updatedAt: now,
            deletedAt: null
          });
        } else if ((req.name && req.name !== existingUser.name) || (req.lastName && req.lastName !== existingUser.lastName)) {
           // Actualizar info del usuario si cambió y tenemos el dato
           await db.users.update(req.userId, {
              name: req.name || existingUser.name,
              lastName: req.lastName || existingUser.lastName,
              updatedAt: now
           });
        }
      }

      // 2. Upsert Prayer Request
      const existingReq = await db.prayerRequests.get(req.id);
      if (!existingReq) {
        await db.prayerRequests.put({
          id: req.id,
          workspaceId: null, // Community
          userId: req.userId || 'unknown',
          message: req.message,
          status: req.status || 'ACTIVE',
          prayerCount: req.prayerCount || 0,
          joinedCount: req.joinedCount || 0,
          createdAt: req.createdAt,
          expiresAt: req.expiresAt,
          archivedAt: req.archivedAt || null,
          updatedAt: now,
        });
      } else {
        // Solo actualizamos si el contador o estado cambió, para no sobrescribir sin necesidad
        const needsUpdate = 
          existingReq.status !== req.status ||
          existingReq.prayerCount !== req.prayerCount ||
          existingReq.joinedCount !== req.joinedCount ||
          existingReq.archivedAt !== req.archivedAt;

        if (needsUpdate) {
          await db.prayerRequests.update(req.id, {
            status: req.status,
            prayerCount: req.prayerCount,
            joinedCount: req.joinedCount,
            archivedAt: req.archivedAt,
            updatedAt: now,
          });
        }
      }

      // 3. Sync interactions if provided by REST (hasPrayed, hasJoined for the current user)
      if (req.hasOwnProperty('hasPrayed') && req.currentUserId) {
         if (req.hasPrayed) {
             const existingPrayed = await db.prayerInteractions.get({ prayerRequestId: req.id, userId: req.currentUserId, type: 'PRAYED' });
             if (!existingPrayed) {
                 await db.prayerInteractions.put({
                     id: `${req.id}-PRAYED`,
                     prayerRequestId: req.id,
                     userId: req.currentUserId,
                     type: 'PRAYED',
                     createdAt: now
                 });
             }
         }
      }
      
      if (req.hasOwnProperty('hasJoined') && req.currentUserId) {
         if (req.hasJoined) {
             const existingJoined = await db.prayerInteractions.get({ prayerRequestId: req.id, userId: req.currentUserId, type: 'JOINED' });
             if (!existingJoined) {
                 await db.prayerInteractions.put({
                     id: `${req.id}-JOINED`,
                     prayerRequestId: req.id,
                     userId: req.currentUserId,
                     type: 'JOINED',
                     createdAt: now
                 });
             }
         }
      }
    }
  });
}

/**
 * Procesa interacciones entrantes vía Realtime y actualiza los contadores en Dexie.
 * Utiliza db.prayerInteractions como barrera idempotente.
 */
export async function processIncomingPrayerInteraction(interaction: any) {
    if (!interaction || !interaction.prayer_request_id || !interaction.type || !interaction.id) return;

    await db.transaction('rw', db.prayerRequests, db.prayerInteractions, async () => {
        // Barrera de idempotencia
        const existingInteraction = await db.prayerInteractions.get(interaction.id);
        if (existingInteraction) return; // Ya fue procesada (ej. duplicado Realtime)

        // Guardamos la interacción parcial de la comunidad para asegurar idempotencia futura
        await db.prayerInteractions.put({
            id: interaction.id,
            prayerRequestId: interaction.prayer_request_id,
            userId: interaction.userId,
            type: interaction.type,
            createdAt: interaction.createdAt || new Date().toISOString()
        });

        const req = await db.prayerRequests.get(interaction.prayer_request_id);
        if (req) {
            if (interaction.type === 'PRAYED') {
                await db.prayerRequests.update(req.id, {
                    prayerCount: (req.prayerCount || 0) + 1
                });
            } else if (interaction.type === 'JOINED') {
                await db.prayerRequests.update(req.id, {
                    joinedCount: (req.joinedCount || 0) + 1
                });
            }
        }
    });
}
