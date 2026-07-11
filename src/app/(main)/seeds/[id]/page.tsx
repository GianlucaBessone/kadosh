import { ArrowLeft, Droplet, Sprout } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PlantAvatar } from '@/components/seeds/PlantAvatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/features/auth/user'
import { waterSeed, harvestSeed } from '@/features/seeds/actions'

export default async function SeedDetailPage({ params }: { params: { id: string } }) {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const seed = await prisma.seedGoal.findUnique({
    where: { id: params.id, userId: user.id }
  })

  if (!seed) redirect('/seeds')

  const progress = Math.min(100, Math.round((seed.currentAmount / seed.targetAmount) * 100))
  const isHarvested = seed.status === 'HARVESTED'
  const isReady = progress >= 100 && !isHarvested

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-4">
          <Link href="/seeds" className="text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Volver</span>
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">{seed.name}</h1>
        </div>
      </div>

      <div className="flex justify-center mt-4 mb-2 relative">
        <div className={`w-64 h-64 rounded-[3rem] ${isReady ? 'bg-gold/10' : 'bg-secondary/10'} flex items-center justify-center overflow-hidden border ${isReady ? 'border-gold/30' : 'border-secondary/20'} shadow-inner relative`}>
          <PlantAvatar progress={progress} className="w-full h-full transform scale-150" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 mb-4">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Crecimiento</span>
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-bold tracking-tighter ${isReady ? 'text-gold' : 'text-foreground'}`}>
            $ {seed.currentAmount.toFixed(2)}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">de $ {seed.targetAmount.toFixed(2)}</span>
      </div>

      {!isHarvested && (
        <Card className={`rounded-3xl border shadow-sm ${isReady ? 'border-gold/30 bg-gold/5' : 'border-border/50 bg-card'}`}>
          <CardContent className="p-6">
            
            {isReady ? (
              <form action={harvestSeed} className="flex flex-col gap-4 items-center">
                <input type="hidden" name="seedGoalId" value={seed.id} />
                <div className="w-16 h-16 bg-gold/20 text-gold rounded-full flex items-center justify-center mb-2">
                  <Sprout className="w-8 h-8" />
                </div>
                <div className="text-center mb-2">
                  <h3 className="font-semibold text-lg text-foreground">¡Tu semilla ha dado fruto!</h3>
                  <p className="text-sm text-muted-foreground">Es tiempo de cosechar lo que has sembrado con esfuerzo.</p>
                </div>
                <Button className="w-full h-14 rounded-full shadow-md font-medium text-lg bg-gold hover:bg-gold/90 text-gold-foreground">
                  Cosechar ahora
                </Button>
              </form>
            ) : (
              <form action={waterSeed} className="flex flex-col gap-4">
                <input type="hidden" name="seedGoalId" value={seed.id} />
                
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-primary" /> Regar semilla
                </h3>
                
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground">
                      $
                    </div>
                    <Input 
                      name="amount" 
                      type="number" 
                      placeholder="0.00" 
                      required 
                      min="1"
                      step="0.01"
                      className="h-12 pl-8 rounded-2xl bg-background border-border shadow-sm pr-4 focus-visible:ring-primary font-medium"
                    />
                  </div>
                  <Button type="submit" className="h-12 px-6 rounded-2xl shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                    Aportar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-1">Este monto se deducirá de tu balance principal.</p>
              </form>
            )}

          </CardContent>
        </Card>
      )}

      {isHarvested && (
        <div className="flex flex-col items-center justify-center p-8 bg-card rounded-3xl border border-border/50 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 opacity-50">
            <Sprout className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground mb-1">Semilla Cosechada</h3>
          <p className="text-sm text-muted-foreground">El fruto de esta semilla ya está en tu balance.</p>
        </div>
      )}

    </div>
  )
}
