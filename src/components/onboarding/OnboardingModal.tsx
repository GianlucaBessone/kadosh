'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf,
  BookOpen,
  Wallet,
  Sprout,
  HandCoins,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Sparkles,
  ArrowRight,
  CalendarDays,
  Smartphone,
  Share,
  PlusSquare,
  ShieldCheck,
  CloudOff,
  Heart,
} from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface OnboardingSlide {
  id: string;
  icon: React.ReactNode;
  badge?: string;
  title: string;
  subtitle: string;
  body: string;
  verse?: string;
  verseRef?: string;
  gradient: string;
  accentColor: string;
  isLast?: boolean;
}

// ─────────────────────────────────────────────
// Audio constants
// ─────────────────────────────────────────────
const AUDIO_FADE_DURATION = 4000;
const AUDIO_VOLUME = 0.3;
const AUDIO_PATH = '/sounds/stars.mp3';

// ─────────────────────────────────────────────
// Slides definition
// ─────────────────────────────────────────────
const SLIDES: OnboardingSlide[] = [ /* ... mismo array de slides (sin cambios) ... */ 
  {
    id: 'welcome',
    icon: <Leaf className="h-10 w-10" />,
    badge: 'Bienvenido',
    title: '¿Qué significa KADOSH?',
    subtitle: '"Santo" · Separado · Apartado para un propósito',
    body: 'En hebreo, קָדוֹשׁ (Kadosh) significa santo: algo completamente apartado y dedicado a un propósito superior.\n\nEsta app nació con esa misión: ayudarte a administrar tus finanzas con sabiduría bíblica, separando cada peso para honrar a Dios y bendecir tu familia.\n\nNo es solo un registro de gastos. Es una herramienta de mayordomía.',
    gradient: 'from-[#7FA58A]/20 to-[#7FA58A]/5',
    accentColor: 'text-[#7FA58A]',
  },
  {
    id: 'daily-verse',
    icon: <BookOpen className="h-10 w-10" />,
    badge: 'Devocional',
    title: 'Versículo del día',
    subtitle: 'La Palabra que guía tus decisiones',
    body: 'Cada día te acompaña un versículo bíblico relacionado con las finanzas y la mayordomía. Puedes compartirlo con amigos o guardarlo para reflexionar.\n\nLa sabiduría empieza antes de abrir la billetera.',
    verse: 'Hijo mío, atiende a mis consejos; escucha atentamente lo que digo. No pierdas de vista mis palabras; guárdalas muy dentro de tu corazón',
    verseRef: 'Proverbios 4:20-21',
    gradient: 'from-[#D6B86A]/20 to-[#D6B86A]/5',
    accentColor: 'text-[#D6B86A]',
  },
  {
    id: 'transactions',
    icon: <Wallet className="h-10 w-10" />,
    badge: 'Finanzas',
    title: 'Registrá tus movimientos',
    subtitle: 'Ingresos, gastos y transferencias en segundos',
    body: 'Llevá un registro claro de cada peso que entra y sale. Categorías, cuentas múltiples y etiquetas te permiten saber exactamente en qué gastás.\n\nTodo funciona offline. Tus datos viven en tu dispositivo.',
    gradient: 'from-[#7FA58A]/20 to-[#7FA58A]/5',
    accentColor: 'text-[#7FA58A]',
  },
  {
    id: 'tithe',
    icon: <HandCoins className="h-10 w-10" />,
    badge: 'Mayordomía',
    title: 'Calculá tu diezmo',
    subtitle: 'Honrá a Dios con las primicias',
    body: 'KADOSH calcula automáticamente tu diezmo y ofrenda basándose en tus ingresos registrados. Podés personalizar el porcentaje y llevar historial de tus compromisos.',
    verse: 'Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad, porque Dios ama al dador alegre.',
    verseRef: '2 Corintios 9:7',
    gradient: 'from-[#E8C5A3]/20 to-[#E8C5A3]/5',
    accentColor: 'text-[#E8C5A3]',
  },
  {
    id: 'seeds',
    icon: <Sprout className="h-10 w-10" />,
    badge: 'Metas',
    title: 'Semillas & Ahorros',
    subtitle: 'Plantá hoy para cosechar mañana',
    body: 'Definí metas de ahorro con nombre, objetivo y fecha. KADOSH te muestra el progreso de cada "semilla" que plantás para tu futuro y te avisa cuando la alcanzás.',
    verse: 'Tesoro precioso y aceite hay en la casa del sabio; pero el hombre insensato todo lo disipa.',
    verseRef: 'Proverbios 21:20',
    gradient: 'from-[#8FBF9F]/20 to-[#8FBF9F]/5',
    accentColor: 'text-[#8FBF9F]',
  },
  {
    id: 'prayer-community',
    icon: <Heart className="h-10 w-10" />,
    badge: 'Comunidad',
    title: 'Nunca administrás solo',
    subtitle: 'Una comunidad que ora con vos',
    body: 'En KADOSH podés pedir oración por tu economía para que otros creyentes te acompañen delante de Dios, y también dedicar unos minutos para orar por quienes atraviesan situaciones difíciles.',
    verse: 'Ayúdense unos a otros a llevar sus cargas y así cumplirán la ley de Cristo.',
    verseRef: 'Gálatas 6:2',
    gradient: 'from-[#CFAF7A]/20 to-[#CFAF7A]/5',
    accentColor: 'text-[#CFAF7A]',
  },
  {
    id: 'planning',
    icon: <CalendarDays className="h-10 w-10" />,
    badge: 'Planificación',
    title: 'Compromisos y Deudas',
    subtitle: 'Tus obligaciones bajo control',
    body: 'Registrá tus pagos recurrentes, cuotas y servicios. KADOSH te muestra exactamente cuánto debes separar antes de gastar y te ayuda a simular tu balance mensual para evitar sorpresas.',
    gradient: 'from-[#85A6B8]/20 to-[#85A6B8]/5',
    accentColor: 'text-[#85A6B8]',
  },
  {
    id: 'privacy',
    icon: <ShieldCheck className="h-10 w-10" />,
    badge: 'Privacidad Absoluta',
    title: 'Tu información es solo tuya',
    subtitle: 'Seguridad de alto nivel',
    body: 'Tus datos están protegidos con cifrado de extremo a extremo, el mismo estándar utilizado por entidades financieras, militares y gubernamentales.\n\nNadie más puede leer tus números, ni siquiera nosotros. Sos el único dueño de tu información.',
    gradient: 'from-[#85A6B8]/20 to-[#85A6B8]/5',
    accentColor: 'text-[#85A6B8]',
  },
  {
    id: 'offline',
    icon: <CloudOff className="h-10 w-10" />,
    badge: 'Siempre Disponible',
    title: 'Funciona donde estés',
    subtitle: 'Sin depender de internet',
    body: 'Tus datos viven primero en tu dispositivo, permitiéndote registrar movimientos en cualquier momento sin conexión.\n\nSi decidís sincronizarlos en la nube para tener un respaldo, viajarán completamente encriptados.',
    gradient: 'from-[#7FA58A]/20 to-[#7FA58A]/5',
    accentColor: 'text-[#7FA58A]',
  },
  {
    id: 'ready',
    icon: <Sparkles className="h-10 w-10" />,
    badge: '¡Listo!',
    title: '¿Por dónde querés empezar?',
    subtitle: 'Ya tenés todo lo que necesitás',
    body: 'Podés comenzar a usar KADOSH ahora mismo, o si preferís, te guiamos paso a paso en un recorrido interactivo para configurar tu cuenta y conocer cada función.',
    gradient: 'from-[#D6B86A]/20 to-[#D6B86A]/5',
    accentColor: 'text-[#D6B86A]',
    isLast: true,
  },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const STORAGE_KEY = 'kadosh_onboarding_done';

function markOnboardingDone() {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {}
}

export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function SlideDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i === current ? 'w-5 h-2 bg-[#7FA58A]' : 'w-2 h-2 bg-foreground/20'
          }`}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export function OnboardingModal({ onComplete }: { onComplete?: () => void }) {
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showPWAInstall, setShowPWAInstall] = useState(false);
  const [pendingAction, setPendingAction] = useState<'enter' | 'tour' | null>(null);

  // Audio
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { isIOS, isStandalone, deferredPrompt, promptInstall } = usePWA();

  const startFadeIn = useCallback(() => {
    if (!audioRef.current) return;
    if (fadeTimeoutRef.current) clearInterval(fadeTimeoutRef.current);

    audioRef.current.volume = 0;
    const startTime = Date.now();

    const interval = setInterval(() => {
      if (!audioRef.current) {
        clearInterval(interval);
        return;
      }
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / AUDIO_FADE_DURATION, 1);
      audioRef.current.volume = progress * AUDIO_VOLUME;

      if (progress >= 1) {
        clearInterval(interval);
        audioRef.current.volume = AUDIO_VOLUME;
      }
    }, 50);
    
    fadeTimeoutRef.current = interval;
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0;
      isPlayingRef.current = false;
    }
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
  }, []);

  // Inicializar audio
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(AUDIO_PATH);
      audioRef.current.volume = 0;
      audioRef.current.loop = true;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, []);

  // Iniciar música SOLO cuando el onboarding es visible
  useEffect(() => {
    if (!visible || !audioRef.current || isPlayingRef.current) return;

    const playAudio = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        await audioRef.current!.play();
        isPlayingRef.current = true;
        startFadeIn();
      } catch (e) {
        console.log("Audio autoplay blocked. Waiting for interaction.");
      }
    };

    playAudio();
  }, [visible, startFadeIn]);

  // Try to play on first user interaction if autoplay failed
  useEffect(() => {
    if (!visible) return;

    const handleFirstInteraction = async () => {
      if (audioRef.current && !isPlayingRef.current) {
        try {
          await audioRef.current.play();
          isPlayingRef.current = true;
          startFadeIn();
        } catch (e) {
          console.log("Audio play failed on interaction", e);
        }
      }
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [visible, startFadeIn]);

  // ── Lógica de inicio (PWA + Onboarding) ─────────────────────
  useEffect(() => {
    if (hasSeenOnboarding()) return;

    if (isStandalone) {
      // Ya está instalada → ir directo al onboarding
      setTimeout(() => setVisible(true), 400);
    } else {
      const shouldShowPWA = localStorage.getItem('kadosh_pwa_prompt_shown') !== '1' && 
                           (deferredPrompt || isIOS);

      if (shouldShowPWA) {
        setShowPWAInstall(true);
        setVisible(true);
      } else {
        setTimeout(() => setVisible(true), 400);
      }
    }
  }, [isStandalone, deferredPrompt, isIOS]);

  const slide = SLIDES[index];
  const isFirst = index === 0;
  const isLast = !!slide?.isLast;

  const goNext = useCallback(() => {
    if (isLast) return;
    setDirection(1);
    setIndex(i => i + 1);
  }, [isLast]);

  const goSkip = useCallback(() => {
    markOnboardingDone();
    setVisible(false);
    stopAudio();
    onComplete?.();
  }, [onComplete, stopAudio]);

  const finishOnboarding = useCallback((action: 'enter' | 'tour') => {
    setVisible(false);
    stopAudio();
    onComplete?.();
  }, [onComplete, stopAudio]);

  const handleEnter = useCallback(() => {
    finishOnboarding('enter');
  }, [finishOnboarding]);

  const handleTour = useCallback(() => {
    finishOnboarding('tour');
  }, [finishOnboarding]);

  const closePWAPrompt = useCallback(() => {
    try {
      localStorage.setItem('kadosh_pwa_prompt_shown', '1');
    } catch {}
    setShowPWAInstall(false);
    setTimeout(() => setVisible(true), 100);
  }, []);

  const handlePWAInstallClick = async () => {
    if (deferredPrompt) {
      await promptInstall();
      closePWAPrompt();
    }
  };

  // Swipe handlers
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  const handleSwipe = (clientX: number) => {
    if (dragStartX === null) return;
    const delta = dragStartX - clientX;
    if (Math.abs(delta) > 50) {
      if (delta > 0 && !isLast) goNext();
      else if (delta < 0 && !isFirst) {
        setDirection(-1);
        setIndex(i => i - 1);
      }
    }
    setDragStartX(null);
  };

  const onTouchStart = (e: React.TouchEvent) => setDragStartX(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => handleSwipe(e.changedTouches[0].clientX);
  const onMouseDown = (e: React.MouseEvent) => setDragStartX(e.clientX);
  const onMouseUp = (e: React.MouseEvent) => handleSwipe(e.clientX);

  if (!visible) return null;

  const variants = { /* ... mismo variants ... */ 
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-60%' : '60%', opacity: 0 }),
  };

  // PWA Prompt
  if (showPWAInstall) {
    return ( /* ... mismo bloque del PWA prompt ... */ 
      <div className="fixed inset-0 z-[9999] flex flex-col bg-background overflow-hidden touch-pan-y" aria-modal="true" role="dialog">
        {/* ... contenido completo del PWA prompt igual que antes ... */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-primary/8 blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center justify-center px-6 pt-safe pt-10 pb-4 h-14" />

        <div className="relative flex-1 overflow-hidden">
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
          >
            <div className="relative mb-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg">
              <div className="absolute inset-0 rounded-3xl ring-1 ring-foreground/5" />
              <span className="text-primary"><Smartphone className="h-10 w-10" /></span>
            </div>

            <h2 className="text-2xl font-bold leading-tight text-foreground mb-4">Instalá Kadosh</h2>

            {isIOS ? (
              <div className="text-sm leading-relaxed text-muted-foreground max-w-xs text-left w-full mx-auto space-y-4">
                <p className="text-center mb-2">Para instalar Kadosh en tu iPhone:</p>
                <ol className="space-y-4">
                  <li className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5 text-foreground"><Share className="h-4 w-4" /></div>
                    <span>Tocá el botón <strong>Compartir</strong> de Safari.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5 text-foreground"><PlusSquare className="h-4 w-4" /></div>
                    <span>Seleccioná <strong>Agregar a pantalla de inicio</strong>.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5 text-foreground"><Smartphone className="h-4 w-4" /></div>
                    <span>Confirmá la instalación.</span>
                  </li>
                </ol>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground max-w-xs whitespace-pre-line">
                Accedé a Kadosh directamente desde la pantalla de inicio de tu celular, con una experiencia más rápida y funcionamiento offline.
              </p>
            )}
          </motion.div>
        </div>

        <div className="relative z-10 px-6 pb-safe pb-10 pt-4">
          <div className="flex flex-col gap-3">
            {!isIOS && (
              <button onClick={handlePWAInstallClick} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all active:scale-95 hover:bg-primary/90">
                Instalar ahora
              </button>
            )}
            <button onClick={closePWAPrompt} className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-4 text-sm font-semibold text-foreground shadow-sm transition-all active:scale-95 hover:bg-muted">
              {isIOS ? 'Entendido' : 'Ahora no'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Onboarding normal
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-background overflow-hidden touch-pan-y"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      aria-modal="true"
      role="dialog"
      aria-label="Bienvenida a KADOSH"
    >
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#7FA58A]/8 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-[#D6B86A]/8 blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-safe pt-10 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            <Leaf className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold tracking-widest text-foreground/60 uppercase">Kadosh</span>
        </div>

        {!isLast && (
          <button onClick={goSkip} className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg">
            Omitir
          </button>
        )}
      </div>

      {/* Slide Content */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={slide.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
          >
            <div className={`relative mb-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br ${slide.gradient} shadow-lg`}>
              <div className="absolute inset-0 rounded-3xl ring-1 ring-foreground/5" />
              <span className={slide.accentColor}>{slide.icon}</span>
            </div>

            {slide.badge && (
              <span className={`mb-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide border border-foreground/10 bg-foreground/5 ${slide.accentColor}`}>
                {slide.badge}
              </span>
            )}

            <h2 className="text-2xl font-bold leading-tight text-foreground mb-2">{slide.title}</h2>
            <p className={`text-sm font-medium mb-5 ${slide.accentColor}`}>{slide.subtitle}</p>
            <p className="text-sm leading-relaxed text-muted-foreground max-w-xs whitespace-pre-line">{slide.body}</p>

            {slide.verse && (
              <div className="mt-5 max-w-xs w-full text-left border-l-2 border-foreground/15 pl-4">
                <p className="text-sm italic leading-relaxed text-foreground/70">“{slide.verse}”</p>
                {slide.verseRef && <p className={`mt-1.5 text-xs font-semibold tracking-wide ${slide.accentColor}`}>— {slide.verseRef}</p>}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 px-6 pb-safe pb-10 pt-4">
        <div className="flex justify-center mb-6">
          <SlideDots total={SLIDES.length} current={index} />
        </div>

        {isLast ? (
          <div className="flex flex-col gap-3">
            <button onClick={handleEnter} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all active:scale-95 hover:bg-primary/90">
              Comenzar ahora <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={handleTour} className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-4 text-sm font-semibold text-foreground shadow-sm transition-all active:scale-95 hover:bg-muted">
              <MapPin className="h-4 w-4 text-[#D6B86A]" /> Hacer el recorrido interactivo
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            {isFirst ? <div className="w-20" /> : (
              <button onClick={() => { setDirection(-1); setIndex(i => i - 1); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-3 rounded-xl">
                <ChevronLeft className="h-4 w-4" /> Atrás
              </button>
            )}
            <button onClick={goNext} className="flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all active:scale-95 hover:bg-primary/90">
              Siguiente <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}