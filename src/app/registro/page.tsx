'use client';

import { useRouter } from 'next/navigation';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';

export default function RegistroPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <OnboardingModal onComplete={() => router.replace('/login?setup=true')} />
    </div>
  );
}
