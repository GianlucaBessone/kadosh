import { Compass } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DeveloperCard } from './DeveloperCard';

export function MissionSection() {
  return (
    <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
      <CardContent className="p-5 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-full text-primary">
            <Compass className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Nuestra misión</h2>
        </div>

        {/* Subsección: Propósito */}
        <div className="space-y-2">
          <h3 className="font-medium text-foreground">El propósito de KADOSH</h3>
          <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-2xl">
            <p>
              Próximamente compartiremos un artículo detallado sobre el propósito que dio origen a esta aplicación y cómo buscamos bendecir a otros.
            </p>
          </div>
        </div>

        {/* Subsección: Visión */}
        <div className="space-y-2">
          <h3 className="font-medium text-foreground">Nuestra visión</h3>
          <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-2xl">
            <p>
              Próximamente compartiremos nuestra visión sobre el futuro de KADOSH y hacia dónde nos dirigimos.
            </p>
          </div>
        </div>

        {/* Subsección: Quién desarrolla */}
        <div className="space-y-4 pt-2">
          <h3 className="font-medium text-foreground">Quién desarrolla KADOSH</h3>
          
          <div className="text-sm text-muted-foreground space-y-4">
            <p>
              Procuramos desarrollar esta aplicación con un espíritu de servicio, buscando hacer cada tarea como para el Señor y no para recibir reconocimiento personal.
            </p>
            
            <div className="bg-primary/5 rounded-2xl p-5 text-center space-y-3 flex flex-col items-center">
              <p className="italic text-foreground text-[15px] leading-relaxed">
                "No sirviendo al ojo, como los que quieren agradar a los hombres, sino como siervos de Cristo, de corazón haciendo la voluntad de Dios; sirviendo de buena voluntad, como al Señor y no a los hombres."
              </p>
              <footer className="text-xs text-muted-foreground font-medium">— Efesios 6:6-7 (NVI)</footer>
            </div>
          </div>

          {/* Developer Card (Handles the reveal logic inside) */}
          <DeveloperCard />
        </div>
      </CardContent>
    </Card>
  );
}
