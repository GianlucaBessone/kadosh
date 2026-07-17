'use client';

import { useEffect } from 'react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

export function PulseManager() {
  const user = useLiveQuery(() => db.users.orderBy('id').first());

  useEffect(() => {
    if (!user) return;

    const sendPulse = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const lastPulseStr = localStorage.getItem('kadosh_last_pulse_date');
        
        // Check if there was any transaction today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        const txsToday = await (db as any).transactions
          .where('date')
          .aboveOrEqual(startOfDay.toISOString())
          .count();
          
        const hasActivity = txsToday > 0;
        
        // Send pulse if we haven't sent one today, OR if there is activity but we previously sent a 0 (no activity) pulse today
        const lastPulseHadActivity = localStorage.getItem('kadosh_last_pulse_activity') === 'true';
        
        if (lastPulseStr !== today || (hasActivity && !lastPulseHadActivity)) {
          await fetch('/api/inactivity/pulse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userHash: user.id,
              hasActivity,
            }),
          });
          
          localStorage.setItem('kadosh_last_pulse_date', today);
          localStorage.setItem('kadosh_last_pulse_activity', String(hasActivity));
        }
      } catch (error) {
        console.error('Failed to send inactivity pulse:', error);
      }
    };

    // Send immediately on mount
    sendPulse();
    
    // Also set an interval to check occasionally if the app is left open
    const interval = setInterval(sendPulse, 60 * 60 * 1000); // Every hour
    
    return () => clearInterval(interval);
  }, [user]);

  return null;
}
