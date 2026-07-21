import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePrayerRealtime } from '@/features/oraciones/services/usePrayerRealtime';
import * as supabaseClient from '@/utils/supabase/client';
import * as prayerSyncPipeline from '@/features/oraciones/services/prayerSyncPipeline';

describe('usePrayerRealtime', () => {
  let subscribeMock: any;
  let onMock: any;
  let channelMock: any;
  let removeChannelMock: any;
  let processInteractionSpy: any;
  let processRequestSpy: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    subscribeMock = vi.fn().mockReturnValue({ subscribe: vi.fn() });
    onMock = vi.fn().mockReturnValue({ subscribe: subscribeMock });
    channelMock = vi.fn().mockReturnValue({ on: onMock });
    removeChannelMock = vi.fn();
    
    vi.spyOn(supabaseClient, 'createClient').mockReturnValue({
      channel: channelMock,
      removeChannel: removeChannelMock
    } as any);

    processInteractionSpy = vi.spyOn(prayerSyncPipeline, 'processIncomingPrayerInteraction').mockResolvedValue();
    processRequestSpy = vi.spyOn(prayerSyncPipeline, 'processIncomingPrayerRequests').mockResolvedValue();
  });

  it('no hace nada si userId es nulo', () => {
    renderHook(() => usePrayerRealtime(null));
    expect(supabaseClient.createClient).not.toHaveBeenCalled();
  });

  it('se suscribe a PrayerInteraction y PrayerRequest si hay userId', () => {
    renderHook(() => usePrayerRealtime('user-1'));
    
    expect(channelMock).toHaveBeenCalledWith('public:PrayerInteraction');
    expect(channelMock).toHaveBeenCalledWith('public:PrayerRequest');
    expect(onMock).toHaveBeenCalledTimes(2); // Una vez por cada canal encadenado
  });

  it('limpia los canales al desmontar', () => {
    const { unmount } = renderHook(() => usePrayerRealtime('user-1'));
    unmount();
    
    expect(removeChannelMock).toHaveBeenCalledTimes(2);
  });

  it('procesa PrayerInteraction si es de otro usuario', () => {
    renderHook(() => usePrayerRealtime('user-1'));
    
    const interactionCallback = onMock.mock.calls.find((call: any[]) => call[0] === 'postgres_changes' && call[1].table === 'PrayerInteraction')[2];
    
    interactionCallback({
      new: { id: 'int-1', userId: 'user-2' }
    });
    
    expect(processInteractionSpy).toHaveBeenCalledWith({ id: 'int-1', userId: 'user-2' });
  });

  it('ignora PrayerInteraction si es del mismo usuario', () => {
    renderHook(() => usePrayerRealtime('user-1'));
    
    const interactionCallback = onMock.mock.calls.find((call: any[]) => call[0] === 'postgres_changes' && call[1].table === 'PrayerInteraction')[2];
    
    interactionCallback({
      new: { id: 'int-1', userId: 'user-1' }
    });
    
    expect(processInteractionSpy).not.toHaveBeenCalled();
  });

  it('procesa PrayerRequest si es de otro usuario y no tiene workspaceId', async () => {
    renderHook(() => usePrayerRealtime('user-1'));
    
    const requestCallback = onMock.mock.calls.find((call: any[]) => call[0] === 'postgres_changes' && call[1].table === 'PrayerRequest')[2];
    
    requestCallback({
      new: { id: 'req-1', userId: 'user-2', message: 'Test', prayerCount: 0 }
    });
    
    // Wait for dynamic import to resolve
    await new Promise(process.nextTick);
    
    expect(processRequestSpy).toHaveBeenCalledWith([expect.objectContaining({ id: 'req-1', message: 'Test' })]);
  });
});
