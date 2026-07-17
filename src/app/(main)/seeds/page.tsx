'use client';

import { Plus, Droplet } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlantAvatar } from '@/components/seeds/PlantAvatar'
import { formatMoney } from '@/lib/utils'
import { MoneyDisplay } from '@/components/ui/MoneyDisplay'
import { WorkspaceQueries } from '@/store/queries/WorkspaceQueries'
import { MotivationalVerseService } from '@/services/motivationalVerseService'
import { useEffect, useState } from 'react'

export default function SeedsPage() {
  const seeds = WorkspaceQueries.useSeeds();
  // Filter and sort manually
  const filteredSeeds = [...seeds]
    .filter(seed => !seed.deletedAt)
    .sort((a, b) => new Date(b.createdAt || b.id).getTime() - new Date(a.createdAt || a.id).getTime());
  const [verse, setVerse] = useState<{ text: string, reference: string } | null>(null);

  useEffect(() => {
    MotivationalVerseService.seedDefaultVerses().then(() => {
      MotivationalVerseService.getRandomVerse('AHORRO').then(setVerse);
    });
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      
      <div className="flex items-center justify-between mt-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tus Semillas</h1>
          <p className="text-sm text-muted-foreground mt-1">Lo que siembras hoy, cosecharás mañana.</p>
        </div>
      </div>

      <div className="grid gap-4 mt-4">
        {seeds.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-12 px-4">
            <p className="text-muted-foreground mb-8">
              No tienes semillas plantadas.
            </p>
            <div className="max-w-sm space-y-4">
              <p className="text-[15px] italic text-foreground/90 leading-relaxed font-medium">
                "{verse?.text || 'Recuerden esto: El que siembra escasamente, escasamente cosechará, y el que siembra en abundancia, en abundancia cosechará.'}"
              </p>
              <p className="text-xs font-bold text-primary tracking-widest uppercase">
                {verse?.reference || '2 Corintios 9:6'}
              </p>
            </div>
          </div>
        )}

        {filteredSeeds.map((seed) => {
          const progress = Math.min(100, Math.round((seed.currentAmount / seed.targetAmount) * 100))
          const isHarvested = seed.status === 'HARVESTED'
          const isReady = progress >= 100 && !isHarvested

          return (
            <Link href={`/seeds/${seed.id}`} key={seed.id} prefetch={true}>
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
                    <div className="flex flex-col min-w-0">
                      <h3 className="font-semibold text-lg text-foreground truncate">{seed.name}</h3>
                      <div className="flex items-baseline gap-1 mt-1 flex-wrap">
                        <span className={`font-bold whitespace-nowrap flex items-center gap-1 ${isReady ? 'text-gold' : 'text-foreground'}`}><MoneyDisplay amount={seed.currentAmount} /></span>
                        {!isHarvested && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">/ <MoneyDisplay amount={seed.targetAmount} /></span>
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
