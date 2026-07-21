import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreatePrayerForm } from '@/features/oraciones/components/CreatePrayerForm';

describe('CreatePrayerForm Integration', () => {
  let onSubmitMock: any;

  beforeEach(() => {
    onSubmitMock = vi.fn().mockResolvedValue(undefined);
  });

  it('renderiza correctamente', () => {
    render(<CreatePrayerForm onSubmit={onSubmitMock} isSubmitting={false} canCreateMore={true} activeCount={0} />);
    
    expect(screen.getByText('Pedir oración')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Publicar petición/i })).toBeInTheDocument();
  });

  it('el botón está deshabilitado si canCreateMore es false', () => {
    render(<CreatePrayerForm onSubmit={onSubmitMock} isSubmitting={false} canCreateMore={false} activeCount={3} />);
    
    const button = screen.getByRole('button', { name: /Publicar petición/i });
    expect(button).toBeDisabled();
  });

  it('el botón está deshabilitado si está enviando (isSubmitting)', () => {
    render(<CreatePrayerForm onSubmit={onSubmitMock} isSubmitting={true} canCreateMore={true} activeCount={0} />);
    
    const button = screen.getByRole('button', { name: /Publicando/i });
    expect(button).toBeDisabled();
  });

  it('el botón está deshabilitado si el mensaje está vacío', () => {
    render(<CreatePrayerForm onSubmit={onSubmitMock} isSubmitting={false} canCreateMore={true} activeCount={0} />);
    
    const button = screen.getByRole('button', { name: /Publicar petición/i });
    expect(button).toBeDisabled();
  });

  it('habilita el botón si el mensaje es válido', () => {
    render(<CreatePrayerForm onSubmit={onSubmitMock} isSubmitting={false} canCreateMore={true} activeCount={0} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Una petición válida' } });
    
    const button = screen.getByRole('button', { name: /Publicar petición/i });
    expect(button).not.toBeDisabled();
  });

  it('llama a onSubmit con el mensaje al clickear y limpia el input', async () => {
    render(<CreatePrayerForm onSubmit={onSubmitMock} isSubmitting={false} canCreateMore={true} activeCount={0} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '  Por salud  ' } }); // Con espacios
    
    const button = screen.getByRole('button', { name: /Publicar petición/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith('Por salud');
      expect(input).toHaveValue(''); // Limpia
    });
  });

  it('muestra advertencia si hay patrones sospechosos (privacidad)', async () => {
    render(<CreatePrayerForm onSubmit={onSubmitMock} isSubmitting={false} canCreateMore={true} activeCount={0} />);
    
    const input = screen.getByRole('textbox');
    // Regex `suspiciousPatterns = /[0-9]{8,}|@.*\.|calle|avenida/i;`
    fireEvent.change(input, { target: { value: 'Mi numero es 12345678' } }); 
    
    const button = screen.getByRole('button', { name: /Publicar petición/i });
    fireEvent.click(button);
    
    expect(onSubmitMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Hemos detectado posible información personal/i)).toBeInTheDocument();
  });
});
