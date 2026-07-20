import React, { useState } from 'react';
import { CreatePrayerForm } from './CreatePrayerForm';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, HelpingHand, Users } from 'lucide-react';
import type { MyPrayerRequestDTO } from '../types';

interface MyPrayersContainerProps {
  userId: string;
  activeRequests: MyPrayerRequestDTO[];
  archivedRequests: MyPrayerRequestDTO[];
  onCreateRequest: (message: string) => Promise<void>;
  onCancelRequest: (id: string) => Promise<void>;
}

export function MyPrayersContainer({
  userId,
  activeRequests,
  archivedRequests,
  onCreateRequest,
  onCancelRequest,
}: MyPrayersContainerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (message: string) => {
    setIsSubmitting(true);
    try {
      await onCreateRequest(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (value: string | null) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <section className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CreatePrayerForm
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        canCreateMore={activeRequests.length < 5}
        activeCount={activeRequests.length}
      />

      <div className="grid gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">Mis peticiones activas</h2>
          {activeRequests.length === 0 ? (
            <Card className="rounded-3xl p-5 border-border/50 shadow-sm bg-card">
              <p className="text-muted-foreground text-sm">Aún no tienes peticiones activas.</p>
            </Card>
          ) : (
            activeRequests.map((req) => (
              <Card key={req.id} className="rounded-3xl mb-4 border-border/50 shadow-sm bg-card">
                <CardContent className="p-5">
                  <p className="whitespace-pre-line text-sm text-foreground leading-6">
                    {req.message}
                  </p>
                  <div className="flex gap-2 mt-4 text-xs font-medium text-muted-foreground">
                    <span className="px-3 py-1.5 rounded-full border border-border/50 bg-background flex items-center gap-1.5">
                      <HelpingHand className="h-3.5 w-3.5 text-primary" /> {req.prayerCount} oraciones
                    </span>
                    <span className="px-3 py-1.5 rounded-full border border-border/50 bg-background flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-blue-500" /> {req.joinedCount} unidas
                    </span>
                    <span className="px-3 py-1.5 rounded-full border border-border/50 bg-background flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> {req.daysRemaining} días
                    </span>
                    <button 
                      onClick={() => onCancelRequest(req.id)}
                      className="ml-auto px-3 py-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Historial</h2>
          {archivedRequests.length === 0 ? (
            <Card className="rounded-3xl p-5 border-border/50 shadow-sm bg-card">
              <p className="text-muted-foreground text-sm">No hay peticiones archivadas.</p>
            </Card>
          ) : (
            archivedRequests.map((req) => (
              <Card key={req.id} className="rounded-3xl mb-4 border-border/50 bg-card">
                <CardContent className="p-5 opacity-75">
                  <p className="whitespace-pre-line text-sm text-foreground leading-6">
                    {req.message}
                  </p>
                  <div className="flex gap-4 mt-3 text-xs font-medium text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <HelpingHand className="h-3.5 w-3.5" /> {req.prayerCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {req.joinedCount}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50 font-medium">
                    {req.closeReason === 'CANCELLED' 
                      ? <span className="text-destructive">Cancelada el {formatDate(req.archivedAt)}</span> 
                      : <span className="text-emerald-500">Finalizada el {formatDate(req.archivedAt)}</span>
                    }
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
