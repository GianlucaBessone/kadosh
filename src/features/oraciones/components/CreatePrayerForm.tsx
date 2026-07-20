import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface CreatePrayerFormProps {
  onSubmit: (message: string) => Promise<void>;
  isSubmitting: boolean;
  canCreateMore: boolean;
  activeCount: number;
}

const MAX_MESSAGE_LENGTH = 500;

export const CreatePrayerForm = React.memo(function CreatePrayerForm({
  onSubmit,
  isSubmitting,
  canCreateMore,
  activeCount,
}: CreatePrayerFormProps) {
  const [message, setMessage] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  const canSubmit =
    canCreateMore && message.trim().length > 0 && message.trim().length <= MAX_MESSAGE_LENGTH;
  const remainingChars = MAX_MESSAGE_LENGTH - message.length;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    
    // Privacy Scanner Phase 0 mock check
    const suspiciousPatterns = /[0-9]{8,}|@.*\.|calle|avenida/i;
    if (suspiciousPatterns.test(message) && !showWarning) {
      setShowWarning(true);
      return;
    }

    await onSubmit(message.trim());
    setMessage('');
    setShowWarning(false);
  };

  return (
    <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
      <CardContent className="p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Pedir oración</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Comparte brevemente tu petición para que la comunidad pueda acompañarte en oración.
          </p>
        </div>

        <div className="rounded-3xl border border-border/50 bg-background/80 p-4 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">
            No compartas teléfonos, direcciones, documentos, nombres completos u otros datos personales.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prayer-message">Motivo de oración</Label>
          <textarea
            id="prayer-message"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setShowWarning(false);
            }}
            rows={6}
            maxLength={MAX_MESSAGE_LENGTH}
            disabled={!canCreateMore || isSubmitting}
            className="w-full min-h-[160px] resize-none rounded-3xl border border-border/50 bg-background px-4 py-3 text-sm text-foreground shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
            placeholder={
              canCreateMore
                ? 'Escribe tu petición aquí...'
                : 'Has alcanzado el límite de 5 peticiones activas.'
            }
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Máximo {MAX_MESSAGE_LENGTH} caracteres</span>
            <span>{remainingChars} restantes</span>
          </div>
        </div>

        {showWarning && (
          <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <p className="font-semibold">⚠️ Revisar Privacidad</p>
            <p className="mt-1 text-xs">
              Hemos detectado posible información personal en tu petición. Revisa no haber incluido
              números de teléfono, documentos o direcciones. Si estás seguro de que está bien,
              presiona publicar nuevamente.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-medium">
            {activeCount} / 5 peticiones activas
          </p>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            variant={showWarning ? 'destructive' : 'default'}
            className="rounded-3xl w-full sm:w-auto transition-all active:scale-95"
          >
            {isSubmitting
              ? 'Publicando...'
              : showWarning
              ? 'Publicar de todas formas'
              : 'Publicar petición'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
