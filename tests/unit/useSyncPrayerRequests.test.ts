import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSyncPrayerRequests } from '@/features/oraciones/services/prayerRequestService';
import * as prayerSyncPipeline from '@/features/oraciones/services/prayerSyncPipeline';

describe('useSyncPrayerRequests', () => {
  let processSpy: any;
  let fetchMock: any;
  
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    
    processSpy = vi.spyOn(prayerSyncPipeline, 'processIncomingPrayerRequests').mockResolvedValue();
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        pending: [{ id: 'req-1' }],
        prayed: [{ id: 'req-2' }]
      })
    });
    
    global.fetch = fetchMock;
    
    // Configurar visibility state
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('no hace nada si userId es nulo', () => {
    renderHook(() => useSyncPrayerRequests(null));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('hace un fetch inicial al montar el componente', async () => {
    renderHook(() => useSyncPrayerRequests('user-1'));
    
    expect(fetchMock).toHaveBeenCalledWith('/api/prayer-requests?scope=community&userId=user-1');
    
    // Advance next tick for the promise to resolve
    await vi.advanceTimersByTimeAsync(100);
    
    expect(processSpy).toHaveBeenCalledWith([
      { id: 'req-1', currentUserId: 'user-1' },
      { id: 'req-2', currentUserId: 'user-1' }
    ]);
  });

  it('hace fetch periódico cada 60 segundos', async () => {
    renderHook(() => useSyncPrayerRequests('user-1'));
    
    expect(fetchMock).toHaveBeenCalledTimes(1); // Inicial
    
    // Esperar 60 segundos
    await vi.advanceTimersByTimeAsync(60000);
    expect(fetchMock).toHaveBeenCalledTimes(2); // Intervalo
  });

  it('hace fetch al recuperar la visibilidad de la ventana', async () => {
    renderHook(() => useSyncPrayerRequests('user-1'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true
    });
    
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('hace fetch al volver a estar online', async () => {
    renderHook(() => useSyncPrayerRequests('user-1'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  
  it('maneja errores de red gracefully', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new Error('Network error'));
    
    renderHook(() => useSyncPrayerRequests('user-1'));
    
    await vi.advanceTimersByTimeAsync(100);
    
    expect(errorSpy).toHaveBeenCalledWith('Error fetching community prayers from API:', expect.any(Error));
    errorSpy.mockRestore();
  });
  
  it('maneja errores de servidor gracefully', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false });
    
    renderHook(() => useSyncPrayerRequests('user-1'));
    
    await vi.advanceTimersByTimeAsync(100);
    
    expect(processSpy).not.toHaveBeenCalled();
  });
});
