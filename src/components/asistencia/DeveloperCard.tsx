import { useState, useEffect } from 'react';
import { Mail, MessageCircle, Phone, Loader2, Info, Handshake } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { toast } from 'sonner';

export function DeveloperCard() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'NOTIFIED' | 'SEEN' | 'LOADING'>('LOADING');
  const user = useLiveQuery(() => db.users.orderBy('id').first());

  useEffect(() => {
    const onSeen = () => setStatus('SEEN');
    window.addEventListener('dev-info-seen', onSeen);
    return () => window.removeEventListener('dev-info-seen', onSeen);
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Check initial status
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/developer-info?userId=${user.isCloudLinked ? user.id : ''}&guestId=${!user.isCloudLinked ? user.id : ''}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status) {
            setStatus(data.status);
            return;
          }
        }
        setStatus('IDLE');
      } catch (error) {
        setStatus('IDLE');
        console.error('Error checking developer info status', error);
      }
    };
    checkStatus();
  }, [user]);

  // Poll for status updates if PENDING
  useEffect(() => {
    if (status !== 'PENDING' || !user) return;
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/developer-info?userId=${user.isCloudLinked ? user.id : ''}&guestId=${!user.isCloudLinked ? user.id : ''}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status && data.status !== 'PENDING') {
            setStatus(data.status);
          }
        }
      } catch (error) {
        console.error('Error polling developer info status', error);
      }
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(interval);
  }, [status, user]);

  const handleRequest = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch('/api/developer-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.isCloudLinked ? user.id : null,
          guestId: !user.isCloudLinked ? user.id : null,
        }),
      });

      if (!response.ok) throw new Error('Error al solicitar información');

      setStatus('PENDING');
      window.dispatchEvent(new Event('dev-info-requested'));
      toast.success('Solicitud enviada. Te notificaremos cuando la información esté disponible.', { duration: 2500 });
    } catch {
      toast.error('Ocurrió un error. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = async () => {
    if (!user) return;
    
    // Mark as SEEN
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
      setStatus('SEEN');
    } catch {
      console.error('Error marking as seen');
      // Still show the card locally even if it fails to sync
      setStatus('SEEN');
    }
  };

  if (status === 'LOADING') {
    return <div className="mt-4 h-[140px] bg-muted/30 rounded-2xl animate-pulse flex items-center justify-center"></div>;
  }

  if (status === 'IDLE') {
    return (
      <div className="mt-4 p-4 bg-muted/40 rounded-2xl flex flex-col gap-3 text-center">
        <p className="text-sm text-foreground font-medium">
          Aunque no buscamos reconocimiento personal, entendemos que algunas personas desean conocer quién desarrolla esta aplicación.
        </p>
        <p className="text-xs text-muted-foreground">
          Si deseas comunicarte directamente conmigo, puedes solicitar mi información de contacto.
        </p>
        <Button onClick={handleRequest} disabled={loading} className="w-full mt-1 rounded-xl">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Info className="w-4 h-4 mr-2" />}
          Solicitar información
        </Button>
      </div>
    );
  }

  if (status === 'PENDING') {
    return (
      <div className="mt-4 p-4 bg-muted/40 rounded-2xl flex flex-col gap-2 items-center text-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <p className="text-sm font-medium text-foreground mt-2">Solicitud en proceso</p>
        <p className="text-xs text-muted-foreground">
          Recibirás una notificación en unos minutos cuando la información esté lista para visualizarse.
        </p>
      </div>
    );
  }

  if (status === 'NOTIFIED') {
    return (
      <div className="mt-4 p-4 bg-primary/10 rounded-2xl flex flex-col gap-3 items-center text-center border border-primary/20">
        <p className="text-sm font-semibold text-foreground">¡Ya puedes conocer al desarrollador!</p>
        <Button onClick={handleReveal} className="w-full rounded-xl mt-1">
          Ver información
        </Button>
      </div>
    );
  }

  if (status === 'SEEN') {
    const userName = user?.name || 'amigo';
    return (
      <Card id="developer-card" className="mt-4 bg-card border-primary/30 shadow-md animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-primary/5 p-5 flex flex-col gap-4 text-center">
            <h3 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
              Mucho gusto <Handshake className="w-5 h-5 text-primary" />
            </h3>
            <div className="space-y-3 text-sm text-foreground">
              <p>Hola {userName}.</p>
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
    );
  }

  return null;
}
