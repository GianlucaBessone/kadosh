import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HandHeart, Users, HelpCircle } from 'lucide-react';

interface FinishedPrayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  prayerCount: number;
  joinedCount: number;
}

export const FinishedPrayerModal = React.memo(function FinishedPrayerModal({
  isOpen,
  onClose,
  prayerCount,
  joinedCount,
}: FinishedPrayerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-md"
        // Prevent closing automatically, force user interaction if needed, though ESC is fine.
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <HandHeart className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">Tiempo de Oración Concluido</DialogTitle>
          <DialogDescription className="text-center mt-2">
            Han pasado 7 días desde que se publicó esta petición. Ha sido retirada de la comunidad, pero Dios sigue obrando.
          </DialogDescription>
        </DialogHeader>

        <div className="my-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl border border-border/50 bg-card p-4 text-center shadow-sm">
              <HelpingHandIcon className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-foreground">{prayerCount}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Oraciones</p>
            </div>
            <div className="rounded-3xl border border-border/50 bg-card p-4 text-center shadow-sm">
              <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold text-foreground">{joinedCount}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Acompañantes</p>
            </div>
          </div>

          <div className="rounded-3xl bg-muted/40 p-5 mt-2 relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center text-center gap-3">
              <p className="text-sm italic text-foreground/90 font-medium">
                "Exhorto, pues, ante todo que se hagan rogativas, oraciones, peticiones y acciones de gracias por todos los hombres."
              </p>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                1 Timoteo 2:1
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button onClick={onClose} className="w-full sm:w-auto rounded-full px-8">
            Cerrar y seguir confiando
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

// Helper component inside to avoid repeating imports
function HelpingHandIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 12h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 14" />
      <path d="m7 18 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
      <path d="m2 13 6 6" />
    </svg>
  );
}
