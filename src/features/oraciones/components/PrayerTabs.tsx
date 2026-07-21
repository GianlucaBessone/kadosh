import React, { useMemo } from 'react';
import { PrayerCard } from './PrayerCard';
import type { PrayerRequestDTO } from '../types';
import { Card } from '@/components/ui/card';

type TabType = 'pendientes' | 'acompanadas' | 'no_acompanadas';

interface PrayerTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  pendingRequests: PrayerRequestDTO[];
  prayedRequests: PrayerRequestDTO[];
  unaccompaniedRequests: PrayerRequestDTO[];
  accompaniedRequests: PrayerRequestDTO[];
  onPray: (id: string) => void;
  onJoin: (id: string) => void;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  isProcessingId: string | null;
}

export function PrayerTabs({
  activeTab,
  onTabChange,
  pendingRequests,
  prayedRequests,
  unaccompaniedRequests,
  accompaniedRequests,
  onPray,
  onJoin,
  expandedId,
  onToggleExpand,
  isProcessingId,
}: PrayerTabsProps) {
  // Sort and filter logic based on the specs
  const lists = useMemo(() => {
    // "Pendientes": Not prayed by user, but has at least one join/pray from anyone
    const pendientes = pendingRequests
      .filter((req) => req.joinedCount > 0 || req.prayerCount > 0)
      .sort((a, b) => a.joinedCount - b.joinedCount);

    // "No acompañadas": Not prayed by user, with 0 joins and 0 prayers
    const noAcompanadas = pendingRequests
      .filter((req) => req.joinedCount === 0 && req.prayerCount === 0)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // "Acompañadas": Prayed by user
    const acompanadas = prayedRequests;

    return { pendientes, noAcompanadas, acompanadas };
  }, [pendingRequests, prayedRequests]);

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'pendientes', label: 'Pendientes', count: lists.pendientes.length },
    { id: 'no_acompanadas', label: 'No Acompañadas', count: lists.noAcompanadas.length },
    { id: 'acompanadas', label: 'Acompañadas', count: lists.acompanadas.length },
  ];

  const currentList =
    activeTab === 'pendientes'
      ? lists.pendientes
      : activeTab === 'no_acompanadas'
      ? lists.noAcompanadas
      : lists.acompanadas;

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs Header */}
      <div
        className="flex overflow-x-auto hide-scrollbar border-b border-border/50"
        role="tablist"
        aria-label="Pestañas de peticiones comunitarias"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors border-b-2 outline-none focus-visible:bg-muted/40 ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {tab.label}{' '}
              <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="animate-in fade-in duration-300"
      >
        {currentList.length === 0 ? (
          <Card className="rounded-3xl p-8 text-center bg-card shadow-sm">
            <p className="text-muted-foreground">
              {activeTab === 'pendientes'
                ? 'No hay peticiones pendientes en este momento.'
                : activeTab === 'no_acompanadas'
                ? 'Todas las peticiones han recibido al menos una oración.'
                : 'Aún no has acompañado ninguna petición.'}
            </p>
          </Card>
        ) : (
          <div>
            {currentList.map((req) => (
              <PrayerCard
                key={req.id}
                request={req}
                isExpanded={expandedId === req.id}
                onToggleExpand={() => onToggleExpand(req.id)}
                onPray={onPray}
                onJoin={onJoin}
                isProcessingId={isProcessingId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
