'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDownIcon, ArrowUpIcon, Droplet, HandHeart } from 'lucide-react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { formatMoney, formatMoneyCompact, cn } from '@/lib/utils';
import { DailyVerseCard } from '@/features/daily-verse/components/DailyVerseCard';
import { TransactionCard } from '@/components/transactions/TransactionCard';
import { NextCommitmentCard } from '@/features/planning/components/NextCommitmentCard';
import { commitmentAppliesToMonth, getDueDateForMonth } from '@/features/planning/utils/dateUtils';
import type { FinancialCommitment } from '@/lib/db';
import { PlanningModeModal } from '@/components/onboarding/PlanningModeModal';
import { PeriodSelector } from '@/components/shared/PeriodSelector';
import type { PlanningPeriod } from '@/features/planning/types';

export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'balance'|'incomes'|'expenses'|'tithe'|null>(null);
  
  const [tithePct, setTithePct] = useState<number>(10);
  const [titheAmt, setTitheAmt] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PlanningPeriod>('MONTH');

  // Hydration fix and read local settings
  useEffect(() => {
    setIsMounted(true);
    const pctStr = localStorage.getItem('kadosh_tithe_pct');
    if (pctStr) setTithePct(parseFloat(pctStr));
    const amtStr = localStorage.getItem('kadosh_tithe_amt');
    if (amtStr) setTitheAmt(parseFloat(amtStr));
  }, []);

  // Cierra la sección expandida al tocar en cualquier lado de la pantalla
  useEffect(() => {
    const handleGlobalClick = () => setExpandedSection(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const totalBalance = accounts.reduce((acc, account) => acc + account.balance, 0);

  // We could also calculate incomes and expenses for the current month.
  // Fetch transactions and tithes to show in recent movements
  const transactions = useLiveQuery(async () => {
    const txs = await db.transactions.toArray();
    const tithes = await db.tithes.toArray();
    
    const mappedTithes = tithes.map(t => ({
      id: t.id,
      userId: t.userId,
      accountId: '',
      categoryId: 'tithe',
      type: 'EXPENSE',
      amount: t.amount,
      date: t.date,
      notes: t.notes || 'Entrega de Diezmo',
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      deletedAt: t.deletedAt
    }));

    const all = [...txs, ...mappedTithes];
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  }) || [];
  
  // Calculate current month's stats (approximation)
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);
  
  const settings = useLiveQuery(() => db.settings.orderBy('id').first());

  const currentMonthTx = useLiveQuery(() => 
    db.transactions.where('date').aboveOrEqual(currentMonthStart.toISOString()).toArray()
  ) || [];

  const filteredTx = currentMonthTx.filter(tx => {
    if (selectedPeriod === 'MONTH') return true;
    const txDate = new Date(tx.date);
    const day = txDate.getDate();
    return selectedPeriod === 'Q1' ? (day >= 1 && day <= 15) : (day >= 16);
  });

  const incomes = filteredTx.filter(t => t.type === 'INCOME' && t.categoryId !== 'seed_transfer').reduce((acc, t) => acc + t.amount, 0);
  const expenses = filteredTx.filter(t => t.type === 'EXPENSE' && t.categoryId !== 'seed_transfer').reduce((acc, t) => acc + t.amount, 0);

  const activeSeedsCount = useLiveQuery(() => db.seedGoals.where('status').equals('ACTIVE').count()) || 0;

  const user = useLiveQuery(() => db.users.orderBy('id').first());
  const userName = user?.name ? user.name.split(' ')[0] : 'Usuario';

  const currentMonthVal = currentMonthStart.getMonth() + 1;
  const currentYearVal = currentMonthStart.getFullYear();
  const tithesThisMonth = useLiveQuery(() => {
    if (!user?.id) return [];
    return db.tithes.where('[month+year]').equals([currentMonthVal, currentYearVal]).filter(t => t.userId === user.id).toArray();
  }, [user?.id, currentMonthVal, currentYearVal]) || [];

  const filteredTithes = tithesThisMonth.filter(t => {
    if (selectedPeriod === 'MONTH') return true;
    const tDate = new Date(t.date);
    const day = tDate.getDate();
    return selectedPeriod === 'Q1' ? (day >= 1 && day <= 15) : (day >= 16);
  });

  const totalPaidTithe = filteredTithes.reduce((acc, t) => acc + t.amount, 0);
  const suggestedTithe = titheAmt !== null ? titheAmt : (incomes * (tithePct / 100));
  const pendingTithe = Math.max(0, suggestedTithe - totalPaidTithe);

  // Next upcoming commitment
  const nextCommitmentData = useLiveQuery<{ commitment: FinancialCommitment; dueDate: Date } | null>(async () => {
    if (!user?.id) return null;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const searchMonths = [
      { m: month, y: year },
      { m: month === 12 ? 1 : month + 1, y: month === 12 ? year + 1 : year },
    ];
    const all = await db.financialCommitments
      .where('ownerId').equals(user.id)
      .filter(c => c.deletedAt === null && c.status === 'ACTIVE')
      .toArray();
    let best: { commitment: FinancialCommitment; dueDate: Date } | null = null;
    for (const { m, y } of searchMonths) {
      for (const c of all) {
        if (!commitmentAppliesToMonth(c, m, y)) continue;
        const dueDate = getDueDateForMonth(c, m, y);
        if (!dueDate || dueDate < now) continue;
        if (!best || dueDate < best.dueDate) best = { commitment: c, dueDate };
      }
      if (best) break;
    }
    return best;
  }, [user?.id]);

  if (!isMounted) return null;

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      {/* Saludo */}
      <div className="flex flex-col gap-1 mt-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Hola, {userName}</h1>
        <p className="text-sm text-muted-foreground">Tu administración en paz y orden.</p>
      </div>

      {/* Balance Disponible */}
      <div 
        className="flex flex-col gap-2 items-center justify-center py-6 w-full overflow-hidden px-4 cursor-pointer transition-transform active:scale-[0.98]"
        onClick={(e) => { e.stopPropagation(); setExpandedSection(expandedSection === 'balance' ? null : 'balance'); }}
      >
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Balance Total</span>
        <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter text-foreground truncate max-w-full transition-all duration-300">
          {expandedSection === 'balance' ? formatMoney(totalBalance) : formatMoneyCompact(totalBalance)}
        </h2>
      </div>

      <div className="mb-2">
        <PeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} />
      </div>

      {/* Resumen del Mes */}
      <div className="flex flex-col gap-4">
        {/* Row 1: Ingresos / Gastos */}
        <div 
          className={cn(
            "grid gap-4 transition-all duration-500 ease-in-out",
            expandedSection === 'incomes' ? 'grid-cols-[2fr_1fr]' :
            expandedSection === 'expenses' ? 'grid-cols-[1fr_2fr]' : 'grid-cols-2'
          )}
        >
          <Card 
            className="rounded-3xl shadow-sm border-border/50 cursor-pointer overflow-hidden transition-colors hover:bg-muted/30"
            onClick={(e) => { e.stopPropagation(); setExpandedSection(expandedSection === 'incomes' ? null : 'incomes'); }}
          >
            <CardContent className="p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-success mb-1">
                <div className="bg-success/10 p-1 rounded-full">
                  <ArrowUpIcon className="w-3 h-3" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider truncate">Ingresos</span>
              </div>
              <span className="text-base sm:text-lg font-bold text-foreground tracking-tight truncate transition-all duration-300">
                {expandedSection === 'incomes' ? formatMoney(incomes) : formatMoneyCompact(incomes)}
              </span>
            </CardContent>
          </Card>
          
          <Card 
            className="rounded-3xl shadow-sm border-border/50 cursor-pointer overflow-hidden transition-colors hover:bg-muted/30"
            onClick={(e) => { e.stopPropagation(); setExpandedSection(expandedSection === 'expenses' ? null : 'expenses'); }}
          >
            <CardContent className="p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-destructive mb-1">
                <div className="bg-destructive/10 p-1 rounded-full">
                  <ArrowDownIcon className="w-3 h-3" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider truncate">Gastos</span>
              </div>
              <span className="text-base sm:text-lg font-bold text-foreground tracking-tight truncate transition-all duration-300">
                {expandedSection === 'expenses' ? formatMoney(expenses) : formatMoneyCompact(expenses)}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Diezmo / Semillas */}
        <div 
          className={cn(
            "grid gap-4 transition-all duration-500 ease-in-out",
            expandedSection === 'tithe' ? 'grid-cols-[2fr_1fr]' : 'grid-cols-2'
          )}
        >
          <Card 
            className="rounded-3xl shadow-sm border-border/50 bg-gold/5 border-gold/20 cursor-pointer overflow-hidden transition-colors hover:bg-gold/10"
            onClick={(e) => { e.stopPropagation(); setExpandedSection(expandedSection === 'tithe' ? null : 'tithe'); }}
          >
            <CardContent className="p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-gold mb-1">
                <div className="bg-gold/10 p-1 rounded-full">
                  <HandHeart className="w-3 h-3" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider truncate">Diezmo</span>
              </div>
              <span className="text-base sm:text-lg font-bold text-foreground tracking-tight truncate transition-all duration-300">
                {expandedSection === 'tithe' ? formatMoney(pendingTithe) : formatMoneyCompact(pendingTithe)}
              </span>
              <span className="text-[10px] text-muted-foreground truncate">Pendiente</span>
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-sm border-border/50 bg-secondary/10 border-secondary/20 overflow-hidden">
            <CardContent className="p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-primary mb-1">
                <div className="bg-primary/10 p-1 rounded-full">
                  <Droplet className="w-3 h-3" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider truncate">Semillas</span>
              </div>
              <span className="text-lg font-bold text-foreground truncate">{activeSeedsCount}</span>
              <span className="text-[10px] text-muted-foreground truncate">En crecimiento</span>
            </CardContent>
          </Card>
        </div>
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

      {/* Próximo Compromiso */}
      {nextCommitmentData && (
        <NextCommitmentCard
          commitment={nextCommitmentData.commitment}
          dueDate={nextCommitmentData.dueDate}
        />
      )}

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
            <TransactionCard key={tx.id} tx={tx} />
          ))}
        </div>
      </div>
      {settings && !settings.hasSelectedPlanningMode && (
        <PlanningModeModal 
          settings={settings} 
          onComplete={() => {
            // forces re-render if needed, but Dexie hook will update
          }} 
        />
      )}
    </div>
  );
}
