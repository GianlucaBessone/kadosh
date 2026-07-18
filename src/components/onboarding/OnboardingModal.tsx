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
  Heart, // Added for prayer community slide
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
  verse?: string;            // Biblical quote text (without reference)
  verseRef?: string;         // e.g. "2 Corintios 9:7"
  gradient: string;          // Tailwind bg-gradient classes for the icon blob
  accentColor: string;       // Tailwind text-* for highlighted text
  isLast?: boolean;
}

// ─────────────────────────────────────────────
// Audio constants
// ─────────────────────────────────────────────
const AUDIO_FADE_DURATION = 4000; // 2 seconds for fade in/out
const AUDIO_VOLUME = 0.5; // 50% volume for optimal listening experience
const AUDIO_PATH = '/sounds/stars.m4a'; // Path to the background music file

// ─────────────────────────────────────────────
// Slides definition
// (Add future feature slides here)
// ─────────────────────────────────────────────
const SLIDES: OnboardingSlide[] = [
  // ── 0 · Por qué KADOSH ──────────────────────
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
  // ── 1 · Versículo diario ────────────────────
  {
    id: 'daily-verse',
    icon: <BookOpen className="h-10 w-10" />,
    badge: 'Devocional',
    title: 'Versículo del día',
    subtitle: 'La Palabra que guía tus decisiones',
    body: 'Cada día te acompaña un versículo bíblico relacionado con las finanzas y la mayordomía. Puedes compartirlo con amigos o guardarlo para reflexionar.\n\nLa sabiduría empieza antes de abrir la billetera.',
    gradient: 'from-[#D6B86A]/20 to-[#D6B86A]/5',
    accentColor: 'text-[#D6B86A]',
  },
  // ── 2 · Registro de movimientos ─────────────
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
  // ── 3 · Diezmo ──────────────────────────────
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
  // ── 4 · Semillas & Ahorros ───────────────────
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
    // ── 5 · Prayer Community ────────────────────
  {
    id: 'prayer-community',
    icon: <Heart className="h-10 w-10" />,
    badge: 'Comunidad',
    title: 'Nunca administrás solo',
    subtitle: 'Una comunidad que ora contigo',
    body: 'En KADOSH podés pedir oración por tu economía para que otros creyentes te acompañen delante de God, y también dedicar unos minutos para orar por quienes atraviesan situaciones similares.',
    verseRef: 'Gálatas 6:2 (NVI)',
    gradient: 'from-[#CFAF7A]/20 to-[#CFAF7A]/5',
    accentColor: 'text-[#CFAF7A]',
  },
  // ── 6 · Planificación ───────────────────────
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
  // ── 7 · Privacidad ──────────────────────────
  {
    id: 'privacy',
    icon: <ShieldCheck className="h-10 w-10" />,
    badge: 'Privacidad Absoluta',
    title: 'Tu información es solo tuya',
    subtitle: 'Seguridad de alto nivel',
    body: 'Tus datos están protegidos con cifrado de extremo a extremo, el mismo estándar utilizado por entidades financieras, militares y gubernamentales.\n\nNadie más puede leer tus números, ni siquiera nosotros. Eres el único dueño de tu información.',
    gradient: 'from-[#85A6B8]/20 to-[#85A6B8]/5',
    accentColor: 'text-[#85A6B8]',
  },
  // ── 8 · Offline First ───────────────────────
  {
    id: 'offline',
    icon: <CloudOff className="h-10 w-10" />,
    badge: 'Siempre Disponible',
    title: 'Funciona donde estés',
    subtitle: 'Sin depender de internet',
    body: 'Tus datos viven primero en tu dispositivo, permitiéndote registrar movimientos en cualquier momento sin conexión.\n\nSi decides sincronizarlos en la nube para tener un respaldo, viajarán completamente encriptados.',
    gradient: 'from-[#7FA58A]/20 to-[#7FA58A]/5',
    accentColor: 'text-[#7FA58A]',
  },
  // ── 9 · Final ───────────────────────────────
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
  } catch {
    // ignore
  }
}

