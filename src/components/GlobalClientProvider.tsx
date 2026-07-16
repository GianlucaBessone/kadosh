'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { syncEngine } from '@/services/syncEngine';
import { isAppUnlocked, hasLocalPin } from '@/features/auth/localAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

import { DailyVerseService } from '@/features/daily-verse/service';
import { TooltipProvider } from '@/components/ui/tooltip';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { soundService } from '@/lib/SoundService';
import { Toaster } from '@/components/ui/sonner';
import { GlobalDevInfoWatcher } from '@/components/GlobalDevInfoWatcher';

const PUBLIC_ROUTES = new Set(['/', '/login', '/registro', '/welcome']);

function isPublicPath(pathname: string | null) {
  if (!pathname) return false;
  return PUBLIC_ROUTES.has(pathname) || pathname.startsWith('/admin');
}

/**
 * Reads the persisted theme from Dexie and applies the `dark` class to
 * <html> so the whole app reflects the correct color scheme on mount.
 * Runs before children render to avoid a flash of wrong theme.
 */
function ThemeApplier() {
  const settings = useLiveQuery(() => db.settings.orderBy('id').first());

  useEffect(() => {
    const isDark = settings?.theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
  }, [settings?.theme]);

  return null;
}

export function GlobalClientProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isMounted = useRef(false);
  const [isAuthVerified, setIsAuthVerified] = useState(false);

  const markAuthVerified = useCallback(() => {
    queueMicrotask(() => setIsAuthVerified(true));
  }, []);

  useEffect(() => {
    isMounted.current = true;

    // Start the offline sync engine
    syncEngine.start();

    // Init Daily Verses
    DailyVerseService.initializeDatabase();
    
    // Init SoundService configuration
    soundService.reloadSettings();

    return () => {
      syncEngine.stop();
    };
  }, []);

  useEffect(() => {
    if (!isMounted.current) return;

    const publicRoute = isPublicPath(pathname);

    if (publicRoute) {
      if ((pathname === '/login' || pathname === '/registro') && hasLocalPin() && isAppUnlocked()) {
        router.replace('/home');
        return;
      }

      markAuthVerified();
      return;
    }

    if (!hasLocalPin()) {
      router.replace('/login?setup=true');
      return;
    }

    if (!isAppUnlocked()) {
      router.replace('/login');
      return;
    }

    markAuthVerified();
  }, [markAuthVerified, pathname, router]);

  // Don't render children until we've verified auth on the client to prevent flickering.
  if (typeof window === 'undefined' || !isAuthVerified) return null;

  const publicRoute = isPublicPath(pathname);

  return (
    <TooltipProvider>
      <ThemeApplier />
      <GlobalDevInfoWatcher />
      {pathname !== '/welcome' && <OnboardingModal />}
      {children}
      <Toaster />
    </TooltipProvider>
  );
}
