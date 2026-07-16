'use client';

import { useState, useEffect } from 'react';

// Global variable to capture the event as early as possible
let globalDeferredPrompt: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    globalDeferredPrompt = e;
  });
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setDeferredPrompt(globalDeferredPrompt);

    const checkPWA = () => {
      // Check if it's iOS
      const ios =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.userAgent === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad Pro
      setIsIOS(ios);

      // Check if it's running in standalone mode
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      
      setIsStandalone(standalone);
    };

    checkPWA();

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      globalDeferredPrompt = e;
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const promptInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      // We've used the prompt, and can't use it again, throw it away
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
      return outcome === 'accepted';
    }
    return false;
  };

  return {
    isIOS,
    isStandalone,
    deferredPrompt,
    promptInstall,
  };
}
