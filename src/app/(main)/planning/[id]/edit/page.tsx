'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useCommitment } from '@/features/planning/hooks/usePlanningData';
import { CommitmentForm } from '@/features/planning/components/CommitmentForm';
import { db } from '@/lib/db';

export default function EditCommitmentPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line
    setIsMounted(true);
  }, []);
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id || '';

  const commitment = useCommitment(id);

  if (!isMounted) return null;

  if (!commitment) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Cargando...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Editar compromiso</h1>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{commitment.name}</p>
        </div>
      </div>

      <CommitmentForm initial={commitment} />
    </div>
  );
}
