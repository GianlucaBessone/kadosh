'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';
import { CommitmentForm } from '@/features/planning/components/CommitmentForm';

export default function NewCommitmentPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line
    setIsMounted(true);
  }, []);
  const router = useRouter();

  if (!isMounted) return null;

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nuevo compromiso</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Planificá con anticipación.</p>
        </div>
      </div>

      <CommitmentForm />
    </div>
  );
}
