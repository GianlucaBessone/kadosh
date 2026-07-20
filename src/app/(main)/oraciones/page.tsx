'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { HelpingHand } from 'lucide-react';
import { toast } from 'sonner';

import { OracionesViewSelector } from '@/features/oraciones/components/OracionesViewSelector';
import { MyPrayersContainer } from '@/features/oraciones/components/MyPrayersContainer';
import { CommunityPrayersContainer } from '@/features/oraciones/components/CommunityPrayersContainer';
import { FinishedPrayerModal } from '@/features/oraciones/components/FinishedPrayerModal';
import { PrayerSection } from '@/components/asistencia/PrayerSection';

import {
  createPrayerRequest,
  prayAllPendingRequests,
  prayForRequest,
  joinPrayerRequest,
  cancelPrayerRequest,
  useCommunityPrayerRequests,
  useMyPrayerRequests,
} from '@/features/oraciones/services/prayerRequestService';

import type { OracionesView } from '@/features/oraciones/types';

export default function OracionesPage() {
  const user = useLiveQuery(() => db.users.orderBy('id').first());

  const [currentView, setCurrentView] = useState<OracionesView>('pedir');
  // State for Phase 1 Demo of the completed modal
  const [finishedModalData, setFinishedModalData] = useState<{
    isOpen: boolean;
    prayerCount: number;
    joinedCount: number;
  }>({ isOpen: false, prayerCount: 0, joinedCount: 0 });

  const { active: activeRequests, archived: archivedRequests } = useMyPrayerRequests(user?.id ?? null);
  
  const { pending: communityPending, prayed: communityPrayed, unaccompanied, accompanied, summary: communitySummary } =
    useCommunityPrayerRequests(user?.id ?? null);

  // In a future phase, we will track if user prayed for all today using local storage or db.
  // For now, we assume `true` so they can use it, unless pendingCount is 0.
  const canPrayAll = true;

  const handleCreateRequest = async (message: string) => {
    if (!user) return;
    try {
      await createPrayerRequest({ userId: user.id, message });
      toast.success('Tu petición fue publicada. Gracias por compartirla en comunidad.');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo publicar tu petición. Intenta nuevamente más tarde.');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!user) return;
    try {
      await cancelPrayerRequest(requestId, user.id);
      toast.success('Petición cancelada exitosamente.');
    } catch (error: any) {
      if (error?.message === 'La petición ya se encuentra archivada') return;
      console.error(error);
      toast.error('No se pudo cancelar la petición.');
    }
  };

  const handlePray = async (requestId: string) => {
    if (!user) return;
    try {
      await prayForRequest(requestId, user.id);
      toast.success('Gracias por acompañar en oración. Tu apoyo fue registrado.');
    } catch (error: any) {
      if (error?.message?.includes('Ya has realizado la acción')) return;
      console.error(error);
      toast.error('No se pudo registrar la oración. Intenta nuevamente.');
    }
  };

  const handleJoin = async (requestId: string) => {
    if (!user) return;
    try {
      await joinPrayerRequest(requestId, user.id);
      toast.success('Te has unido a esta petición. La acompañarás durante estos días.');
    } catch (error: any) {
      if (error?.message?.includes('Ya has realizado la acción')) return;
      console.error(error);
      toast.error('No se pudo registrar tu unión. Intenta nuevamente.');
    }
  };

  const handlePrayAll = async () => {
    if (!user) return;
    try {
      const count = await prayAllPendingRequests(user.id);
      toast.success(
        count === 0
          ? 'No hay peticiones pendientes por las que puedas orar ahora mismo.'
          : `Registramos tu oración en ${count} peticiones.`
      );
    } catch (error) {
      console.error(error);
      toast.error('No se pudo registrar la oración por todos. Intenta nuevamente.');
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6 w-full pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mt-2 mb-2">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <HelpingHand className="w-7 h-7" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Oraciones</h1>
          <p className="text-sm text-muted-foreground">Comparte peticiones y acompaña a la comunidad en oración</p>
        </div>
      </div>

      <div className="rounded-3xl border border-border/50 bg-background/80 p-5 shadow-sm">
        <blockquote className="text-sm font-medium italic text-foreground/90 leading-relaxed text-center">
          “Oren en el Espíritu en todo momento, con peticiones y ruegos. Manténganse alertas y perseveren en oración por todos los creyentes.”
        </blockquote>
        <div className="mt-4 text-center">
          <span className="text-xs text-primary/70 font-semibold uppercase tracking-widest">Efesios 6:18</span>
        </div>
      </div>

      <OracionesViewSelector onSelect={setCurrentView} />

      {currentView === 'hub' && <PrayerSection />}

      {currentView === 'pedir' && (
        <MyPrayersContainer
          userId={user.id}
          activeRequests={activeRequests}
          archivedRequests={archivedRequests}
          onCreateRequest={handleCreateRequest}
          onCancelRequest={handleCancelRequest}
        />
      )}

      {currentView === 'orar' && (
        <CommunityPrayersContainer
          userId={user.id}
          pendingRequests={communityPending ?? []}
          prayedRequests={communityPrayed ?? []}
          unaccompaniedRequests={unaccompanied ?? []}
          accompaniedRequests={accompanied ?? []}
          summary={communitySummary}
          onPray={handlePray}
          onJoin={handleJoin}
          onPrayAll={handlePrayAll}
          canPrayAll={canPrayAll}
        />
      )}

      {/* Phase 1: Modal UI prepared, logic triggers it in Phase 2/4 */}
      <FinishedPrayerModal
        isOpen={finishedModalData.isOpen}
        onClose={() => setFinishedModalData({ ...finishedModalData, isOpen: false })}
        prayerCount={finishedModalData.prayerCount}
        joinedCount={finishedModalData.joinedCount}
      />
    </div>
  );
}