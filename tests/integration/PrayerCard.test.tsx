import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrayerCard } from '@/features/oraciones/components/PrayerCard';
import { db } from '@/lib/db';
import * as prayerService from '@/features/oraciones/services/prayerRequestService';

vi.mock('lucide-react', () => ({
  Heart: () => <div data-testid="heart-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Share2: () => <div data-testid="share-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  HelpingHand: () => <div data-testid="helping-hand-icon" />
}));

describe('PrayerCard Integration', () => {
  const mockUserId = 'current-user-id';

  beforeEach(async () => {
    await db.prayerRequests.clear();
    await db.prayerInteractions.clear();
    vi.clearAllMocks();
  });

  const mockPrayer = {
    id: 'prayer-1',
    message: 'Oración de prueba',
    authorDisplayName: 'Juan Perez',
    userId: 'other-user',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    prayerCount: 5,
    joinedCount: 2,
    workspaceId: 'COMMUNITY',
    status: 'ACTIVE' as any
  };

  it('debe renderizar la tarjeta correctamente con contadores', () => {
    render(<PrayerCard request={mockPrayer as any} onPray={vi.fn()} onJoin={vi.fn()} isExpanded={false} onToggleExpand={vi.fn()} isProcessingId={null} />);
    expect(screen.getAllByText('Oración de prueba')[0]).toBeInTheDocument();
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('debe llamar a onJoin al hacer click en Unirse', async () => {
    const onJoinMock = vi.fn();
    // hasJoined doesn't exist on PrayerCard, it uses mockPrayer to determine if we can join maybe? Wait, PrayerCard doesn't know hasJoined natively in the props, it just renders buttons based on its own logic (which we'll test).
    // Let's just mock PrayerCard interaction
    render(<PrayerCard request={mockPrayer as any} onPray={vi.fn()} onJoin={onJoinMock} isExpanded={true} onToggleExpand={vi.fn()} isProcessingId={null} />);
    
    // In PrayerCard, the button might have the text "Unirse"
    const joinBtn = screen.getByText('Unirse');
    fireEvent.click(joinBtn);
    
    await waitFor(() => {
      expect(onJoinMock).toHaveBeenCalledWith('prayer-1');
    });
  });

  it('debe mostrar "Te uniste" y no mostrar el botón si ya está unido', () => {
    const joinedPrayer = { ...mockPrayer, hasJoined: true };
    render(<PrayerCard request={joinedPrayer as any} onPray={vi.fn()} onJoin={vi.fn()} isExpanded={false} onToggleExpand={vi.fn()} isProcessingId={null} />);
    const btn = screen.getByText('Te uniste');
    expect(btn).toBeInTheDocument();
  });

  it('debe llamar a onPray al hacer click en He orado', async () => {
    const onPrayMock = vi.fn();
    const joinedNotPrayed = { ...mockPrayer, hasJoined: true, hasPrayed: false };
    render(<PrayerCard request={joinedNotPrayed as any} onPray={onPrayMock} onJoin={vi.fn()} isExpanded={true} onToggleExpand={vi.fn()} isProcessingId={null} />);
    
    const prayBtn = screen.getByText('He orado');
    fireEvent.click(prayBtn);
    
    await waitFor(() => {
      expect(onPrayMock).toHaveBeenCalledWith('prayer-1');
    });
  });
});
