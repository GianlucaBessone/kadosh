'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Share2, Droplet } from 'lucide-react';
import { DailyVerseService } from '../service';
import { DailyVerse, db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { ShareVerseModal } from './ShareVerseModal';

export function DailyVerseCard() {
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Solo mostrar si la configuración lo permite
  const settings = useLiveQuery(() => db.settings.orderBy('id').first());

  useEffect(() => {
    async function loadVerse() {
      // Asegurar que la BD esté inicializada
      await DailyVerseService.initializeDatabase();
      const v = await DailyVerseService.getVerseOfTheDay();
      setVerse(v);
    }
    loadVerse();
  }, []);

  if (settings && settings.dailyVerse === false) {
    return null;
  }
  
  if (!verse) {
    return null;
  }

  return (
    <>
      <Card className="bg-primary/5 border-none shadow-none rounded-3xl relative overflow-hidden mt-6">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Droplet className="w-24 h-24" />
        </div>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌿</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Versículo de hoy
              </span>
            </div>
            <button 
              onClick={() => setIsShareModalOpen(true)}
              className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors bg-background/50 backdrop-blur-sm"
              title="Compartir"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-3 relative z-10">
            <blockquote className="text-sm font-medium italic text-primary/90 leading-relaxed">
              "{verse.text}"
            </blockquote>
            
            <div className="text-left">
              <span className="text-xs text-primary/70 font-semibold uppercase">
                {verse.reference}
              </span>
            </div>

            {(settings?.showReflection ?? true) && verse.reflection && (
              <div className="mt-2 pt-3 border-t border-primary/10">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {verse.reflection}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ShareVerseModal 
        verse={verse} 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
      />
    </>
  );
}
