import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectPicker } from '@/components/ui/picker/select/SelectPicker';
import { Loader2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { toast } from 'sonner';

interface SupportFormProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType: string;
}

export function SupportForm({ isOpen, onClose, defaultType }: SupportFormProps) {
  const [type, setType] = useState(defaultType);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const user = useLiveQuery(() => db.users.orderBy('id').first());

  // Update type when defaultType changes
  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
    }
  }, [defaultType, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.isCloudLinked ? user.id : null,
          guestId: !user.isCloudLinked ? user.id : null,
          type,
          subject,
          description,
          appVersion: '0.1.0', // TODO: Get from config/package
          browser: navigator.userAgent,
          language: navigator.language,
          resolution: `${window.innerWidth}x${window.innerHeight}`,
        }),
      });

      if (!response.ok) throw new Error('Error al enviar solicitud');

      setSubmitted(true);
    } catch (error) {
      toast.error('Ocurrió un error al enviar tu solicitud. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSubmitted(false);
      setSubject('');
      setDescription('');
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="rounded-3xl max-w-md w-[90vw]">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <DialogTitle className="text-xl">¡Gracias!</DialogTitle>
            <DialogDescription className="text-base">
              Recibimos tu mensaje y lo revisaremos lo antes posible.
            </DialogDescription>
            <Button onClick={handleClose} className="mt-4 w-full rounded-xl">
              Cerrar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <DialogHeader>
              <DialogTitle>Obtener ayuda</DialogTitle>
              <DialogDescription>
                Cuéntanos cómo podemos ayudarte.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label htmlFor="type">Tipo</Label>
                <SelectPicker
                  value={type}
                  onChange={setType}
                  placeholder="Selecciona un tipo"
                  items={[
                    { value: 'BUG', label: 'Reportar un problema' },
                    { value: 'FEATURE', label: 'Solicitar una nueva función' },
                    { value: 'QUESTION', label: 'Hacer una consulta' }
                  ]}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="subject">Asunto</Label>
                <Input
                  id="subject"
                  required
                  placeholder="Resumen corto"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Descripción</Label>
                <textarea
                  id="description"
                  required
                  rows={4}
                  placeholder="Detalles..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>
            </div>

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading} className="w-full sm:w-auto rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !subject || !description} className="w-full sm:w-auto rounded-xl">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar mensaje
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
