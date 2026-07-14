'use client';

import { ArrowLeft, Droplet, Sprout, Check, History } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { PlantAvatar } from '@/components/seeds/PlantAvatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { SeedService } from '@/services/seedService'
import { formatMoney } from '@/lib/utils'

export default function SeedDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const seed = useLiveQuery(() => db.seedGoals.get(id));

  const history = useLiveQuery(async () => {
    const contributions = await db.seedContributions
      .where('seedGoalId')
      .equals(id)
      .toArray();
    
    return contributions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [id]) || [];

  if (seed === undefined) {
    return <div className="flex h-screen items-center justify-center text-muted-foreground">Cargando semilla...</div>;
  }

  if (seed === null) {
    router.replace('/seeds');
    return null;
  }

  const progress = Math.min(100, Math.round((seed.currentAmount / seed.targetAmount) * 100))
  const isHarvested = seed.status === 'HARVESTED'
  const isReady = progress >= 100 && !isHarvested

  const handleWater = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const amount = parseFloat(formData.get('amount') as string);
    if (!isNaN(amount) && amount > 0) {
      await SeedService.waterSeed(seed.id, amount);
      form.reset();
    }
  }

  const handleWithdraw = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const amount = parseFloat(formData.get('amount') as string);
    if (!isNaN(amount) && amount > 0 && amount <= seed.currentAmount) {
      await SeedService.withdrawSeed(seed.id, amount);
      form.reset();
    } else {
      alert('Monto inválido o superior al disponible.');
    }
  }

  const handleHarvest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await SeedService.harvestSeed(seed.id);
  }

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
          <div className="flex flex-col items-center">
            <span className={`text-4xl font-bold tracking-tighter ${isReady ? 'text-gold' : 'text-foreground'}`}>
              {formatMoney(seed.currentAmount)}
            </span>
            <span className="text-sm text-muted-foreground">de {formatMoney(seed.targetAmount)}</span>
          </div>
        </div>
      </div>

      {!isHarvested && (
        <div className="flex flex-col gap-4">
          {isReady && (
            <Card className="rounded-3xl border-gold/30 bg-gold/5 shadow-sm">
              <CardContent className="p-6">
                <form onSubmit={handleHarvest} className="flex flex-col gap-4 items-center">
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
              </CardContent>
            </Card>
          )}

          <Card className="rounded-3xl border border-border/50 bg-card shadow-sm">
            <CardContent className="p-6">
              <Tabs defaultValue="water" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/50 rounded-full h-12 p-1 mb-6">
                  <TabsTrigger value="water" className="rounded-full data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">Aportar</TabsTrigger>
                  <TabsTrigger value="withdraw" className="rounded-full data-[state=active]:bg-card data-[state=active]:text-destructive data-[state=active]:shadow-sm">Retirar</TabsTrigger>
                </TabsList>
                
                <TabsContent value="water">
                  <form onSubmit={handleWater} className="flex flex-col gap-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-primary" /> Regar semilla
                    </h3>
                    
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground">$</div>
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
                </TabsContent>

                <TabsContent value="withdraw">
                  <form onSubmit={handleWithdraw} className="flex flex-col gap-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Sprout className="w-4 h-4 text-destructive" /> Retirar fondos
                    </h3>
                    
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground">$</div>
                        <Input 
                          name="amount" 
                          type="number" 
                          placeholder="0.00" 
                          required 
                          min="1"
                          max={seed.currentAmount}
                          step="0.01"
                          className="h-12 pl-8 rounded-2xl bg-background border-border shadow-sm pr-4 focus-visible:ring-primary font-medium"
                        />
                      </div>
                      <Button type="submit" variant="destructive" className="h-12 px-6 rounded-2xl shadow-sm font-medium">
                        Retirar
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-1">Este monto volverá a tu balance principal.</p>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
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

      <div className="mt-4">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Historial de Movimientos</h3>
        </div>
        
        <div className="flex flex-col gap-3">
          {history.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No hay movimientos registrados.</p>
          )}
          {history.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 rounded-3xl bg-card border border-border/50 shadow-sm">
              <div className="flex flex-col">
                <p className="font-medium text-sm text-foreground">{item.notes || (item.amount > 0 ? 'Aporte' : 'Retiro')}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.date).toLocaleDateString()}
                </p>
              </div>
              <span className={`font-semibold ${item.amount > 0 ? 'text-primary' : 'text-foreground'}`}>
                {item.amount > 0 ? '+ ' : ''}{formatMoney(item.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
