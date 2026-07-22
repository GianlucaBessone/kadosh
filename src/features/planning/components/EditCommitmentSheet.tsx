'use client';

import { ArrowLeft } from 'lucide-react';
import { useCommitment } from '@/features/planning/hooks/usePlanningData';
import { CommitmentForm } from '@/features/planning/components/CommitmentForm';

interface EditCommitmentSheetProps {
  commitmentId: string;
  onClose: () => void;
}

export function EditCommitmentSheet({ commitmentId: id, onClose }: EditCommitmentSheetProps) {
  const commitment = useCommitment(id);

  if (!commitment) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col p-4 animate-in slide-in-from-right duration-300">
        <div className="flex h-screen items-center justify-center text-muted-foreground text-sm">
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="flex flex-col gap-6 w-full pb-16 min-h-screen px-4 max-w-md mx-auto relative pt-4">
        <div className="flex items-center gap-3 mt-2 sticky top-4 z-10 bg-background/80 backdrop-blur-sm p-2 rounded-2xl border border-border/50 shadow-sm">
          <button
            onClick={onClose}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Editar compromiso</h1>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{commitment.name}</p>
          </div>
        </div>

        <CommitmentForm initial={commitment} />
      </div>
    </div>
  );
}
