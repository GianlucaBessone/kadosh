'use client';

import { useEffect, useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { useRouter, usePathname } from 'next/navigation';

export function GlobalDevInfoWatcher() {
  const user = useLiveQuery(() => db.users.orderBy('id').first());
  const router = useRouter();
  const pathname = usePathname();
  const [shouldPoll, setShouldPoll] = useState(true); // check on mount initially
  const [hasNotified, setHasNotified] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const onRequested = () => {
      setHasNotified(false);
      setShouldPoll(true);
    };
    window.addEventListener('dev-info-requested', onRequested);
    return () => window.removeEventListener('dev-info-requested', onRequested);
  }, []);

  useEffect(() => {
    if (!user || !shouldPoll || hasNotified) return;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/developer-info?userId=${user.isCloudLinked ? user.id : ''}&guestId=${!user.isCloudLinked ? user.id : ''}`);
        if (response.ok) {
          const data = await response.json();
          
          if (data.status === 'NOTIFIED') {
            setHasNotified(true);
            setShouldPoll(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            
            // Mostramos el toast siempre, tal como solicitaste
            toast.success('¡Información liberada!', {
              description: 'Ya puedes conocer al desarrollador de KADOSH.',
              duration: 10000,
              action: {
                label: 'Ver información',
                onClick: async () => {
                  try {
                    await fetch('/api/developer-info', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId: user.isCloudLinked ? user.id : null,
                        guestId: !user.isCloudLinked ? user.id : null,
                        action: 'MARK_SEEN',
                      }),
                    });
                  } catch (e) {}
                  window.dispatchEvent(new Event('dev-info-seen'));
                  router.push('/asistencia#developer-card');
                },
              },
            });
          } else if (data.status === 'IDLE' || data.status === 'SEEN') {
            // Ya no hace falta polling porque nunca lo pidieron o ya lo vieron
            setShouldPoll(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
        }
      } catch (e) {
        // Ignorar errores transitorios
      }
    };

    // Hacer el primer chequeo
    checkStatus();

    intervalRef.current = setInterval(checkStatus, 15000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, shouldPoll, hasNotified, router, pathname]);

  return null;
}
