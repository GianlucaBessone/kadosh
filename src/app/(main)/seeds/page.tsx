import { Plus, Droplet } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlantAvatar } from '@/components/seeds/PlantAvatar'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/features/auth/user'
import { redirect } from 'next/navigation'

export default async function SeedsPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const seeds = await prisma.seedGoal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      
      <div className="flex items-center justify-between mt-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tus Semillas</h1>
          <p className="text-sm text-muted-foreground mt-1">Lo que siembras hoy, cosecharás mañana.</p>
        </div>
        <Link href="/seeds/new">
          <Button size="icon" className="rounded-full shadow-md bg-secondary text-secondary-foreground hover:bg-secondary/80">
            <Plus className="h-5 w-5" />
            <span className="sr-only">Nueva semilla</span>
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 mt-4">
        {seeds.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            No tienes semillas plantadas.
          </div>
        )}

        {seeds.map((seed: any) => {
          const progress = Math.min(100, Math.round((seed.currentAmount / seed.targetAmount) * 100))
          const isHarvested = seed.status === 'HARVESTED'
          const isReady = progress >= 100 && !isHarvested

          return (
            <Link href={`/seeds/${seed.id}`} key={seed.id}>
              <Card className={`rounded-3xl border-border/50 shadow-sm overflow-hidden relative group hover:shadow-md transition-all ${isReady ? 'border-gold/30 bg-gold/5' : ''}`}>
                <div 
                  className={`absolute top-0 left-0 h-1 transition-all duration-1000 ease-in-out ${isReady ? 'bg-gold' : 'bg-secondary'}`}
                  style={{ width: `${progress}%` }} 
                />
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center overflow-hidden">
                      <PlantAvatar progress={progress} className="w-full h-full transform scale-75" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-semibold text-lg text-foreground">{seed.name}</h3>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className={`font-bold ${isReady ? 'text-gold' : 'text-foreground'}`}>$ {seed.currentAmount.toFixed(2)}</span>
                        {!isHarvested && (
                          <span className="text-xs text-muted-foreground">/ $ {seed.targetAmount.toFixed(2)}</span>
                        )}
                        {isHarvested && (
                          <span className="text-xs text-muted-foreground">Cosechada</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {!isHarvested && !isReady && (
                    <div className="rounded-full h-12 w-12 border border-primary/20 bg-primary/5 text-primary flex items-center justify-center">
                      <Droplet className="h-5 w-5" />
                    </div>
                  )}
                  {isReady && (
                    <div className="rounded-full h-10 px-4 flex items-center justify-center bg-gold text-gold-foreground font-medium text-sm">
                      Lista
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