export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────
// Dot indicator
// ─────────────────────────────────────────────
function SlideDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? 'w-5 h-2 bg-[#7FA58A]'
              : 'w-2 h-2 bg-foreground/20'
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
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [startTour, setStartTour] = useState(false);
  const [showPWAInstall, setShowPWAInstall] = useState(false);
  const [pendingAction, setPendingAction] = useState<'enter' | 'tour' | null>(null);
  
  // Refs for audio management
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { isIOS, isStandalone, deferredPrompt, promptInstall } = usePWA();

  // Initialize audio element
  useEffect(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio(AUDIO_PATH);
      audioRef.current.volume = 0; // Start muted for autoplay compliance
      audioRef.current.loop = true; // Loop the background music
    }

    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = null;
      }
    };
  }, []);

  // Handle autoplay restrictions by playing on first user interaction
  useEffect(() => {
    if (!visible || !audioRef.current || isPlayingRef.current) return;

    const playAudioWithFallback = async () => {
      try {
        // Try to play immediately (for browsers that allow autoplay)
        await new Promise(resolve => setTimeout(resolve, 2000));
        await audioRef.current!.play();
        isPlayingRef.current = true;
        startFadeIn(); // Start fade-in effect
      } catch (error) {
        // If autoplay is blocked, wait for user interaction to play
        console.log("Autoplay blocked, waiting for user interaction");
      }
    };

    playAudioWithFallback();
  }, [visible]);

  // Function to start fade-in effect
  const startFadeIn = useCallback(() => {
    if (!audioRef.current) return;

    // Reset timeout if already running
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }

    // Set isPlayingRef to true after we start the fade
    isPlayingRef.current = true;
    audioRef.current.volume = 0;
    
    // Gradually increase volume over time
    const startTime = Date.now();
    const fadeInInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / AUDIO_FADE_DURATION, 1); // Normalize to 0-1
      audioRef.current!.volume = progress * AUDIO_VOLUME;

      if (progress >= 1) {
        clearInterval(fadeInInterval);
        audioRef.current!.volume = AUDIO_VOLUME;
      }
    }, 50); // Update every 50ms for smooth transition
  }, []);

  // Function to start fade-out effect
  const startFadeOut = useCallback(() => {
    if (!audioRef.current || !isPlayingRef.current) return;

    // Reset timeout if already running
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }

    // Gradually decrease volume over time
    const startTime = Date.now();
    const fadeOutInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / AUDIO_FADE_DURATION, 1); // Normalize to 0-1
      audioRef.current!.volume = AUDIO_VOLUME * (1 - progress);

      if (progress >= 1) {
        clearInterval(fadeOutInterval);
        audioRef.current!.pause();
        audioRef.current!.currentTime = 0; // Reset to beginning
        isPlayingRef.current = false;
      }
    }, 50); // Update every 50ms for smooth transition
  }, []);

  // Function to stop audio completely
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

  // Play audio on user interaction if autoplay was blocked
  const handleUserInteraction = useCallback(async () => {
    if (!audioRef.current || isPlayingRef.current) return;

    try {
      await audioRef.current.play();
      isPlayingRef.current = true;
      startFadeIn();
    } catch (error) {
      console.error("Failed to play audio:", error);
    }
  }, [startFadeIn]);

  // Check on mount
  useEffect(() => {
    if (!hasSeenOnboarding()) {
      // Small delay so the page underneath renders first
      const t = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  // Handle fade out when reaching the last slide
  useEffect(() => {
    const slide = SLIDES[index];
    if (slide.isLast && isPlayingRef.current) {
      startFadeOut();
    }
  }, [index, startFadeOut]);

  const slide = SLIDES[index];
  const isFirst = index === 0;
  const isLast = !!slide.isLast;

  const goNext = useCallback(() => {
    if (isLast) return;
    setDirection(1);
    setIndex((i) => i + 1);
  }, [isLast]);

  const goSkip = useCallback(() => {
    markOnboardingDone();
    setVisible(false);
    stopAudio(); // Stop audio when skipping
    onComplete?.();
  }, [onComplete, stopAudio]);

  const finishOnboarding = useCallback(
    (action: 'enter' | 'tour') => {
      setVisible(false);
      stopAudio(); // Stop audio when finishing
      if (action === 'tour') {
        setStartTour(true);
        // TODO: launch interactive tour
      }
      onComplete?.();
    },
    [onComplete, stopAudio]
  );

  const handleAction = useCallback(
    (action: 'enter' | 'tour') => {
      markOnboardingDone();

      let pwaPromptShown = false;
      try {
        pwaPromptShown = localStorage.getItem('kadosh_pwa_prompt_shown') === '1';
      } catch {
        // ignore
      }

      if (!isStandalone && !pwaPromptShown && (deferredPrompt || isIOS)) {
        setPendingAction(action);
        setDirection(1);
        setShowPWAInstall(true);
      } else {
        finishOnboarding(action);
      }
    },
    [isStandalone, deferredPrompt, isIOS, finishOnboarding]
  );

  const handleEnter = useCallback(() => {
    handleUserInteraction(); // Try to play audio if not already playing
    handleAction('enter');
  }, [handleAction, handleUserInteraction]);

  const handleTour = useCallback(() => {
    handleUserInteraction(); // Try to play audio if not already playing
    handleAction('tour');
  }, [handleAction, handleUserInteraction]);

  const closePWAPrompt = useCallback(() => {
    try {
      localStorage.setItem('kadosh_pwa_prompt_shown', '1');
    } catch {
      // ignore
    }
    if (pendingAction) {
      finishOnboarding(pendingAction);
    } else {
      finishOnboarding('enter');
    }
  }, [pendingAction, finishOnboarding]);

  const handlePWAInstallClick = async () => {
    if (deferredPrompt) {
      await promptInstall();
      closePWAPrompt();
    }
  };

  // ── Swipe / drag support ────────────────────
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  const handleSwipe = (clientX: number) => {
    if (dragStartX === null) return;
    const delta = dragStartX - clientX;
    if (Math.abs(delta) > 50) {
      if (delta > 0 && !isLast) goNext();
      else if (delta < 0 && !isFirst) {
        setDirection(-1);
        setIndex((i) => i - 1);
      }
    }
    setDragStartX(null);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    handleUserInteraction(); // Try to play audio on touch interaction
    setDragStartX(e.touches[0].clientX);
  };
  const onTouchEnd = (e: React.TouchEvent) => handleSwipe(e.changedTouches[0].clientX);

  const onMouseDown = (e: React.MouseEvent) => {
    handleUserInteraction(); // Try to play audio on mouse interaction
    setDragStartX(e.clientX);
  };
  const onMouseUp = (e: React.MouseEvent) => handleSwipe(e.clientX);

  if (!visible) return null;

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? '-60%' : '60%',
      opacity: 0,
    }),
  };

  // Render PWA Install View if needed
  if (showPWAInstall) {
    return (
      <div
        className="fixed inset-0 z-[9999] flex flex-col bg-background overflow-hidden touch-pan-y"
        aria-modal="true"
        role="dialog"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-primary/8 blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center justify-center px-6 pt-safe pt-10 pb-4 h-14" />

        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key="pwa-install"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
            >
              <div className="relative mb-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg">
                <div className="absolute inset-0 rounded-3xl ring-1 ring-foreground/5" />
                <span className="text-primary"><Smartphone className="h-10 w-10" /></span>
              </div>

              <h2 className="text-2xl font-bold leading-tight text-foreground mb-4">
                Instalá Kadosh
              </h2>

              {isIOS ? (
                <div className="text-sm leading-relaxed text-muted-foreground max-w-xs text-left w-full mx-auto space-y-4">
                  <p className="text-center mb-2">Para instalar Kadosh en tu iPhone:</p>
                  <ol className="space-y-4">
                    <li className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5 text-foreground">
                        <Share className="h-4 w-4" />
                      </div>
                      <span>Tocá el botón <strong>Compartir</strong> de Safari.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5 text-foreground">
                        <PlusSquare className="h-4 w-4" />
                      </div>
                      <span>Seleccioná <strong>Agregar a pantalla de inicio</strong>.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5 text-foreground">
                        <Smartphone className="h-4 w-4" />
                      </div>
                      <span>Confirmá la instalación.</span>
                    </li>
                  </ol>
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground max-w-xs whitespace-pre-line">
                  Accedé a Kadosh directamente desde la pantalla de inicio de tu celular, con una experiencia más rápida, similar a una aplicación nativa y con funcionamiento offline.
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative z-10 px-6 pb-safe pb-10 pt-4">
          <div className="flex flex-col gap-3">
            {!isIOS && (
              <button
                onClick={handlePWAInstallClick}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all active:scale-95 hover:bg-primary/90"
              >
                Instalar ahora
              </button>
            )}
            <button
              onClick={closePWAPrompt}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-4 text-sm font-semibold text-foreground shadow-sm transition-all active:scale-95 hover:bg-muted"
            >
              {isIOS ? 'Entendido' : 'Ahora no'}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
      {/* ── Background decorative blobs ─────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#7FA58A]/8 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-[#D6B86A]/8 blur-3xl" />
      </div>

      {/* ── Top bar ─────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-safe pt-10 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            <Leaf className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold tracking-widest text-foreground/60 uppercase">
            Kadosh
          </span>
        </div>

        {/* Skip — hidden on last slide */}
        {!isLast && (
          <button
            id="onboarding-skip"
            onClick={goSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg"
          >
            Omitir
          </button>
        )}
      </div>

      {/* ── Slide content (animated) ─────────── */}
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
            {/* Icon blob */}
            <div
              className={`relative mb-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br ${slide.gradient} shadow-lg`}
            >
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-3xl ring-1 ring-foreground/5" />
              <span className={slide.accentColor}>{slide.icon}</span>
            </div>

            {/* Badge */}
            {slide.badge && (
              <span
                className={`mb-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide border border-foreground/10 bg-foreground/5 ${slide.accentColor}`}
              >
                {slide.badge}
              </span>
            )}

            {/* Title */}
            <h2 className="text-2xl font-bold leading-tight text-foreground mb-2">
              {slide.title}
            </h2>

            {/* Subtitle */}
            <p className={`text-sm font-medium mb-5 ${slide.accentColor}`}>
              {slide.subtitle}
            </p>

            {/* Body */}
            <p className="text-sm leading-relaxed text-muted-foreground max-w-xs whitespace-pre-line">
              {slide.body}
            </p>

            {/* Verse block */}
            {slide.verse && (
              <div className="mt-5 max-w-xs w-full text-left border-l-2 border-foreground/15 pl-4">
                <p className="text-sm italic leading-relaxed text-foreground/70">
                  &ldquo;{slide.verse}&rdquo;
                </p>
                {slide.verseRef && (
                  <p className={`mt-1.5 text-xs font-semibold tracking-wide ${slide.accentColor}`}>
                    — {slide.verseRef}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Bottom bar ──────────────────────── */}
      <div className="relative z-10 px-6 pb-safe pb-10 pt-4">
        {/* Dots */}
        <div className="flex justify-center mb-6">
          <SlideDots total={SLIDES.length} current={index} />
        </div>

        {isLast ? (
          /* ── Last slide CTAs ─────────────── */
          <div className="flex flex-col gap-3">
            <button
              id="onboarding-enter"
              onClick={handleEnter}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all active:scale-95 hover:bg-primary/90"
            >
              Comenzar ahora
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              id="onboarding-tour"
              onClick={handleTour}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-4 text-sm font-semibold text-foreground shadow-sm transition-all active:scale-95 hover:bg-muted"
            >
              <MapPin className="h-4 w-4 text-[#D6B86A]" />
              Hacer el recorrido interactivo
            </button>
          </div>
        ) : (
          /* ── Normal navigation ───────────── */
          <div className="flex items-center justify-between">
            {/* Back button (left) — hidden on first slide */}
            {isFirst ? (
              <div className="w-20" />
            ) : (
              <button
                id="onboarding-back"
                onClick={() => { setDirection(-1); setIndex((i) => i - 1); }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-3 rounded-xl"
              >
                <ChevronLeft className="h-4 w-4" />
                Atrás
              </button>
            )}

            {/* Next button */}
            <button
              id="onboarding-next"
              onClick={goNext}
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all active:scale-95 hover:bg-primary/90"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}