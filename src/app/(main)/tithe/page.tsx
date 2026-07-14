'use client';

import { HandHeart, History, Settings2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { TitheService } from '@/services/titheService'
import { useState, useEffect } from 'react'
import { formatMoney } from '@/lib/utils'
import { MoneyInput } from '@/components/ui/MoneyInput'

export default function TithePage() {
  const [loading, setLoading] = useState(false);
  const [customPercentage, setCustomPercentage] = useState<number | null>(null);
  const [customFixedAmount, setCustomFixedAmount] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tempPct, setTempPct] = useState<string>('10');
  const [tempAmt, setTempAmt] = useState<string>('');

  useEffect(() => {
    const savedPct = localStorage.getItem('kadosh_tithe_pct');
    const savedAmt = localStorage.getItem('kadosh_tithe_amt');
    if (savedPct) {
      setCustomPercentage(Number(savedPct));
      setTempPct(savedPct);
    }
    if (savedAmt) {
      setCustomFixedAmount(Number(savedAmt));
      setTempAmt(savedAmt);
    }
  }, []);

  const handleSaveConfig = (mode: 'pct' | 'amt') => {
    if (mode === 'pct') {
      const pct = parseFloat(tempPct);
      if (!isNaN(pct) && pct > 0) {
        setCustomPercentage(pct);
        setCustomFixedAmount(null);
        localStorage.setItem('kadosh_tithe_pct', pct.toString());
        localStorage.removeItem('kadosh_tithe_amt');
      }
    } else {
      const amt = parseFloat(tempAmt);
      if (!isNaN(amt) && amt > 0) {
        setCustomFixedAmount(amt);
        setCustomPercentage(null);
        localStorage.setItem('kadosh_tithe_amt', amt.toString());
        localStorage.removeItem('kadosh_tithe_pct');
      }
    }
    setIsDialogOpen(false);
  };

  const user = useLiveQuery(() => db.users.orderBy('id').first());

  // Current month transactions to calculate suggested tithe
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);

  const currentMonthTx = useLiveQuery(() =>
    db.transactions.where('date').aboveOrEqual(currentMonthStart.toISOString()).toArray()
  ) || [];

  const incomes = currentMonthTx.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
  const actualPercentage = customPercentage ?? 10;
  const suggestedTithe = customFixedAmount !== null 
    ? customFixedAmount 
    : (incomes * (actualPercentage / 100));

  // Current month tithes
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const tithes = useLiveQuery(() =>
    db.tithes.where('[month+year]').equals([currentMonth, currentYear]).toArray()
  ) || [];

  const totalPaid = tithes.reduce((acc, t) => acc + t.amount, 0);
  const pending = Math.max(0, suggestedTithe - totalPaid);
  const progressPercent = suggestedTithe > 0 ? Math.min(100, Math.round((totalPaid / suggestedTithe) * 100)) : 0;

  // All tithes for history (last 10)
  const allTithes = useLiveQuery(() =>
    db.tithes.orderBy('createdAt').reverse().limit(10).toArray()
  ) || [];

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    try {
      const formData = new FormData(form);
      const amountStr = formData.get('amount');
      const notesStr = formData.get('notes');
      const amount = typeof amountStr === 'string' ? parseFloat(amountStr) : NaN;
      const notes = typeof notesStr === 'string' ? notesStr : null;

      if (isNaN(amount) || amount <= 0 || !user) return;

      await TitheService.createTithe({
        userId: user.id,
        amount,
        notes,
        date: new Date().toISOString(),
        month: currentMonth,
        year: currentYear,
      });

      // Deduct from account balance
      const account = await db.accounts.where('userId').equals(user.id).first();
      if (account) {
        const { AccountService } = await import('@/services/accountService');
        await AccountService.updateAccount(account.id, {
          balance: account.balance - amount,
        });
      }

      form.reset();
    } finally {
      setLoading(false);
    }
  };

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

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
          
          <div className="flex justify-between items-end gap-2">
            <div className="flex flex-col min-w-0">
              <span className="text-[clamp(0.65rem,2.5vw,0.75rem)] font-semibold uppercase tracking-wider text-muted-foreground mb-1 whitespace-nowrap">Pendiente</span>
              <span className="text-[clamp(1.5rem,7vw,2.25rem)] font-bold text-foreground whitespace-nowrap">{formatMoney(pending)}</span>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <div className="flex flex-col items-end text-right cursor-pointer hover:opacity-80 transition-opacity min-w-0">
                  <div className="flex items-center gap-1 mb-1 text-[clamp(0.65rem,2.5vw,0.75rem)] text-muted-foreground whitespace-nowrap">
                    <span>Sugerido ({customFixedAmount !== null ? 'Fijo' : `${actualPercentage}%`})</span>
                    <Settings2 className="w-3 h-3 flex-shrink-0" />
                  </div>
                  <span className="text-[clamp(1rem,4.5vw,1.125rem)] font-medium text-gold whitespace-nowrap">{formatMoney(suggestedTithe)}</span>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-3xl p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl">Configurar Diezmo Sugerido</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue={customFixedAmount !== null ? 'amt' : 'pct'} className="mt-4">
                  <TabsList className="grid w-full grid-cols-2 rounded-xl">
                    <TabsTrigger value="pct" className="rounded-lg">Porcentaje</TabsTrigger>
                    <TabsTrigger value="amt" className="rounded-lg">Monto Fijo</TabsTrigger>
                  </TabsList>
                  <TabsContent value="pct" className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Porcentaje de ingresos</label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          value={tempPct}
                          onChange={(e) => setTempPct(e.target.value)}
                          className="h-12 pl-4 pr-8 rounded-2xl font-medium"
                          min="0"
                          step="0.1"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                      </div>
                    </div>
                    <Button onClick={() => handleSaveConfig('pct')} className="w-full h-12 rounded-full font-medium bg-gold hover:bg-gold/90 text-gold-foreground">
                      Guardar Configuración
                    </Button>
                  </TabsContent>
                  <TabsContent value="amt" className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Monto fijo mensual</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10">$</span>
                        <MoneyInput 
                          value={tempAmt ? parseFloat(tempAmt) : undefined}
                          onChange={(val) => setTempAmt(val?.toString() || '')}
                          baseTextSize="text-sm"
                          className="flex h-12 w-full rounded-2xl border border-input bg-background px-3 py-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-8 font-medium text-left"
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                    <Button onClick={() => handleSaveConfig('amt')} className="w-full h-12 rounded-full font-medium bg-gold hover:bg-gold/90 text-gold-foreground">
                      Guardar Configuración
                    </Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2 mt-2">
            <div className="flex justify-between text-[clamp(0.65rem,2.5vw,0.75rem)] text-muted-foreground gap-2">
              <span className="whitespace-nowrap truncate">Entregado: {formatMoney(totalPaid)}</span>
              <span className="whitespace-nowrap truncate">Ingresos: {formatMoney(incomes)}</span>
            </div>
            <div className="h-2 w-full bg-gold/20 rounded-full overflow-hidden">
              <div className="h-full bg-gold rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Formulario de registro */}
      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground z-10">
              $
            </div>
            <MoneyInput 
              name="amount" 
              placeholder="0,00" 
              required 
              baseTextSize="text-base"
              className="flex h-12 w-full rounded-2xl border border-input bg-card shadow-sm px-3 py-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary pl-8 pr-4 font-medium text-left"
            />
          </div>
        </div>
        <Input 
          name="notes" 
          placeholder="Notas (opcional)" 
          className="h-12 rounded-2xl bg-card border-border shadow-sm px-4 focus-visible:ring-primary"
        />
        <Button 
          disabled={loading}
          className="w-full h-12 rounded-full shadow-sm font-medium bg-gold hover:bg-gold/90 text-gold-foreground"
        >
          {loading ? 'Registrando...' : 'Registrar Entrega'}
        </Button>
      </form>

      <div className="mt-4">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Historial de Entregas</h3>
        </div>
        
        <div className="flex flex-col gap-3">
          {allTithes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No hay entregas registradas.</p>
          )}
          {allTithes.map(tithe => (
            <div key={tithe.id} className="flex items-center justify-between p-4 rounded-3xl bg-card border border-border/50 shadow-sm">
              <div className="flex flex-col">
                <p className="font-medium text-sm text-foreground">{tithe.notes || 'Entrega de diezmo'}</p>
                <p className="text-xs text-muted-foreground">
                  {monthNames[tithe.month - 1]} {tithe.year}
                </p>
              </div>
              <span className="font-semibold text-gold">+ {formatMoney(tithe.amount)}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
