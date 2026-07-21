import React from 'react';
import { Button } from '@/components/ui/button';
import { HelpingHand, Clock, Users } from 'lucide-react';
import type { PrayerRequestDTO } from '../types';

interface PrayerCardProps {
  request: PrayerRequestDTO;
  onPray: (id: string) => void;
  onJoin: (id: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  // This helps to disable buttons while processing
  isProcessingId: string | null;
}

export const PrayerCard = React.memo(function PrayerCard({
  request,
  onPray,
  onJoin,
  isExpanded,
  onToggleExpand,
  isProcessingId,
}: PrayerCardProps) {
  const isProcessing = isProcessingId === request.id;

  const compactMessage = (msg: string) => {
    return msg.length > 120 ? `${msg.slice(0, 120).trim()}…` : msg;
  };

  const formatDate = (value: string | null) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="mb-4 rounded-3xl border border-border/50 bg-card overflow-hidden shadow-sm transition-shadow hover:shadow-md">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleExpand();
          }
        }}
        aria-expanded={isExpanded}
        aria-label={`Petición de ${request.authorDisplayName}`}
        className="w-full text-left cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <span className="font-semibold">{request.authorInitial}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {request.authorDisplayName}
              </p>
              <p className="text-xs text-muted-foreground">Pide oración por</p>
            </div>
          </div>

          <p className="text-sm text-foreground leading-6 line-clamp-3">
            {compactMessage(request.message)}
          </p>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border/50 px-2 py-1 inline-flex items-center gap-1.5 bg-background">
              <HelpingHand className="h-3.5 w-3.5 text-primary" />
              {request.prayerCount}
            </span>
            <span className="rounded-full border border-border/50 px-2 py-1 inline-flex items-center gap-1.5 bg-background">
              <Users className="h-3.5 w-3.5 text-blue-500" />
              {request.joinedCount}
            </span>
            <span className="rounded-full border border-border/50 px-2 py-1 inline-flex items-center gap-1.5 bg-background">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              {request.daysRemaining} días
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {!request.hasPrayed ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isProcessing}
                onClick={(event) => {
                  event.stopPropagation();
                  onPray(request.id);
                }}
                className="rounded-full flex-1 sm:flex-none transition-transform active:scale-95"
              >
                <HelpingHand className="mr-2 h-4 w-4" />
                He orado
              </Button>
            ) : (
              <span className="text-xs font-semibold text-primary flex items-center gap-1">
                <HelpingHand className="h-4 w-4" /> Ya oraste
              </span>
            )}

            {!request.hasJoined ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isProcessing}
                onClick={(event) => {
                  event.stopPropagation();
                  onJoin(request.id);
                }}
                className="rounded-full flex-1 sm:flex-none transition-transform active:scale-95"
              >
                <Users className="mr-2 h-4 w-4" />
                Unirse
              </Button>
            ) : (
              <span className="text-xs font-semibold text-blue-500 flex items-center gap-1">
                <Users className="h-4 w-4" /> Te uniste
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border/50 bg-background/50 px-5 py-4 text-sm text-muted-foreground">
            <p className="mb-3 whitespace-pre-line">{request.message}</p>

            <div className="grid gap-2 sm:grid-cols-3 mt-4">
              <div className="rounded-2xl bg-muted/40 p-3 text-xs flex flex-col gap-1">
                <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Fecha</span>
                <span className="font-medium text-foreground">{formatDate(request.createdAt)}</span>
              </div>

              <div className="rounded-2xl bg-muted/40 p-3 text-xs flex flex-col gap-1">
                <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Oraciones</span>
                <span className="font-medium text-foreground">{request.prayerCount} recibidas</span>
              </div>

              <div className="rounded-2xl bg-muted/40 p-3 text-xs flex flex-col gap-1">
                <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Unidos</span>
                <span className="font-medium text-foreground">{request.joinedCount} acompañando</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
