import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { processIncomingPrayerInteraction } from './prayerSyncPipeline';
import { db } from '@/lib/db';

export function usePrayerRealtime(userId: string | null) {
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    
    // Escuchar nuevas interacciones (Oraciones o Uniones)
    const interactionChannel = supabase.channel('public:PrayerInteraction')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'PrayerInteraction' },
        (payload) => {
          const newInteraction = payload.new;
          // Ignorar eventos creados por mí (ya están en Optimistic UI)
          if (newInteraction.userId !== userId) {
             processIncomingPrayerInteraction(newInteraction).catch(err => 
               console.error('Error procesando interaccion realtime:', err)
             );
          }
        }
      )
      .subscribe();

    // Escuchar nuevas peticiones de oración de la comunidad
    const requestChannel = supabase.channel('public:PrayerRequest')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'PrayerRequest' },
        (payload) => {
          const newReq = payload.new;
          // Solo procesar si es de otro usuario y es comunitaria
          if (newReq.userId !== userId && !newReq.workspaceId) {
             // Formatearlo para que el pipeline lo entienda como un request DTO
             // Para un INSERT remoto, puede que no tengamos el nombre del usuario. 
             // Se registrará como 'Usuario' temporalmente hasta que se haga un Pull completo de usuarios, 
             // lo cual mantiene la consistencia.
             const dto = {
                 id: newReq.id,
                 userId: newReq.userId,
                 message: newReq.message,
                 status: newReq.status,
                 prayerCount: newReq.prayerCount,
                 joinedCount: newReq.joinedCount,
                 createdAt: newReq.createdAt,
                 expiresAt: newReq.expiresAt,
                 archivedAt: newReq.archivedAt
             };
             import('./prayerSyncPipeline').then(({ processIncomingPrayerRequests }) => {
                 processIncomingPrayerRequests([dto]).catch(err => 
                   console.error('Error procesando peticion realtime:', err)
                 );
             });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(interactionChannel);
      supabase.removeChannel(requestChannel);
    };
  }, [userId]);
}
