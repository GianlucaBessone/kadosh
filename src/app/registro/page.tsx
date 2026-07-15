'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingModal, hasSeenOnboarding } from '@/components/onboarding/OnboardingModal';
import { Leaf } from 'lucide-react';

export default function RegistroPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (hasSeenOnboarding()) {
      router.replace('/login?setup=true');
    } else {
      setNeedsOnboarding(true);
    }
  }, [router]);

  if (!mounted) {
    return <div className="flex h-screen items-center justify-center bg-background"><Leaf className="animate-pulse text-primary h-8 w-8" /></div>;
  }

  if (needsOnboarding) {
    return (
      <div className="min-h-screen bg-background">
        <OnboardingModal onComplete={() => router.replace('/login?setup=true')} />
      </div>
    );
  }

  // If redirecting, just show loading state
  return <div className="flex h-screen items-center justify-center bg-background"><Leaf className="animate-pulse text-primary h-8 w-8" /></div>;
}
