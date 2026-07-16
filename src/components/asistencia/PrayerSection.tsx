import { useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, HandHeart } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { toast } from 'sonner';

export function PrayerSection() {
  const [loading, setLoading] = useState(false);
  const user = useLiveQuery(() => db.users.orderBy('id').first());

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
        const data = await response.json();
        if (response.status === 429) {
          toast.info(data.message || 'Ya registramos tu oración recientemente. ¡Muchas gracias!');
          return;
        }
        throw new Error('Error al registrar oración');
      }

      toast.success('Gracias. Tu oración significa mucho para nosotros.');
    } catch {
      toast.error('Ocurrió un error. Intenta nuevamente más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
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
  );
}
