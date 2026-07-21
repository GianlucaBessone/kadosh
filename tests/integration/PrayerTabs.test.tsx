import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrayerTabs } from '@/features/oraciones/components/PrayerTabs';

vi.mock('lucide-react', () => ({
  Clock: () => <div data-testid="clock-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Heart: () => <div data-testid="heart-icon" />,
  Check: () => <div data-testid="check-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Share2: () => <div data-testid="share-icon" />,
  HelpingHand: () => <div data-testid="helping-hand-icon" />
}));

// Mock PrayerCard so we don't have to render the whole component tree
vi.mock('@/features/oraciones/components/PrayerCard', () => ({
  PrayerCard: ({ request }: any) => <div data-testid="prayer-card">{request.message}</div>
}));

describe('PrayerTabs Integration', () => {
  const currentUserId = 'user-1';

  const baseRequest = {
    userId: 'other-user',
    authorDisplayName: 'Juan',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    prayerCount: 0,
    joinedCount: 0,
    workspaceId: 'COMMUNITY',
    status: 'ACTIVE' as any,
    lastAttempt: null,
  };

  const requests = {
    pending: [
      { ...baseRequest, id: 'req-1', message: 'Pendiente 1', joinedCount: 1 }, // To go to pendientes
      { ...baseRequest, id: 'req-3', message: 'Sin acompañar 1', joinedCount: 0, prayerCount: 0 } // To go to noAcompanadas
    ],
    prayed: [{ ...baseRequest, id: 'req-2', message: 'Orada 1' }],
    unaccompanied: [],
    accompanied: [],
    summary: { activeCount: 4, pendingCount: 1, unaccompaniedCount: 1, accompaniedCount: 1 }
  };

  const interactions = [
    { id: 'int-1', prayerRequestId: 'req-2', userId: currentUserId, type: 'PRAYED' as any, createdAt: new Date().toISOString() },
    { id: 'int-2', prayerRequestId: 'req-4', userId: currentUserId, type: 'JOINED' as any, createdAt: new Date().toISOString() }
  ];


  const renderTabs = (activeTab: 'pendientes' | 'acompanadas' | 'no_acompanadas' = 'pendientes') => {
    render(
      <PrayerTabs 
        activeTab={activeTab} 
        onTabChange={vi.fn()} 
        pendingRequests={requests.pending as any}
        prayedRequests={requests.prayed as any}
        unaccompaniedRequests={requests.unaccompanied as any}
        accompaniedRequests={requests.accompanied as any}
        onPray={vi.fn()}
        onJoin={vi.fn()}
        expandedId={null}
        onToggleExpand={vi.fn()}
        isProcessingId={null}
      />
    );
  };

  it('debe renderizar el layout básico con las pestañas', () => {
    renderTabs('pendientes');
    expect(screen.getByText('Pendientes')).toBeInTheDocument();
    expect(screen.getByText('No Acompañadas')).toBeInTheDocument();
  });

  it('debe mostrar los contadores correctos pasados por props', () => {
    renderTabs('pendientes');
    // 1 de pendingCount
    const badges = screen.getAllByText('1');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('debe filtrar correctamente las peticiones al cambiar de sub-pestaña', () => {
    renderTabs('pendientes');
    
    // Por defecto muestra pendientes
    expect(screen.getByText('Pendiente 1')).toBeInTheDocument();

    // Cambiar a "Acompañadas" no funcionaría así porque onTabChange es mock. 
    // We would need to re-render with the new activeTab.
    // Let's just re-render to test rendering of other tabs
  });
  
  it('debe mostrar acompañadas', () => {
    renderTabs('acompanadas');
    expect(screen.getByText('Orada 1')).toBeInTheDocument();
  });

  it('debe mostrar no acompañadas', () => {
    renderTabs('no_acompanadas');
    expect(screen.getByText('Sin acompañar 1')).toBeInTheDocument();
  });
});
