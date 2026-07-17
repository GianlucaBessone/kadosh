import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { toast } from 'sonner';

interface NPSFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NPSForm({ isOpen, onClose }: NPSFormProps) {
  const [score, setScore] = useState<number | null>(null);
  const [bestPart, setBestPart] = useState('');
  const [improvement, setImprovement] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const user = useLiveQuery(() => db.users.orderBy('id').first());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || score === null) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.isCloudLinked ? user.id : null,
          guestId: !user.isCloudLinked ? user.id : null,
          type: 'NPS',
          npsScore: score,
          bestPart,
          improvement,
        }),
      });

      if (!response.ok) throw new Error('Error al enviar calificación');

      setSubmitted(true);
    } catch {
      toast.error('Ocurrió un error al enviar tu calificación. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSubmitted(false);
      setStep(1);
      setScore(null);
      setBestPart('');
      setImprovement('');
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
              Valoramos tu tiempo y tus respuestas. Esto nos ayuda a mejorar KADOSH cada día.
            </DialogDescription>
            <Button onClick={handleClose} className="mt-4 w-full rounded-xl">
              Cerrar
            </Button>
          </div>
        ) : (
          <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); setStep(2); }} className="space-y-4" noValidate>
            <DialogHeader>
              <DialogTitle>Calificar experiencia</DialogTitle>
              {step === 1 ? (
                <DialogDescription>
                  ¿Qué tan probable es que recomiendes KADOSH a un amigo o familiar? (0 = Nada probable, 10 = Muy probable)
                </DialogDescription>
              ) : (
                <DialogDescription>
                  Cuéntanos un poco más sobre tu experiencia.
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="py-4">
              {step === 1 ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[0,1,2,3,4,5,6,7,8,9,10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setScore(num)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                          score === num
                            ? 'bg-primary text-primary-foreground scale-110 shadow-md'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="bestPart">¿Qué fue lo mejor?</Label>
                    <textarea
                      id="bestPart"
                      rows={2}
                      placeholder="Me gustó mucho..."
                      value={bestPart}
                      onChange={(e) => setBestPart(e.target.value)}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="improvement">¿Qué podríamos mejorar?</Label>
                    <textarea
                      id="improvement"
                      rows={2}
                      placeholder="Sería bueno si..."
                      value={improvement}
                      onChange={(e) => setImprovement(e.target.value)}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading} className="w-full sm:w-auto rounded-xl">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading || (step === 1 && score === null)} 
                className="w-full sm:w-auto rounded-xl"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {step === 1 ? 'Continuar' : 'Enviar calificación'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
