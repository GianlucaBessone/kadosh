'use client';

import { CheckCircle2 } from 'lucide-react';

/**
 * Full-screen elegant animation shown after a successful payment.
 * Appears briefly then disappears. No infantile animations.
 * Exported as default to allow both default and named imports.
 */
export default function PaymentSuccessAnimation() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-none">
      <div className="flex flex-col items-center gap-4 animate-in zoom-in-75 duration-300">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-success" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold text-foreground">Pago registrado</p>
          <p className="text-sm text-muted-foreground mt-1">Tu compromiso está al día.</p>
        </div>
      </div>
    </div>
  );
}
