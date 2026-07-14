'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { ArrowLeft, History, Search, SlidersHorizontal, X, Download } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { formatMoney } from '@/lib/utils';
import { TransactionCard } from '@/components/transactions/TransactionCard';
import { ExportModal } from '@/components/transactions/ExportModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type QuickFilter = 'ALL' | 'INCOME' | 'EXPENSE' | 'WATER' | 'HARVEST' | 'TITHE';

const CATEGORIES = [
  { id: 'supermarket', label: 'Supermercado' },
  { id: 'housing', label: 'Hogar' },
  { id: 'transport', label: 'Transporte' },
  { id: 'food', label: 'Comida' },
  { id: 'health', label: 'Salud' },
  { id: 'education', label: 'Educación' },
  { id: 'entertainment', label: 'Entretenimiento' },
  { id: 'services', label: 'Servicios' },
  { id: 'clothing', label: 'Ropa' },
  { id: 'salary', label: 'Salario' },
  { id: 'freelance', label: 'Freelance' },
  { id: 'gifts', label: 'Regalos' },
  { id: 'investments', label: 'Inversiones' },
  { id: 'business', label: 'Negocio' },
  { id: 'other', label: 'Otros' }
];

const TYPES = [
  { id: 'INCOME', label: 'Ingreso' },
  { id: 'EXPENSE', label: 'Gasto' },
  { id: 'WATER', label: 'Riego' },
  { id: 'HARVEST', label: 'Cosecha' },
  { id: 'TITHE', label: 'Diezmo' }
];

