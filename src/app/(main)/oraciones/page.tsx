'use client';

import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Clock, HelpingHand } from 'lucide-react';
import { OracionesViewSelector } from '@/features/oraciones/components/OracionesViewSelector';
import type { MyPrayerRequestDTO, OracionesView, PrayerRequestDTO } from '@/features/oraciones/types';
import { WorkspaceQueries } from '@/store/queries/WorkspaceQueries';
import {
  createPrayerRequest,
  prayAllPendingRequests,
  prayForRequest,
  useCommunityPrayerRequests,
  useMyPrayerRequests
} from '@/features/oraciones/services/prayerRequestService';
import { PrayerSection } from '@/components/asistencia/PrayerSection';

const MAX_MESSAGE_LENGTH = 500;

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function compactMessage(message: string) {
  return message.length > 120 ? `${message.slice(0, 120).trim()}…` : message;
}

export default function OracionesPage() {
  const user = useLiveQuery(() => db.users.orderBy('id').first());
  const workspaceId = WorkspaceQueries.useActiveWorkspaceId();

  const [currentView, setCurrentView] = useState<OracionesView>('pedir');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const { active: activeRequests, archived: archivedRequests } = useMyPrayerRequests(user?.id ?? null, workspaceId);
  const { pending: communityPending, prayed: communityPrayed, summary: communitySummary } = useCommunityPrayerRequests(user?.id ?? null, workspaceId);

  const canSubmit = message.trim().length > 0 && message.trim().length <= MAX_MESSAGE_LENGTH;
  const remainingChars = MAX_MESSAGE_LENGTH - message.length;


  async function handleCreateRequest() {
    if (!user || !workspaceId || !canSubmit) return;
    setIsSubmitting(true);
    try {
      await createPrayerRequest({ userId: user.id, workspaceId, message: message.trim() });
      toast.success('Tu petición fue publicada. Gracias por compartirla en comunidad.');
      setMessage('');
      setCurrentView('pedir');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo publicar tu petición. Intenta nuevamente más tarde.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePray(requestId: string) {
    if (!user || !workspaceId) return;
    try {
      await prayForRequest(requestId, user.id, workspaceId);
      toast.success('Gracias por acompañar en oración. Tu apoyo fue registrado.');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo registrar la oración. Intenta nuevamente.');
    }
  }

  async function handlePrayAll() {
    if (!user || !workspaceId) return;
    try {
      const count = await prayAllPendingRequests(user.id, workspaceId);
      toast.success(
        count === 0
          ? 'No hay peticiones pendientes por las que puedas orar ahora mismo.'
          : `Registramos tu oración en ${count} peticiones.`
      );
      setExpandedRequestId(null);
    } catch (error) {
      console.error(error);
      toast.error('No se pudo registrar la oración por todos. Intenta nuevamente.');
    }
  }

  const activeCountLabel = useMemo(() => {
    if (communitySummary.activeCount === 0) return 'No hay peticiones activas';
    return `${communitySummary.activeCount} peticiones activas`;
  }, [communitySummary.activeCount]);

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mt-2 mb-2">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <HelpingHand className="w-7 h-7" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Oraciones</h1>
          <p className="text-sm text-muted-foreground">Comparte necesidades y acompaña a la comunidad en oración</p>
        </div>
      </div>

      <div className="rounded-3xl border border-border/50 bg-background/80 p-5">
        <blockquote className="text-sm font-medium italic text-foreground/90 leading-relaxed text-center">
          “Oren en el Espíritu en todo momento, con peticiones y ruegos. Manténganse alertas y perseveren en oración por todos los creyentes.”
        </blockquote>
        <div className="mt-4 text-center">
          <span className="text-xs text-primary/70 font-semibold uppercase">Efesios 6:18</span>
        </div>
      </div>

      <OracionesViewSelector onSelect={setCurrentView} />

      {currentView === 'hub' && (
        <section className="flex flex-col gap-6">
          <PrayerSection />
        </section>
      )}

      {currentView === 'pedir' && (
        <section className="flex flex-col gap-6">
          <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
            <CardContent className="p-5 flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Pedir oración</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Comparte brevemente tu necesidad para que la comunidad pueda acompañarte en oración.
                </p>
              </div>

              <div className="rounded-3xl border border-border/50 bg-background/80 p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">No compartas información privada.</p>
                <ul className="mt-2 space-y-1 list-disc pl-4">
                  <li>dirección</li>
                  <li>teléfono</li>
                  <li>correo electrónico</li>
                  <li>nombres completos</li>
                  <li>datos bancarios</li>
                  <li>cualquier información que permita identificarte</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prayer-message">Motivo de oración</Label>
                <textarea
                  id="prayer-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={6}
                  maxLength={MAX_MESSAGE_LENGTH}
                  className="w-full min-h-[160px] resize-none rounded-3xl border border-border/50 bg-background px-4 py-3 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                  placeholder="Escribe tu necesidad aquí..."
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Máximo {MAX_MESSAGE_LENGTH} caracteres</span>
                  <span>{remainingChars} caracteres restantes</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Al publicar, tu petición permanecerá activa por 7 días y será archivada automáticamente.
                </p>
                <Button
                  onClick={handleCreateRequest}
                  disabled={!canSubmit || isSubmitting}
                  className="rounded-3xl"
                >
                  {isSubmitting ? 'Publicando...' : 'Publicar petición'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Peticiones activas</h2>
                  <p className="text-sm text-muted-foreground">Tus solicitudes actuales en oración.</p>
                </div>
              </div>

              <div className="grid gap-4">
                {activeRequests.length === 0 ? (
                  <Card className="rounded-3xl border-border/50 shadow-sm p-5">
                    <CardContent className="p-0">
                      <p className="text-sm text-muted-foreground">Aún no tienes peticiones activas. Comparte tu necesidad para que la comunidad ore contigo.</p>
                    </CardContent>
                  </Card>
                ) : (
                  activeRequests.map((request) => (
                    <Card key={request.id} className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
                      <CardContent className="p-5 space-y-3">
                        <p className="text-sm leading-6 text-foreground whitespace-pre-line">{request.message}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="rounded-full border border-border/50 px-2 py-1 inline-flex items-center gap-2">
                            <HelpingHand className="h-4 w-4 text-primary" />
                            {request.prayerCount}
                          </span>
                          <span className="rounded-full border border-border/50 px-2 py-1 inline-flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {request.daysRemaining} días restantes
                          </span>
                          <span className="rounded-full border border-border/50 px-2 py-1">Activo</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Historial</h2>
                  <p className="text-sm text-muted-foreground">Peticiones cerradas que permanecen en tu historial.</p>
                </div>
              </div>

              <div className="grid gap-4">
                {archivedRequests.length === 0 ? (
                  <Card className="rounded-3xl border-border/50 shadow-sm p-5">
                    <CardContent className="p-0">
                      <p className="text-sm text-muted-foreground">No hay solicitudes archivadas en este momento.</p>
                    </CardContent>
                  </Card>
                ) : (
                  archivedRequests.map((request) => (
                    <Card key={request.id} className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
                      <CardContent className="p-5 space-y-3">
                        <p className="text-sm leading-6 text-foreground whitespace-pre-line">{request.message}</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <span className="rounded-full border border-border/50 px-2 py-1 text-xs text-muted-foreground inline-flex items-center gap-2">
                            <HelpingHand className="h-3.5 w-3.5 text-primary" />
                            {request.prayerCount} oraciones
                          </span>
                          <span className="rounded-full border border-border/50 px-2 py-1 text-xs text-muted-foreground">Cerrada {formatDate(request.archivedAt)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {currentView === 'orar' && (
        <section className="flex flex-col gap-6">
          <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                    <HelpingHand className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Orar por alguien</p>
                    <p className="text-sm text-muted-foreground">Tu oración puede acompañar a otros hermanos en sus necesidades.</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-border/50 bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Activas</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{communitySummary.activeCount}</p>
                </div>
                <div className="rounded-3xl border border-border/50 bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Pendientes</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{communitySummary.pendingCount}</p>
                </div>
                <div className="rounded-3xl border border-border/50 bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Ya acompañadas</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{communitySummary.prayedCount}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{activeCountLabel}</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="rounded-3xl" variant="secondary">
                      <HelpingHand className="mr-2 h-4 w-4" />
                      Orar por todos
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Orar por todos</DialogTitle>
                      <DialogDescription>
                        ¿Deseas acompañar en oración a todas las personas que actualmente tienen una petición activa? Esta acción registrará tu oración en cada petición que aún no hayas orado.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 flex items-center justify-end gap-2">
                      <DialogClose asChild>
                        <Button variant="outline" type="button">
                          Cancelar
                        </Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button type="button" onClick={handlePrayAll}>
                          Aceptar
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Pendientes</h2>
                  <p className="text-sm text-muted-foreground">Peticiones que aún no has acompañado en oración.</p>
                </div>
              </div>
              <div className="grid gap-4">
                {communityPending.length === 0 ? (
                  <Card className="rounded-3xl border-border/50 shadow-sm p-5">
                    <CardContent className="p-0">
                      <p className="text-sm text-muted-foreground">No hay peticiones pendientes por ahora.</p>
                    </CardContent>
                  </Card>
                ) : (
                  communityPending.map((request) => (
                    <div key={request.id} className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setExpandedRequestId(expandedRequestId === request.id ? null : request.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setExpandedRequestId(expandedRequestId === request.id ? null : request.id);
                          }
                        }}
                        className="w-full text-left cursor-pointer"
                      >
                        <div className="p-5 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                              {request.authorInitial}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{request.authorDisplayName}</p>
                              <p className="text-xs text-muted-foreground">Pide oración por</p>
                            </div>
                          </div>

                          <p className="text-sm text-foreground leading-6 line-clamp-3">{compactMessage(request.message)}</p>

                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="rounded-full border border-border/50 px-2 py-1 inline-flex items-center gap-2">
                              <HelpingHand className="h-4 w-4 text-primary" />
                              {request.prayerCount}
                            </span>
                            <span className="rounded-full border border-border/50 px-2 py-1 inline-flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {request.daysRemaining} días
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-xs font-semibold text-foreground">{request.hasPrayed ? 'Ya oraste esta petición' : 'Aún no has orado'}</span>
                            {!request.hasPrayed && (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handlePray(request.id);
                                }}
                                className="rounded-3xl"
                              >
                                <HelpingHand className="mr-2 h-4 w-4" /> He orado por {request.authorDisplayName}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {expandedRequestId === request.id && (
                        <div className="border-t border-border/50 bg-background/70 px-5 py-4 text-sm text-muted-foreground">
                          <p className="mb-3 whitespace-pre-line">{request.message}</p>
                          <div className="grid gap-2 sm:grid-cols-3">
                            <div className="rounded-2xl bg-muted/40 p-3 text-xs">Fecha: {formatDate(request.createdAt)}</div>
                            <div className="rounded-2xl bg-muted/40 p-3 text-xs">Días restantes: {request.daysRemaining}</div>
                            <div className="rounded-2xl bg-muted/40 p-3 text-xs">Oraciones: {request.prayerCount}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Ya oré</h2>
                  <p className="text-sm text-muted-foreground">Peticiones que ya acompañaste en oración recientemente.</p>
                </div>
              </div>
              <div className="grid gap-4">
                {communityPrayed.length === 0 ? (
                  <Card className="rounded-3xl border-border/50 shadow-sm p-5">
                    <CardContent className="p-0">
                      <p className="text-sm text-muted-foreground">Aún no has orado por ninguna petición.</p>
                    </CardContent>
                  </Card>
                ) : (
                  communityPrayed.map((request) => (
                    <Card key={request.id} className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                            {request.authorInitial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{request.authorDisplayName}</p>
                            <p className="text-xs text-muted-foreground">Pide oración por</p>
                          </div>
                        </div>
                        <p className="text-sm text-foreground leading-6 line-clamp-3">{compactMessage(request.message)}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="rounded-full border border-border/50 px-2 py-1 inline-flex items-center gap-2">
                            <HelpingHand className="h-4 w-4 text-primary" />
                            {request.prayerCount}
                          </span>
                          <span className="rounded-full border border-border/50 px-2 py-1 inline-flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {request.daysRemaining} días
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
