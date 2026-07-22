'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hasSeenOnboarding } from '@/components/onboarding/OnboardingModal';
import { hasLocalPin, isAppUnlocked } from '@/features/auth/localAuth';
import { Leaf } from 'lucide-react';
import { db } from '@/lib/db';

export default function BootstrapPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const determineRoute = async () => {
      // Check if user has completed onboarding
      if (!hasSeenOnboarding()) {
        // Show onboarding
        router.replace('/registro');
        setLoading(false);
        return;
      }

      // Check if user has set up local PIN
      if (!hasLocalPin()) {
        // Show login/setup
        router.replace('/login');
        setLoading(false);
        return;
      }

      // Check if app is unlocked
      if (!isAppUnlocked()) {
        // Show login
        router.replace('/login');
        setLoading(false);
        return;
      }

      // Check if user has valid session/data to go to home
      const user = await db.users.orderBy('id').first();
      if (user) {
        // Go to home
        router.replace('/home');
      } else {
        // Show login
        router.replace('/login');
      }
      
      setLoading(false);
    };

    determineRoute();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Leaf className="animate-pulse text-primary h-8 w-8" />
      </div>
    );
  }

  return null;
}