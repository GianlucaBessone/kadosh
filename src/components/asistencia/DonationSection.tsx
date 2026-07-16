import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function DonationSection() {
  return (
    <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
      <CardContent className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-center gap-3 text-center">
          <div className="bg-primary/10 p-2 rounded-full text-primary">
            <Heart className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Apoyar el proyecto</h2>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground text-center">
          <p>KADOSH siempre será una aplicación completamente gratuita.</p>
          <p>
            Nunca bloquearemos funciones mediante suscripciones, publicidad invasiva ni pagos obligatorios.
          </p>
          <p>
            Si esta aplicación te ayuda a administrar mejor los recursos que Dios puso en tus manos y deseas colaborar para mantener su desarrollo, puedes realizar una donación completamente voluntaria.
          </p>
          <p>Gracias por formar parte de este proyecto.</p>
        </div>
        
        <div className="mt-2">
          <Button 
            className="w-full rounded-xl" 
            onClick={() => {
              // TODO: Integrate payment gateway (MercadoPago)
              toast.info('La pasarela de pago estará disponible muy pronto.');
            }}
          >
            <Heart className="w-4 h-4 mr-2" />
            Realizar una donación
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
