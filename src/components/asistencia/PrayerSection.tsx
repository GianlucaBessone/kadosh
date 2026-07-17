import { useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, HandHeart } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { toast } from 'sonner';

export function PrayerSection() {
  const [loading, setLoading] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const user = useLiveQuery(() => db.users.orderBy('id').first());

  const [backgroundAudio, setBackgroundAudio] = useState<{stop: () => void} | null>(null);

  const playPeacefulChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const frequencies = [349.23, 440.00, 523.25, 698.46]; // F, A, C, F (Soft F major chord)
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        const startTime = ctx.currentTime + i * 0.15;
        osc.start(startTime);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.08, startTime + 0.5);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 4);
        osc.stop(startTime + 4);
      });
    } catch (e) {
      console.error("Audio API no soportada", e);
    }
  };

  const startBackgroundPad = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 174.61; // Low F
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 3); // Slow fade in
      
      return {
        stop: () => {
          // Anchor the current value and fade out over ~2.5 seconds
          gainNode.gain.cancelScheduledValues(ctx.currentTime);
          gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5);
          
          setTimeout(() => {
            try {
              osc.stop();
              ctx.close();
            } catch (e) {}
          }, 2600);
        }
      };
    } catch (e) {
      console.error("Audio API no soportada", e);
      return { stop: () => {} };
    }
  };

  const handlePray = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch('/api/prayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.isCloudLinked ? user.id : null,
          guestId: !user.isCloudLinked ? user.id : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al registrar oración');
      }

      playPeacefulChime();
      setBackgroundAudio(startBackgroundPad());
      setShowThankYou(true);
    } catch {
      toast.error('Ocurrió un error. Intenta nuevamente más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowThankYou(false);
    if (backgroundAudio) {
      backgroundAudio.stop();
      setBackgroundAudio(null);
    }
  };

  return (
    <>
      <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-center gap-3 text-center">
            <div className="bg-primary/10 p-2 rounded-full text-primary">
              <HandHeart className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Orar por este proyecto</h2>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground text-center">
            <p>
              Si KADOSH ha sido de bendición para tu vida, tu oración vale mucho más que cualquier aporte económico.
            </p>
            <p>
              Puedes orar para que Dios continúe dando sabiduría, fuerzas y los recursos necesarios para seguir desarrollando este proyecto.
            </p>
          </div>
          
          <div className="mt-2">
            <Button 
              className="w-full rounded-xl" 
              variant="outline"
              onClick={handlePray}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <HandHeart className="w-4 h-4 mr-2" />} 
              He orado por KADOSH
            </Button>
          </div>
        </CardContent>
      </Card>

      {showThankYou && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="bg-card p-8 rounded-3xl max-w-sm w-full mx-4 shadow-2xl border border-primary/20 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <HandHeart className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">¡Muchas gracias!</h2>
            <p className="text-muted-foreground mb-6">
              Tu oración significa muchísimo para nosotros. Que Dios te bendiga grandemente por tomarte el tiempo de orar por este proyecto.
            </p>
            <div className="flex flex-col items-center gap-2 mb-8">
              <p className="text-sm italic text-foreground/80 text-center">
                "mientras ustedes nos ayudan orando. Así, muchos darán gracias a Dios por nosotros a causa de la gracia que se nos ha concedido en respuesta a tantas oraciones."
              </p>
              <span className="text-xs font-semibold text-primary">
                2 Corintios 1:11
              </span>
            </div>
            <Button onClick={handleClose} className="w-full rounded-xl h-12 text-md">
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
