'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Share2, Droplet } from 'lucide-react';
import { DailyVerseService } from '../service';
import { DailyVerse, db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { ShareVerseModal } from './ShareVerseModal';

const LeafIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22c0-8 6-12 10-12-1 9-6 12-10 12z" />
    <path d="M12 22c0-6-4-10-10-10 1 8 6 10 10 10z" />
    <path d="M12 22V12" />
  </svg>
);

export function DailyVerseCard() {
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const iconRef = useRef<HTMLButtonElement>(null);

  // Solo mostrar si la configuración lo permite
  const settings = useLiveQuery(() => db.settings.orderBy('id').first());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsPulsing(true);
          setTimeout(() => setIsPulsing(false), 3000); // 3 seconds of pulsing
          observer.disconnect();
        }
      },
      { 
        threshold: 0,
        rootMargin: '0px 0px -50% 0px'
      }
    );

    if (iconRef.current) {
      observer.observe(iconRef.current);
    }

    return () => observer.disconnect();
  }, [verse]);

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
      <Card className="bg-primary/5 border-none shadow-none rounded-3xl relative overflow-hidden mt-2">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none z-0">
          <Droplet className="w-24 h-24" />
        </div>
        
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <LeafIcon className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary/80">
                Versículo de hoy
              </span>
            </div>
          </div>

          {/* Botón Compartir en la esquina */}
          <button 
            ref={iconRef}
            onClick={() => setIsShareModalOpen(true)}
            className={`absolute top-2 right-4 flex items-center justify-center w-10 h-10 rounded-full text-primary/60 hover:text-primary hover:bg-primary/10 transition-all duration-500 z-20 ${isPulsing ? 'animate-pulse scale-125 bg-primary/10 text-primary shadow-sm drop-shadow-md' : 'scale-100'}`}
            style={isPulsing ? { animationDuration: '3s' } : undefined}
            title="Compartir"
          >
            <Share2 className="w-5 h-5" />
          </button>

          <div className="flex flex-col gap-4">
            <blockquote className="text-sm font-medium italic text-foreground/90 leading-relaxed text-center px-2">
              &quot;{verse.text}&quot;
            </blockquote>
            
            <div className="text-center">
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
