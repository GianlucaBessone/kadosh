'use client';

import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { syncEngine } from '@/services/syncEngine';
import { isAppUnlocked, hasLocalPin } from '@/features/auth/localAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

import { DailyVerseService } from '@/features/daily-verse/service';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Profiler } from 'react';
import { onRenderCallback } from '@/lib/performance/ReactRenderProfiler';
import { NavigationProfiler } from '@/lib/performance/NavigationProfiler';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { soundService } from '@/lib/SoundService';
import { Toaster } from '@/components/ui/sonner';
import { GlobalDevInfoWatcher } from '@/components/GlobalDevInfoWatcher';

const PUBLIC_ROUTES = new Set(['/', '/login', '/registro', '/welcome']);

function isPublicPath(pathname: string | null) {
  if (!pathname) return false;
  return PUBLIC_ROUTES.has(pathname) || pathname.startsWith('/admin');
}

// Patch for Radix UI releasePointerCapture bug in React 18
if (typeof window !== 'undefined') {
  const originalReleasePointerCapture = Element.prototype.releasePointerCapture;
  Element.prototype.releasePointerCapture = function(pointerId) {
    if (this.hasPointerCapture(pointerId)) {
      originalReleasePointerCapture.call(this, pointerId);
    }
  };
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

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isMounted = useRef(false);
  const [isAuthVerified, setIsAuthVerified] = useState(false);

  const markAuthVerified = useCallback(() => {
    queueMicrotask(() => setIsAuthVerified(true));
  }, []);

  useEffect(() => {
    isMounted.current = true;
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

    db.users.orderBy('id').first().then(async user => {
      if (user) {
        const existingWs = await db.workspaces.get(user.id);
        if (!existingWs) {
          await db.workspaces.put({
            id: user.id,
            name: 'Personal',
            type: 'PERSONAL',
            ownerId: user.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        try {
          const { SnapshotManager } = await import('@/lib/crypto/SnapshotManager');
          await SnapshotManager.loadWorkspace(user.id);
        } catch (error) {
          console.error("Failed to load workspace", error);
          const { useWorkspaceStore } = await import('@/store/WorkspaceStore');
          useWorkspaceStore.getState().initializeWorkspace(user.id);
          useWorkspaceStore.getState().setActiveWorkspace(user.id);
        }

        try {
          const { ProjectionRecoveryManager } = await import('@/lib/crypto/ProjectionRecoveryManager');
          await ProjectionRecoveryManager.triggerRecovery('Workspace Loaded');
        } catch (e) {
          console.error('Failed to run initial projections', e);
        }
      }
      markAuthVerified();
    });
  }, [markAuthVerified, pathname, router]);

  if (typeof window === 'undefined' || !isAuthVerified) return null;

  return <>{children}</>;
}

function OnboardingWrapper() {
  const pathname = usePathname();
  if (pathname === '/welcome') return null;
  return <OnboardingModal />;
}

export function GlobalClientProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Start Projection Engine (Reactive Loop for Event Sourcing)
    import('@/lib/crypto/ProjectionRecoveryManager').then(({ ProjectionRecoveryManager }) => {
      ProjectionRecoveryManager.init();
      ProjectionRecoveryManager.triggerRecovery('App Startup');
    });

    // Check and claim workspace before starting sync engine
    import('@/services/WorkspaceAssociationService').then(({ WorkspaceAssociationService }) => {
      WorkspaceAssociationService.checkAndClaimWorkspace().finally(() => {
        // Solo iniciar el motor de sincronización si hay conexión
        if (navigator.onLine) {
          syncEngine.start();
        } else {
          // Escuchar evento de conexión para iniciar la sincronización cuando haya conexión
          window.addEventListener('online', () => {
            syncEngine.start();
          });
        }
      });
    });

    // Init Daily Verses
    DailyVerseService.initializeDatabase();
    
    // Init SoundService configuration
    soundService.reloadSettings();

    return () => {
      syncEngine.stop();
    };
  }, []);

  return (
    <Profiler id="GlobalClientProvider" onRender={onRenderCallback}>
      <TooltipProvider>
        <Suspense fallback={null}>
          <NavigationProfiler />
        </Suspense>
        <ThemeApplier />
        <GlobalDevInfoWatcher />
        <AuthGuard>
          <OnboardingWrapper />
          {children}
        </AuthGuard>
        <Toaster />
      </TooltipProvider>
    </Profiler>
  );
}