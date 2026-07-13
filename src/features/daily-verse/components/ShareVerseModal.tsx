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

export function ShareVerseModal({ verse, isOpen, onClose }: ShareVerseModalProps) {
  const [design, setDesign] = useState(DESIGNS[0].id);
  const [isDark, setIsDark] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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

  if (!isOpen) return null;

  const getDesignClasses = () => {
    const base = 'p-10 flex flex-col justify-center items-center text-center relative overflow-hidden w-full aspect-square transition-all duration-300 ';
    const theme = isDark ? 'bg-zinc-950 text-zinc-50' : 'bg-white text-zinc-900';
    
    switch (design) {
      case 'elegant':
        return base + (isDark ? 'bg-gradient-to-br from-zinc-900 to-zinc-950 text-zinc-100 border border-zinc-800/50' : 'bg-gradient-to-br from-stone-50 to-stone-100 text-stone-900 border border-stone-200/50');
      case 'modern':
        return base + (isDark ? 'bg-gradient-to-tr from-emerald-950 via-zinc-950 to-zinc-900 text-emerald-50' : 'bg-gradient-to-tr from-emerald-50 via-white to-zinc-50 text-emerald-950');
      case 'classic':
        return base + (isDark ? 'bg-zinc-900 text-amber-50' : 'bg-amber-50 text-amber-950');
      case 'bold':
        return base + (isDark ? 'bg-primary text-primary-foreground' : 'bg-primary text-primary-foreground');
      case 'minimal':
      default:
        return base + theme;
    }
  };

  const generateImage = async () => {
    if (!cardRef.current) return null;
    try {
      setIsGenerating(true);
      // Ensure fonts are loaded before generating
      await document.fonts.ready;
      
      const dataUrl = await toJpeg(cardRef.current, { 
        quality: 1, 
        pixelRatio: 3, // High resolution
        style: {
          transform: 'scale(1)', // Fix any scaling issues
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
      // Fallback to download if share is not supported
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md p-4 rounded-3xl bg-card border border-border/50 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold tracking-tight">Compartir Versículo</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controles */}
        <div className="flex flex-col gap-4">
          
          {/* Vista Previa */}
          <div className="rounded-2xl overflow-hidden shadow-lg border border-border/30 bg-muted/20">
            {/* Elemento a renderizar (fijo en aspect-square para formato post/instagram) */}
            <div 
              ref={cardRef} 
              className={getDesignClasses()}
              style={{ width: '1000px', height: '1000px', transform: 'scale(0.35)', transformOrigin: 'top left', marginBottom: '-650px' }}
            >
              
              {/* Decoración según diseño */}
              {design === 'elegant' && (
                <div className="absolute inset-0 border-[16px] border-current opacity-10 m-12 rounded-xl" />
              )}
              {design === 'classic' && (
                <>
                  <div className="absolute top-12 left-12 w-16 h-16 border-t-4 border-l-4 border-current opacity-20" />
                  <div className="absolute bottom-12 right-12 w-16 h-16 border-b-4 border-r-4 border-current opacity-20" />
                </>
              )}
              
              <div className="flex flex-col items-center justify-center flex-1 w-full max-w-3xl z-10 gap-12">
                <span className="text-5xl opacity-40">🌿</span>
                <blockquote className={`text-5xl leading-relaxed text-center ${design === 'classic' ? 'font-serif' : 'font-medium'} ${design === 'bold' ? 'font-bold' : ''}`}>
                  "{verse.text}"
                </blockquote>
                <p className="text-3xl font-semibold opacity-80 uppercase tracking-widest mt-4">
                  {verse.reference}
                </p>
              </div>

              {/* Watermark KADOSH */}
              <div className="absolute bottom-12 flex items-center gap-4 opacity-50 z-10">
                <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center font-bold text-xl">
                  K
                </div>
                <span className="text-2xl font-semibold tracking-widest uppercase">Kadosh</span>
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

          <div className="grid grid-cols-2 gap-3 mt-2">
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
              className="rounded-xl h-12 bg-primary text-primary-foreground" 
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
