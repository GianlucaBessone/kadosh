'use client';

import { Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MotivationalVerseService } from '@/services/motivationalVerseService';

interface MotivationalModalProps {
  onClose: () => void;
}

export function MotivationalModal({ onClose }: MotivationalModalProps) {
  const router = useRouter();
  const [verse, setVerse] = useState<{ text: string, reference: string } | null>(null);

  useEffect(() => {
    MotivationalVerseService.seedDefaultVerses().then(() => {
      MotivationalVerseService.getRandomVerse('DIEZMO').then(setVerse);
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border shadow-lg rounded-3xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-gold/10 text-gold rounded-full flex items-center justify-center mb-4">
            <Sprout className="w-8 h-8" />
          </div>
          
          <h3 className="text-xl font-semibold mb-2">¡Nuevo ingreso registrado!</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Es un excelente momento para separar tu semilla o diezmo. Recuerda:
          </p>
          
          <div className="bg-muted/50 p-4 rounded-2xl mb-6 relative">
            <p className="text-[13px] italic text-foreground/90 font-medium mb-2">
              "{verse?.text || 'Honra al Señor con tus riquezas y con los primeros frutos de tus cosechas.'}"
            </p>
            <p className="text-[10px] font-bold text-gold tracking-widest uppercase">
              {verse?.reference || 'Proverbios 3:9'}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => {
                onClose();
                router.push('/tithe');
              }}
              className="w-full h-12 rounded-full font-medium bg-gold hover:bg-gold/90 text-gold-foreground"
            >
              Ir a Diezmos
            </Button>
            
            <Button
              onClick={() => {
                onClose();
                router.push('/seeds/new');
              }}
              variant="outline"
              className="w-full h-12 rounded-full font-medium border-primary/20 text-primary hover:bg-primary/5"
            >
              Plantar una Semilla
            </Button>
            
            <button
              onClick={onClose}
              className="w-full h-12 rounded-full text-muted-foreground font-medium text-sm hover:bg-muted transition-colors mt-1"
            >
              En otro momento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
