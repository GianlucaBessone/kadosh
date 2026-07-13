'use client';

import { HandHeart, History } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { TitheService } from '@/services/titheService'
import { useState } from 'react'

export default function TithePage() {
  const [loading, setLoading] = useState(false);

  const user = useLiveQuery(() => db.users.orderBy('id').first());

  // Current month transactions to calculate suggested tithe
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);

  const currentMonthTx = useLiveQuery(() =>
    db.transactions.where('date').aboveOrEqual(currentMonthStart.toISOString()).toArray()
  ) || [];

  const incomes = currentMonthTx.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
  const suggestedTithe = incomes * 0.1;

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
    try {
      const formData = new FormData(e.currentTarget);
      const amount = parseFloat(formData.get('amount') as string);
      const notes = formData.get('notes') as string || null;

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

      e.currentTarget.reset();
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
          
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Pendiente</span>
              <span className="text-4xl font-bold text-foreground">$ {pending.toFixed(2)}</span>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="text-xs text-muted-foreground mb-1">Sugerido (10%)</span>
              <span className="text-lg font-medium text-gold">$ {suggestedTithe.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2 mt-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Entregado: $ {totalPaid.toFixed(2)}</span>
              <span>Ingresos del mes: $ {incomes.toFixed(2)}</span>
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
              className="h-12 pl-8 rounded-2xl bg-card border-border shadow-sm pr-4 focus-visible:ring-primary font-medium"
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
              <span className="font-semibold text-gold">+ $ {tithe.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
