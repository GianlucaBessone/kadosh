'use client';

import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

/**
 * Reads the current theme from db.settings and applies / removes the
 * `dark` class on <html>.  Returns helpers for reading and toggling.
 */
export function useTheme() {
  const settings = useLiveQuery(() => db.settings.orderBy('id').first());
  const user = useLiveQuery(() => db.users.orderBy('id').first());

  const theme = settings?.theme ?? 'light';
  const isDark = theme === 'dark';

  // Keep the DOM in sync whenever settings change
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = async () => {
    const next = isDark ? 'light' : 'dark';

    if (settings) {
      await db.settings.update(settings.id, {
        theme: next,
        updatedAt: new Date().toISOString(),
      });
    } else if (user) {
      // No settings row yet — create one with sensible defaults
      await db.settings.add({
        id: crypto.randomUUID(),
        userId: user.id,
        theme: next,
        notifications: true,
        dailyVerse: true,
        showReflection: true,
        offlineDownload: true,
        soundEffects: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      });
    }
  };

  return { isDark, theme, toggleTheme };
}
