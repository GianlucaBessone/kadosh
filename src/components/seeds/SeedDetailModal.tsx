'use client';

import { ArrowLeft, Droplet, Sprout, Check, History, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { PlantAvatar } from '@/components/seeds/PlantAvatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkspaceQueries } from '@/store/queries/WorkspaceQueries'
import { db } from '@/lib/db'
import { SeedService } from '@/services/seedService'
import { formatMoney, cn } from '@/lib/utils'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { MoneyDisplay } from '@/components/ui/MoneyDisplay'
import { soundService } from '@/lib/SoundService'
import { toast } from 'sonner'

interface SeedDetailModalProps {
  seedId: string;
  onClose: () => void;
}

export function SeedDetailModal({ seedId: id, onClose }: SeedDetailModalProps) {
  const router = useRouter();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [waterError, setWaterError] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const seeds = WorkspaceQueries.useSeeds();
  const seed = seeds.find(s => s.id === id);

  const history = useLiveQuery(async () => {
    if (!id) return [];
    const contributions = await db.seedContributions
      .where('seedGoalId')
      .equals(id)
      .toArray();
    return contributions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [id]) || [];

  if (seed === undefined) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col p-4 animate-in slide-in-from-right duration-300">
        <div className="flex h-screen items-center justify-center text-muted-foreground">Cargando semilla...</div>
      </div>
    );
  }

  if (seed === null) {
    onClose();
    return null;
  }

  const progress = Math.min(100, Math.round((seed.currentAmount / seed.targetAmount) * 100))
  const isHarvested = seed.status === 'HARVESTED'
  const isReady = progress >= 100 && !isHarvested

  const handleWater = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const amountStr = formData.get('amount');
    if (typeof amountStr !== 'string') return;
    const amount = parseFloat(amountStr);
    if (!isNaN(amount) && amount > 0) {
      await SeedService.waterSeed(seed.id, amount);
      soundService.play('success');
      form.reset();
      setWaterError(null);
    } else {
      soundService.play('error');
      setWaterError('Ingresa un monto válido');
    }
  }

  const handleWithdraw = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const amountStr = formData.get('amount');
    if (typeof amountStr !== 'string') return;
    const amount = parseFloat(amountStr);
    if (!isNaN(amount) && amount > 0 && amount <= seed.currentAmount) {
      await SeedService.withdrawSeed(seed.id, amount);
      soundService.play('success');
      form.reset();
      setWithdrawError(null);
    } else {
      soundService.play('error');
      setWithdrawError('Monto inválido o insuficiente');
    }
  }

  const handleHarvest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await SeedService.harvestSeed(seed.id);
    soundService.play('goal');
  }

  const handleDelete = async (restoreBalance: boolean) => {
    if (deleting) return;
    setDeleting(true);
    try {
      await SeedService.deleteSeed(seed.id, restoreBalance);
      soundService.play('delete');
      onClose();
    } catch (e) {
      console.error(e);
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="flex flex-col gap-6 w-full pb-16 min-h-screen px-4 max-w-md mx-auto relative pt-4">
        
        <div className="flex items-center justify-between mt-2 sticky top-4 z-10 bg-background/80 backdrop-blur-sm p-2 rounded-2xl border border-border/50 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Volver</span>
            </button>
            <h1 className="text-xl font-semibold tracking-tight text-foreground truncate max-w-[150px] sm:max-w-[200px]">{seed.name}</h1>
          </div>
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-destructive/10"
            aria-label="Eliminar semilla"
          >
            <Trash2 className="w-5 h-5" />
          </button>
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
              <span className={`text-4xl font-bold tracking-tighter flex items-center ${isReady ? 'text-gold' : 'text-foreground'}`}>
                <MoneyDisplay amount={seed.currentAmount} />
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-1">de <MoneyDisplay amount={seed.targetAmount} /></span>
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
                    <form onSubmit={handleWater} className="flex flex-col gap-4" noValidate>
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Droplet className="w-4 h-4 text-primary" /> Regar semilla
                      </h3>
                      
                      <div>
                        <div className="flex gap-3">
                          <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground z-10">$</div>
                            <MoneyInput 
                              name="amount" 
                              placeholder="0,00" 
                              required 
                              baseTextSize="text-base"
                              className="flex h-12 w-full rounded-2xl border border-input bg-background shadow-sm px-3 py-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary pl-8 pr-4 font-medium text-left"
                            />
                          </div>
                          <Button type="submit" className="h-12 px-6 rounded-2xl shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                            Aportar
                          </Button>
                        </div>
                        {waterError && <p className="text-xs text-destructive mt-1.5 ml-2 text-left">{waterError}</p>}
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-1">Este monto se deducirá de tu balance principal.</p>
                    </form>
                  </TabsContent>

                  <TabsContent value="withdraw">
                    <form onSubmit={handleWithdraw} className="flex flex-col gap-4" noValidate>
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Sprout className="w-4 h-4 text-destructive" /> Retirar fondos
                      </h3>
                      
                      <div>
                        <div className="flex gap-3">
                          <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground z-10">$</div>
                            <MoneyInput 
                              name="amount" 
                              placeholder="0,00" 
                              required 
                              baseTextSize="text-base"
                              className="flex h-12 w-full rounded-2xl border border-input bg-background shadow-sm px-3 py-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary pl-8 pr-4 font-medium text-left"
                            />
                          </div>
                          <Button type="submit" variant="destructive" className="h-12 px-6 rounded-2xl shadow-sm font-medium">
                            Retirar
                          </Button>
                        </div>
                        {withdrawError && <p className="text-xs text-destructive mt-1.5 ml-2 text-left">{withdrawError}</p>}
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
                <span className={`font-semibold flex items-center ${item.amount > 0 ? 'text-primary' : 'text-foreground'}`}>
                  {item.amount > 0 ? '+ ' : ''}<MoneyDisplay amount={item.amount} className="ml-1" />
                </span>
              </div>
            ))}
          </div>
        </div>

        {showDeleteModal && (
          <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border shadow-lg rounded-3xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className="mx-auto w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Eliminar semilla</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Elige qué hacer con los fondos aportados a esta semilla.
                </p>
                
                <div className="flex flex-col gap-3 text-left">
                  <button
                    onClick={() => handleDelete(true)}
                    disabled={deleting}
                    className="w-full p-3 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
                  >
                    <p className="font-semibold text-sm text-primary">Restaurar saldo al balance principal</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Se creará un movimiento de ingreso por <span className="font-semibold text-foreground"><MoneyDisplay amount={seed.currentAmount} /></span> y se eliminará la semilla.
                    </p>
                  </button>

                  <button
                    onClick={() => handleDelete(false)}
                    disabled={deleting}
                    className="w-full p-3 rounded-2xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors"
                  >
                    <p className="font-semibold text-sm text-destructive">Eliminar sin restaurar saldo</p>
                    <p className="text-xs text-muted-foreground mt-1">El dinero se perderá del balance. ¡Acción irreversible!</p>
                  </button>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                    className="w-full h-12 rounded-full border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
