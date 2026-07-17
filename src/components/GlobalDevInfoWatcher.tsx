'use client';

import { useEffect, useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Handshake, Mail, MessageCircle, Phone, Info } from 'lucide-react';

export function GlobalDevInfoWatcher() {
  const user = useLiveQuery(() => db.users.orderBy('id').first());
  const router = useRouter();
  const pathname = usePathname();
  const [shouldPoll, setShouldPoll] = useState(true); // check on mount initially
  const [hasNotified, setHasNotified] = useState(false);
  const [modalState, setModalState] = useState<'CLOSED' | 'NOTIFIED' | 'REVEALED'>('CLOSED');
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
            
            // Show the modal instead of a toast
            setModalState('NOTIFIED');
          } else if (data.status === 'IDLE' || data.status === 'SEEN') {
            // No need to poll anymore
            setShouldPoll(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
        }
      } catch (e) {
        // Ignore transient errors
      }
    };

    checkStatus();
    intervalRef.current = setInterval(checkStatus, 15000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, shouldPoll, hasNotified]);

  const handleReveal = async () => {
    if (!user) return;
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
    setModalState('REVEALED');
  };

  if (modalState === 'CLOSED') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-500 p-4">
      {modalState === 'NOTIFIED' && (
        <div className="bg-card p-8 rounded-3xl max-w-sm w-full shadow-2xl border border-primary/20 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Info className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Información Recibida</h2>
          <p className="text-muted-foreground mb-8">
            Ya puedes conocer al desarrollador de KADOSH.
          </p>
          <Button onClick={handleReveal} className="w-full rounded-xl h-12 text-md mb-3">
            Ver información
          </Button>
          <Button variant="ghost" onClick={() => setModalState('CLOSED')} className="w-full rounded-xl">
            Cerrar
          </Button>
        </div>
      )}

      {modalState === 'REVEALED' && (
        <div className="w-full max-w-md animate-in zoom-in-95 duration-500 relative">
          <Button 
            variant="outline" 
            size="sm" 
            className="absolute -top-12 right-0 rounded-full bg-background"
            onClick={() => setModalState('CLOSED')}
          >
            Cerrar
          </Button>
          <Card className="bg-card border-primary/30 shadow-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-primary/5 p-5 flex flex-col gap-4 text-center">
                <h3 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
                  Mucho gusto <Handshake className="w-5 h-5 text-primary" />
                </h3>
                <div className="space-y-3 text-sm text-foreground">
                  <p>Hola {user?.name || 'amigo'}.</p>
                  <p>Mi nombre es <strong>Gianluca Bessone</strong>.</p>
                  <p>Soy el creador, desarrollador y distribuidor de KADOSH.</p>
                  <p>Desarrollé esta aplicación con el deseo de ayudar a las personas a administrar sabiamente los recursos que Dios pone en nuestras manos.</p>
                  <p>Será un gusto conocerte y escuchar tus sugerencias.</p>
                </div>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-card border-t border-border/40">
                <a href="mailto:bessone.gianluca@gmail.com" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <Mail className="w-5 h-5 text-primary" />
                  <span className="text-[10px] font-semibold">Correo</span>
                </a>
                <a href="https://wa.me/5493576512035" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <Phone className="w-5 h-5 text-primary" />
                  <span className="text-[10px] font-semibold">WhatsApp</span>
                </a>
                <a href="https://t.me/gbessone" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <span className="text-[10px] font-semibold">Telegram</span>
                </a>
                <a href="https://linkedin.com/in/gianluca-bessone-2021" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                  <span className="text-[10px] font-semibold">LinkedIn</span>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