export default function TransactionsPage() {
  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const totalBalance = accounts.reduce((acc, account) => acc + account.balance, 0);

  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('ALL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [advFilters, setAdvFilters] = useState<{
    dateFrom: string;
    dateTo: string;
    types: string[];
    categories: string[];
  }>({
    dateFrom: '',
    dateTo: '',
    types: [],
    categories: []
  });

  const rawTransactions = useLiveQuery(async () => {
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
    return all.sort((a, b) => {
      // Comparar por fecha (solo día, ignorando hora si es posible, o directamente el tiempo)
      // Como guardamos la fecha completa en date, usaremos el valor de date.
      // Pero si dateStr viene de input type date, su UTC podría variar. Usamos getTime.
      const d1 = new Date(a.date);
      const d2 = new Date(b.date);
      
      const dateA = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime();
      const dateB = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime();
      
      if (dateB !== dateA) return dateB - dateA;
      
      // Si son del mismo día, ordenar por hora de registro
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }) || [];

  const filteredTransactions = useMemo(() => {
    return rawTransactions.filter(tx => {
      const isSeed = tx.notes?.toLowerCase().includes('semilla');
      const isTithe = tx.categoryId === 'tithe' || tx.notes?.toLowerCase().includes('diezmo');
      const txTypeGroup = isTithe ? 'TITHE' 
        : isSeed ? (tx.type === 'INCOME' ? 'HARVEST' : 'WATER') 
        : tx.type;

      // 1. Search Query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!tx.notes?.toLowerCase().includes(query)) return false;
      }

      // 2. Quick Filter
      if (quickFilter !== 'ALL') {
        if (quickFilter !== txTypeGroup) return false;
      }

      // 3. Advanced Filters
      if (advFilters.dateFrom && new Date(tx.date) < new Date(advFilters.dateFrom)) return false;
      if (advFilters.dateTo && new Date(tx.date) > new Date(advFilters.dateTo)) return false;
      
      if (advFilters.types.length > 0) {
        if (!advFilters.types.includes(txTypeGroup)) return false;
      }

      if (advFilters.categories.length > 0) {
        if (!tx.categoryId || !advFilters.categories.includes(tx.categoryId)) return false;
      }

      return true;
    });
  }, [rawTransactions, searchQuery, quickFilter, advFilters]);

  const groupedTransactions = useMemo(() => {
    const groups: { dateKey: string; dateObj: Date; txs: typeof filteredTransactions }[] = [];
    
    filteredTransactions.forEach(tx => {
      const d = new Date(tx.date);
      const dateKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      
      let group = groups.find(g => g.dateKey === dateKey);
      if (!group) {
        group = { dateKey, dateObj: d, txs: [] };
        groups.push(group);
      }
      group.txs.push(tx);
    });
    
    return groups;
  }, [filteredTransactions]);

  const dailyBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    let currentBal = totalBalance;
    
    // Agrupar todas las transacciones sin filtro para poder restarlas cronológicamente
    const rawGroups: { dateKey: string; txs: typeof rawTransactions }[] = [];
    rawTransactions.forEach(tx => {
      const d = new Date(tx.date);
      const dateKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      let group = rawGroups.find(g => g.dateKey === dateKey);
      if (!group) {
        group = { dateKey, txs: [] };
        rawGroups.push(group);
      }
      group.txs.push(tx);
    });

    // Como rawTransactions ya está ordenado de más reciente a más antiguo
    rawGroups.forEach(group => {
      balances[group.dateKey] = currentBal;
      
      const netFlow = group.txs.reduce((acc, tx) => {
        return tx.type === 'INCOME' ? acc + tx.amount : acc - tx.amount;
      }, 0);
      
      currentBal -= netFlow;
    });

    return balances;
  }, [rawTransactions, totalBalance]);

  const toggleAdvType = (typeId: string) => {
    setAdvFilters(prev => ({
      ...prev,
      types: prev.types.includes(typeId) 
        ? prev.types.filter(t => t !== typeId)
        : [...prev.types, typeId]
    }));
  };

  const toggleAdvCategory = (catId: string) => {
    setAdvFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(catId) 
        ? prev.categories.filter(c => c !== catId)
        : [...prev.categories, catId]
    }));
  };

  const clearAdvFilters = () => {
    setAdvFilters({ dateFrom: '', dateTo: '', types: [], categories: [] });
  };

  const formatDateGroup = (dateObj: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = dateObj.getDate() === today.getDate() && dateObj.getMonth() === today.getMonth() && dateObj.getFullYear() === today.getFullYear();
    const isYesterday = dateObj.getDate() === yesterday.getDate() && dateObj.getMonth() === yesterday.getMonth() && dateObj.getFullYear() === yesterday.getFullYear();

    if (isToday) return 'Hoy';
    if (isYesterday) return 'Ayer';

    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    if (dateObj.getFullYear() !== today.getFullYear()) {
      return `${dateObj.getDate()} de ${months[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;
    }
    return `${dateObj.getDate()} de ${months[dateObj.getMonth()]}`;
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8 relative">
      
      <div className="flex items-center gap-4 mb-2">
        <Link href="/home" className="text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2 shrink-0">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Volver</span>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-foreground flex-1">Todos los movimientos</h1>
        <Button variant="outline" size="icon" onClick={() => setIsExportModalOpen(true)} className="rounded-2xl shrink-0 h-10 w-10 text-muted-foreground hover:text-foreground">
          <Download className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {/* Search & Filter Button */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className={`shrink-0 rounded-2xl h-12 w-12 ${
              advFilters.types.length || advFilters.categories.length || advFilters.dateFrom || advFilters.dateTo
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-card border-border shadow-sm'
            }`}
            onClick={() => setIsModalOpen(true)}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </Button>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar movimientos..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-12 pl-10 rounded-2xl bg-card border-border shadow-sm"
            />
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 snap-x hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'INCOME', label: 'Ingresos' },
            { id: 'EXPENSE', label: 'Gastos' },
            { id: 'WATER', label: 'Riego' },
            { id: 'HARVEST', label: 'Cosecha' },
            { id: 'TITHE', label: 'Diezmos' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setQuickFilter(f.id as QuickFilter)}
              className={`snap-start shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                quickFilter === f.id 
                  ? 'bg-foreground text-background shadow-md' 
                  : 'bg-card border border-border/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {groupedTransactions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <History className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">No hay movimientos para mostrar.</p>
          </div>
        )}
        
        {groupedTransactions.map(group => {
          const groupSubtotal = group.txs.reduce((acc, tx) => {
            return tx.type === 'INCOME' ? acc + tx.amount : acc - tx.amount;
          }, 0);

          const trueDailyBalance = dailyBalances[group.dateKey] || 0;
          const hasActiveFilters = quickFilter !== 'ALL' || searchQuery.trim() !== '' || 
                                   advFilters.types.length > 0 || advFilters.categories.length > 0 ||
                                   advFilters.dateFrom !== '' || advFilters.dateTo !== '';

          return (
            <div key={group.dateKey} className="flex flex-col gap-3">
              <div className="flex items-start justify-between mt-2 ml-1 mr-1">
                <h3 className="text-sm font-semibold text-muted-foreground tracking-tight">
                  {formatDateGroup(group.dateObj)}
                </h3>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-semibold text-foreground">
                    Balance del día: {trueDailyBalance < 0 ? '-' : ''}{formatMoney(Math.abs(trueDailyBalance))}
                  </span>
                  {hasActiveFilters && (
                    <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
                      Movimientos: {groupSubtotal < 0 ? '-' : (groupSubtotal > 0 ? '+' : '')}{formatMoney(Math.abs(groupSubtotal))}
                    </span>
                  )}
                </div>
              </div>
              {group.txs.map(tx => (
                <TransactionCard key={tx.id} tx={tx} />
              ))}
            </div>
          );
        })}
      </div>

      {/* Advanced Filters Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
          <div className="bg-background rounded-t-[2rem] sm:rounded-3xl w-full max-w-md animate-in slide-in-from-bottom-1/2 sm:zoom-in-95 shadow-xl flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden">
            
            {/* Header - Sticky */}
            <div className="p-6 pb-4 shrink-0 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">Filtros Avanzados</h2>
                {(advFilters.types.length > 0 || advFilters.categories.length > 0 || advFilters.dateFrom || advFilters.dateTo) ? (
                  <Button variant="ghost" size="sm" onClick={clearAdvFilters} className="text-muted-foreground text-xs hover:text-foreground h-8 px-2">
                    Limpiar
                  </Button>
                ) : null}
              </div>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 shrink-0" onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto hide-scrollbar flex flex-col gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Fechas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Desde</label>
                    <Input 
                      type="date" 
                      value={advFilters.dateFrom} 
                      onChange={e => setAdvFilters(p => ({ ...p, dateFrom: e.target.value }))}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Hasta</label>
                    <Input 
                      type="date" 
                      value={advFilters.dateTo} 
                      onChange={e => setAdvFilters(p => ({ ...p, dateTo: e.target.value }))}
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tipos</h3>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map(type => {
                    const isActive = advFilters.types.includes(type.id);
                    return (
                      <button
                        key={type.id}
                        onClick={() => toggleAdvType(type.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                          isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted/50 text-muted-foreground border border-border/50'
                        }`}
                      >
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Categorías</h3>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => {
                    const isActive = advFilters.categories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleAdvCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                          isActive ? 'bg-foreground text-background' : 'bg-muted/50 text-muted-foreground border border-border/50'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer - Sticky */}
            <div className="p-6 pt-4 pb-28 sm:pb-6 shrink-0 border-t border-border/50 flex items-center gap-3 bg-background sm:rounded-b-3xl">
              <Button variant="outline" className="flex-1 h-12 rounded-2xl" onClick={clearAdvFilters}>
                Limpiar todo
              </Button>
              <Button className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground" onClick={() => setIsModalOpen(false)}>
                Ver Resultados
              </Button>
            </div>

          </div>
        </div>
      )}

      {isExportModalOpen && <ExportModal onClose={() => setIsExportModalOpen(false)} />}

    </div>
  );
}
