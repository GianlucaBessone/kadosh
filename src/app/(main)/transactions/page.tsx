'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { ArrowLeft, History } from 'lucide-react';
import Link from 'next/link';

export default function TransactionsPage() {
  const transactions = useLiveQuery(() => 
    db.transactions.orderBy('date').reverse().toArray()
  ) || [];

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      
      <div className="flex items-center gap-4 mb-2">
        <Link href="/home" className="text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Volver</span>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Todos los movimientos</h1>
      </div>

      <div className="flex flex-col gap-3">
        {transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <History className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">No hay movimientos registrados.</p>
          </div>
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
  );
}
