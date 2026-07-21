import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FinishedPrayerModal } from '@/features/oraciones/components/FinishedPrayerModal';

describe('FinishedPrayerModal Integration', () => {
  it('no renderiza nada si isOpen es false', () => {
    render(<FinishedPrayerModal isOpen={false} onClose={vi.fn()} prayerCount={5} joinedCount={3} />);
    
    expect(screen.queryByText('Tiempo de Oración Concluido')).not.toBeInTheDocument();
  });

  it('renderiza correctamente el modal con los contadores', () => {
    render(<FinishedPrayerModal isOpen={true} onClose={vi.fn()} prayerCount={10} joinedCount={5} />);
    
    expect(screen.getByText('Tiempo de Oración Concluido')).toBeInTheDocument();
    
    // Contadores
    expect(screen.getByText('10')).toBeInTheDocument(); // Oraciones
    expect(screen.getByText('5')).toBeInTheDocument();  // Acompañantes
    
    // Versículo
    expect(screen.getByText('1 Timoteo 2:1')).toBeInTheDocument();
  });

  it('llama a onClose al presionar el botón de cerrar', () => {
    const onCloseMock = vi.fn();
    render(<FinishedPrayerModal isOpen={true} onClose={onCloseMock} prayerCount={10} joinedCount={5} />);
    
    const closeBtn = screen.getByRole('button', { name: /Cerrar y seguir confiando/i });
    fireEvent.click(closeBtn);
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
