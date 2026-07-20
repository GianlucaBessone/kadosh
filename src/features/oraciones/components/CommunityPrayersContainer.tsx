import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HandHeartIcon } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PrayerTabs } from './PrayerTabs';
import type { CommunityPrayerSummary, PrayerRequestDTO } from '../types';

interface CommunityPrayersContainerProps {
  userId: string;
  pendingRequests: PrayerRequestDTO[];
  prayedRequests: PrayerRequestDTO[];
  unaccompaniedRequests: PrayerRequestDTO[];
  accompaniedRequests: PrayerRequestDTO[];
  summary: CommunityPrayerSummary;
  onPray: (id: string) => Promise<void>;
  onJoin: (id: string) => Promise<void>;
  onPrayAll: () => Promise<void>;
  canPrayAll: boolean; // limit 1 per day
}

export function CommunityPrayersContainer({
  pendingRequests,
  prayedRequests,
  unaccompaniedRequests,
  accompaniedRequests,
  summary,
  onPray,
  onJoin,
  onPrayAll,
  canPrayAll,
}: CommunityPrayersContainerProps) {
  const [activeTab, setActiveTab] = useState<'pendientes' | 'acompanadas' | 'no_acompanadas'>('pendientes');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  const handleToggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handlePray = async (id: string) => {
    setIsProcessingId(id);
    try {
      await onPray(id);
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleJoin = async (id: string) => {
    setIsProcessingId(id);
    try {
      await onJoin(id);
    } finally {
      setIsProcessingId(null);
    }
  };

  return (
    <section className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden bg-card">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <HandHeartIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-lg">Orar por la comunidad</p>
              <p className="text-sm text-muted-foreground">Acompaña a otros hermanos en sus peticiones</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-border/50 bg-background/50 p-4 text-center">
              <p className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground font-semibold">Activas</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1 text-foreground">{summary.activeCount}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/50 p-4 text-center">
              <p className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground font-semibold">Pendientes</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1 text-foreground">{summary.pendingCount}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/50 p-4 text-center">
              <p className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground font-semibold">Completas</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1 text-foreground">{summary.accompaniedCount}</p>
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="rounded-full w-full font-medium h-12 transition-all active:scale-[0.98]"
                variant="secondary"
                disabled={!canPrayAll || summary.pendingCount === 0}
              >
                <HandHeartIcon className="mr-2 h-5 w-5" />
                {canPrayAll ? 'Orar por todas las pendientes' : 'Ya oraste por todas hoy'}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-[2rem] p-6">
              <DialogHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                  <HandHeartIcon className="w-6 h-6 text-primary" />
                </div>
                <DialogTitle className="text-center text-xl">Orar por todas</DialogTitle>
                <DialogDescription className="text-center">
                  Esto registrará tu oración en todas las peticiones pendientes que aún no hayas acompañado. Solo puedes hacer esto una vez al día.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="sm:justify-center flex flex-col sm:flex-row gap-2 mt-4">
                <DialogClose asChild>
                  <Button variant="outline" className="rounded-full flex-1 h-11">Cancelar</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button onClick={onPrayAll} className="rounded-full flex-1 h-11">Sí, orar por todas</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <PrayerTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingRequests={pendingRequests}
        prayedRequests={prayedRequests}
        unaccompaniedRequests={unaccompaniedRequests}
        accompaniedRequests={accompaniedRequests}
        onPray={handlePray}
        onJoin={handleJoin}
        expandedId={expandedId}
        onToggleExpand={handleToggleExpand}
        isProcessingId={isProcessingId}
      />
    </section>
  );
}
