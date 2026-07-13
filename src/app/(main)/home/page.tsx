'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ArrowDownIcon, ArrowUpIcon, Droplet, HandHeart } from 'lucide-react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { DailyVerseCard } from '@/features/daily-verse/components/DailyVerseCard';

export default function HomePage() {
  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const totalBalance = accounts.reduce((acc, account) => acc + account.balance, 0);

  // We could also calculate incomes and expenses for the current month.
  // For simplicity, let's just grab the transactions and sum them up.
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().limit(5).toArray()) || [];
  
  // Calculate current month's stats (approximation)
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);
  
  const currentMonthTx = useLiveQuery(() => 
    db.transactions.where('date').aboveOrEqual(currentMonthStart.toISOString()).toArray()
  ) || [];

  const incomes = currentMonthTx.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
  const expenses = currentMonthTx.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);

  const activeSeedsCount = useLiveQuery(() => db.seedGoals.where('status').equals('ACTIVE').count()) || 0;

  const user = useLiveQuery(() => db.users.orderBy('id').first());
  const userName = user?.name ? user.name.split(' ')[0] : 'Usuario';

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      {/* Saludo */}
      <div className="flex flex-col gap-1 mt-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Hola, {userName}</h1>
        <p className="text-sm text-muted-foreground">Tu administración en paz y orden.</p>
      </div>

      {/* Balance Disponible */}
      <div className="flex flex-col gap-2 items-center justify-center py-6">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Balance Total</span>
        <h2 className="text-5xl font-bold tracking-tighter text-foreground">$ {totalBalance.toFixed(2)}</h2>
      </div>

      {/* Resumen del Mes */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="rounded-3xl shadow-sm border-border/50">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-success mb-1">
              <div className="bg-success/10 p-1 rounded-full">
                <ArrowUpIcon className="w-3 h-3" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider">Ingresos</span>
            </div>
            <span className="text-lg font-bold text-foreground">$ {incomes.toFixed(2)}</span>
          </CardContent>
        </Card>
        
        <Card className="rounded-3xl shadow-sm border-border/50">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-destructive mb-1">
              <div className="bg-destructive/10 p-1 rounded-full">
                <ArrowDownIcon className="w-3 h-3" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider">Gastos</span>
            </div>
            <span className="text-lg font-bold text-foreground">$ {expenses.toFixed(2)}</span>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-sm border-border/50 bg-gold/5 border-gold/20">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-gold mb-1">
              <div className="bg-gold/10 p-1 rounded-full">
                <HandHeart className="w-3 h-3" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider">Diezmo</span>
            </div>
            <span className="text-lg font-bold text-foreground">$ 0.00</span>
            <span className="text-[10px] text-muted-foreground">Pendiente</span>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-sm border-border/50 bg-secondary/10 border-secondary/20">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-primary mb-1">
              <div className="bg-primary/10 p-1 rounded-full">
                <Droplet className="w-3 h-3" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider">Semillas</span>
            </div>
            <span className="text-lg font-bold text-foreground">{activeSeedsCount}</span>
            <span className="text-[10px] text-muted-foreground">En crecimiento</span>
          </CardContent>
        </Card>
      </div>

      {/* Accesos Rápidos (Botones rápidos adicionales) */}
      <div className="grid grid-cols-4 gap-2 mt-2">
        <Link href="/register-tx?type=INCOME" prefetch={true} className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center">
            <ArrowUpIcon className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium">Ingreso</span>
        </Link>
        <Link href="/register-tx?type=EXPENSE" prefetch={true} className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
            <ArrowDownIcon className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium">Gasto</span>
        </Link>
        <Link href="/seeds" prefetch={true} className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-secondary/20 text-secondary-foreground flex items-center justify-center">
            <Droplet className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium">Regar</span>
        </Link>
        <Link href="/tithe" prefetch={true} className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-gold/10 text-gold flex items-center justify-center">
            <HandHeart className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium">Diezmo</span>
        </Link>
      </div>

      <DailyVerseCard />

      {/* Últimos Movimientos */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Últimos movimientos</h3>
          <Link href="/transactions" className="text-xs font-medium text-primary hover:underline">Ver todos</Link>
        </div>
        
        <div className="flex flex-col gap-3">
          {transactions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No hay movimientos recientes.</p>
          )}
          {transactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between p-4 rounded-3xl bg-card border border-border/50 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'INCOME' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                  {tx.type === 'INCOME' ? '💼' : '🛒'}
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">{tx.notes || (tx.type === 'INCOME' ? 'Ingreso' : 'Gasto')}</p>
                  <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`font-semibold ${tx.type === 'INCOME' ? 'text-success' : 'text-destructive'}`}>
                {tx.type === 'INCOME' ? '+' : '-'} $ {tx.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
