'use client';

import { useEffect, useState } from 'react';
import { syncEngine } from '@/services/syncEngine';
import { isAppUnlocked, hasLocalPin } from '@/features/auth/localAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

import { DailyVerseService } from '@/features/daily-verse/service';
import { TooltipProvider } from '@/components/ui/tooltip';

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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Start the offline sync engine
    syncEngine.start();

    // Init Daily Verses
    DailyVerseService.initializeDatabase();

    return () => {
      syncEngine.stop();
    };
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // PIN Authentication guard
    const inAuthRoute = pathname === '/';

    if (!inAuthRoute) {
      if (!hasLocalPin()) {
        router.replace('/?setup=true');
      } else if (!isAppUnlocked()) {
        router.replace('/');
      }
    } else {
      // If we are in the auth route but already unlocked, redirect to home
      if (hasLocalPin() && isAppUnlocked()) {
        router.replace('/home');
      }
    }
  }, [pathname, isMounted, router]);

  // Don't render children until we've verified auth on the client to prevent flickering
  if (!isMounted) return null;

  return (
    <TooltipProvider>
      <ThemeApplier />
      {children}
    </TooltipProvider>
  );
}
