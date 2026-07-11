import { HandHeart, History, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

export default function TithePage() {
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      
      <div className="flex flex-col gap-1 mt-2 mb-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Diezmo</h1>
        <p className="text-sm text-muted-foreground">Honra con tus bienes.</p>
      </div>

      <Card className="rounded-3xl border-gold/20 bg-gold/5 shadow-sm relative overflow-hidden">
        <div className="absolute -right-8 -top-8 text-gold/10">
          <HandHeart className="w-48 h-48" />
        </div>
        <CardContent className="p-6 relative z-10 flex flex-col gap-4">
          
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Pendiente</span>
              <span className="text-4xl font-bold text-foreground">$ 150.00</span>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="text-xs text-muted-foreground mb-1">Sugerido (10%)</span>
              <span className="text-lg font-medium text-gold">$ 350.00</span>
            </div>
          </div>

          <div className="space-y-2 mt-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Registrado: $ 200.00</span>
              <span>Ingresos del mes: $ 3,500.00</span>
            </div>
            {/* Progress requiere el componente, asumimos que existe o lo creamos */}
            <div className="h-2 w-full bg-gold/20 rounded-full overflow-hidden">
              <div className="h-full bg-gold rounded-full transition-all duration-1000" style={{ width: '57%' }} />
            </div>
          </div>

          <Button className="w-full h-12 rounded-full mt-2 shadow-sm font-medium bg-gold hover:bg-gold/90 text-gold-foreground">
            Registrar Entrega
          </Button>

        </CardContent>
      </Card>

      <div className="mt-4">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Historial de Entregas</h3>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between p-4 rounded-3xl bg-card border border-border/50 shadow-sm">
            <div className="flex flex-col">
              <p className="font-medium text-sm text-foreground">Entrega parcial</p>
              <p className="text-xs text-muted-foreground">15 de Julio, 2026</p>
            </div>
            <span className="font-semibold text-gold">+ $ 200.00</span>
          </div>
        </div>
      </div>

    </div>
  )
}
