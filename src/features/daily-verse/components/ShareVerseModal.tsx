'use client';

import { useState, useRef, useEffect } from 'react';
import { DailyVerse } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Download, Share2, Moon, Sun, X } from 'lucide-react';
import { toJpeg } from 'html-to-image';

interface ShareVerseModalProps {
  verse: DailyVerse;
  isOpen: boolean;
  onClose: () => void;
}

const DESIGNS = [
  { id: 'minimal', name: 'Minimalista' },
  { id: 'elegant', name: 'Elegante' },
  { id: 'modern', name: 'Moderno' },
  { id: 'classic', name: 'Clásico' },
  { id: 'bold', name: 'Impactante' },
];

const LeafIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22c0-8 6-12 10-12-1 9-6 12-10 12z" />
    <path d="M12 22c0-6-4-10-10-10 1 8 6 10 10 10z" />
    <path d="M12 22V12" />
  </svg>
);

export function ShareVerseModal({ verse, isOpen, onClose }: ShareVerseModalProps) {
  const [design, setDesign] = useState(DESIGNS[0].id);
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [scale, setScale] = useState(0.25);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Bloquear el scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Calcular el escalado exacto para que el cuadro de 1080x1920 encaje perfecto
  useEffect(() => {
    if (!containerRef.current || !isOpen) return;
    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setScale(width / 1080);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isOpen]);

  if (!isOpen) return null;

  const getDesignClasses = () => {
    const base = 'p-12 flex flex-col justify-between items-center text-center relative overflow-hidden w-[1080px] h-[1920px] transition-all duration-300 ';
    
    switch (design) {
      case 'elegant':
        return base + (isDark 
          ? 'bg-[#0f1115] text-[#eaeaea] border border-[#2a2d35]' 
          : 'bg-gradient-to-br from-stone-50 to-stone-100 text-stone-900 border border-stone-200/50');
      case 'modern':
        return base + (isDark 
          ? 'bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#0f172a] text-[#ecfdf5]' 
          : 'bg-gradient-to-tr from-emerald-50 via-white to-zinc-50 text-emerald-950');
      case 'classic':
        return base + (isDark 
          ? 'bg-[#1c1917] text-[#fde68a]' 
          : 'bg-amber-50 text-amber-950');
      case 'bold':
        return base + (isDark 
          ? 'bg-[#064e3b] text-emerald-50' 
          : 'bg-primary text-primary-foreground');
      case 'minimal':
      default:
        return base + (isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-zinc-900');
    }
  };

  const generateImage = async () => {
    if (!cardRef.current) return null;
    try {
      setIsGenerating(true);
      await document.fonts.ready;
      
      const dataUrl = await toJpeg(cardRef.current, { 
        quality: 1, 
        pixelRatio: 2, 
        canvasWidth: 1080,
        canvasHeight: 1920,
        style: {
          transform: 'none',
          transformOrigin: 'unset',
          margin: '0'
        }
      });
      return dataUrl;
    } catch (error) {
      console.error('Error generating image', error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    const dataUrl = await generateImage();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `kadosh-versiculo-${verse.reference.replace(/\s/g, '-')}.jpg`;
      link.href = dataUrl;
      link.click();
    }
  };

  const handleShare = async () => {
    const dataUrl = await generateImage();
    if (dataUrl && navigator.share) {
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'versiculo.jpg', { type: 'image/jpeg' });
        await navigator.share({
          title: 'Versículo del Día - KADOSH',
          text: 'Inspiración diaria de KADOSH',
          files: [file]
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-md p-4 rounded-3xl bg-card border border-border/50 shadow-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-lg font-semibold tracking-tight">Compartir Versículo</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto overflow-x-hidden scrollbar-hide">
          
          {/* Vista Previa Container */}
          <div 
            ref={containerRef}
            className="rounded-2xl overflow-hidden shadow-lg border border-border/30 bg-muted/20 relative w-full max-w-[280px] mx-auto aspect-[9/16] min-h-[350px] shrink-0"
          >
            
            <div 
              className="absolute transform origin-top-left"
              style={{ transform: `scale(${scale || 0.25})` }}
            >
              
              {/* Element captured. 1080x1920 */}
              <div ref={cardRef} className={getDesignClasses()}>
                
                {design === 'elegant' && (
                  <div className="absolute inset-8 border-[4px] border-current opacity-15 rounded-2xl pointer-events-none" />
                )}
                {design === 'classic' && (
                  <>
                    <div className="absolute top-16 left-16 w-32 h-32 border-t-[8px] border-l-[8px] border-current opacity-20 pointer-events-none" />
                    <div className="absolute bottom-16 right-16 w-32 h-32 border-b-[8px] border-r-[8px] border-current opacity-20 pointer-events-none" />
                  </>
                )}
                
                {/* TOP AREA: Leaf Icon */}
                <div className="w-full flex justify-center pt-32">
                  <LeafIcon className="w-40 h-40 opacity-40" />
                </div>

                {/* CENTER AREA: Text */}
                <div className="flex flex-col items-center justify-center flex-1 w-full max-w-4xl z-10 gap-24 px-8">
                  <blockquote className={`text-[3.8rem] leading-snug text-center ${design === 'classic' ? 'font-serif' : 'font-medium'} ${design === 'bold' ? 'font-bold' : ''}`}>
                    &quot;{verse.text}&quot;
                  </blockquote>
                  <p className="text-[2.2rem] font-semibold opacity-80 uppercase tracking-[0.2em]">
                    {verse.reference}
                  </p>
                </div>

                {/* BOTTOM AREA: Minimal Footer */}
                <div className="flex flex-col items-center justify-center gap-6 opacity-60 z-10 w-full pb-24">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full border-[6px] border-current flex items-center justify-center font-bold text-5xl">
                      K
                    </div>
                    <span className="text-5xl font-bold tracking-[0.25em] uppercase">Kadosh</span>
                  </div>
                  <span className="text-3xl font-medium italic opacity-80">finanzas con propósito</span>
                </div>

              </div>
            </div>
            
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
              {DESIGNS.map(d => (
                <button
                  key={d.id}
                  onClick={() => setDesign(d.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors snap-center ${
                    design === d.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2 ml-2 rounded-full bg-muted text-muted-foreground shrink-0"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-1">
            <Button 
              variant="outline" 
              className="rounded-xl h-12" 
              onClick={handleDownload}
              disabled={isGenerating}
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </Button>
            <Button 
              className="rounded-xl h-12 bg-primary text-primary-foreground hover:bg-primary/90" 
              onClick={handleShare}
              disabled={isGenerating}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
