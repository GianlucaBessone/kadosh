'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingCart, Home, Car, Utensils, Pill, BookOpen, Film, Lightbulb, Shirt, Package, Briefcase, Laptop, Gift, TrendingUp, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { TransactionService } from '@/services/transactionService';
import { db } from '@/lib/db';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { MotivationalModal } from '@/components/transactions/MotivationalModal';
import { soundService } from '@/lib/SoundService';
import { toast } from 'sonner';

export default function RegisterTransactionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showMotivationalModal, setShowMotivationalModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setIsMounted(true);
  }, []);
  
  const typeParam = searchParams.get('type');
  const defaultTab = typeParam === 'INCOME' ? 'income' : 'expense';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, type: 'INCOME' | 'EXPENSE' | 'TRANSFER') => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const amountStr = formData.get('amount')?.toString() || '';
      const categoryId = formData.get('category')?.toString() || null;
      const dateStr = formData.get('date')?.toString() || '';
      const notes = formData.get('notes')?.toString() || null;

      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
        soundService.play('error');
        setError('El monto ingresado es inválido o debe ser mayor a 0.');
        setLoading(false);
        return;
      }

      // Get first account
      let account = await db.accounts.orderBy('id').first();
      
      // If no account exists (offline first setup without sync), create a default one
      if (!account) {
        // Find user or create local user
        let user = await db.users.orderBy('id').first();
        if (!user) {
           const userId = crypto.randomUUID();
           user = { id: userId, email: '', name: 'Usuario', lastName: '', avatarUrl: null, isCloudLinked: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: null };
           await db.users.add(user);
        }
        
        const { AccountService } = await import('@/services/accountService');
        account = await AccountService.createAccount({
          userId: user.id,
          name: 'Cuenta Principal',
          balance: 0,
        });
      }

      await TransactionService.createTransaction({
        userId: account.userId,
        accountId: account.id,
        categoryId,
        type,
        amount,
        date: new Date(dateStr).toISOString(),
        notes,
      });

      soundService.play('success');

      if (type === 'INCOME') {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        
        const previousIncomesThisMonth = await db.transactions
          .where('date').aboveOrEqual(startOfMonth)
          .filter(t => t.type === 'INCOME' && t.categoryId !== 'seed_transfer')
          .count();
          
        const activeSeeds = await db.seedGoals.filter(s => s.status !== 'HARVESTED').count();
        const activeTithes = await db.tithes.where('[month+year]').equals([now.getMonth() + 1, now.getFullYear()]).count();
        
        if (previousIncomesThisMonth <= 1 && activeSeeds === 0 && activeTithes === 0) {
          setShowMotivationalModal(true);
          setLoading(false);
          return;
        }
      }

      router.push('/home');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      toast.error('Error al guardar la transacción');
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      
      <div className="flex items-center gap-4 mb-2">
        <Link href="/home" className="text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Volver</span>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Registrar movimiento</h1>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 rounded-full h-12 p-1">
          <TabsTrigger value="expense" className="rounded-full data-[state=active]:bg-card data-[state=active]:text-destructive data-[state=active]:shadow-sm">Gasto</TabsTrigger>
          <TabsTrigger value="income" className="rounded-full data-[state=active]:bg-card data-[state=active]:text-success data-[state=active]:shadow-sm">Ingreso</TabsTrigger>
        </TabsList>

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {/* GASTO */}
        <TabsContent value="expense" className="mt-6 space-y-6">
          <form className="flex flex-col gap-6" onSubmit={(e) => handleSubmit(e, 'EXPENSE')}>
            
            {/* Monto Grande */}
            <div className="flex flex-col items-center justify-center py-6 bg-card rounded-3xl border border-border/50 shadow-sm px-4">
              <span className="text-sm text-muted-foreground uppercase font-medium tracking-wider mb-2">Monto</span>
              <div className="flex items-center text-4xl font-bold text-destructive w-full justify-center">
                <span className="mr-2 text-2xl opacity-50">$</span>
                <MoneyInput 
                  name="amount"
                  autoFocus
                  placeholder="0,00" 
                  required
                  baseTextSize="text-4xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-xs text-muted-foreground ml-2">Categoría</Label>
              <Select name="category" required>
                <SelectTrigger id="category" className="w-full h-12 rounded-2xl bg-card border-border shadow-sm px-4 focus:ring-primary focus:ring-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-base">
                  <SelectValue placeholder="Selecciona una categoría..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="supermarket"><div className="flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-muted-foreground" /> Supermercado</div></SelectItem>
                  <SelectItem value="housing"><div className="flex items-center gap-2"><Home className="w-4 h-4 text-muted-foreground" /> Hogar</div></SelectItem>
                  <SelectItem value="transport"><div className="flex items-center gap-2"><Car className="w-4 h-4 text-muted-foreground" /> Transporte</div></SelectItem>
                  <SelectItem value="food"><div className="flex items-center gap-2"><Utensils className="w-4 h-4 text-muted-foreground" /> Comida / Restaurantes</div></SelectItem>
                  <SelectItem value="health"><div className="flex items-center gap-2"><Pill className="w-4 h-4 text-muted-foreground" /> Salud</div></SelectItem>
                  <SelectItem value="education"><div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-muted-foreground" /> Educación</div></SelectItem>
                  <SelectItem value="entertainment"><div className="flex items-center gap-2"><Film className="w-4 h-4 text-muted-foreground" /> Entretenimiento</div></SelectItem>
                  <SelectItem value="services"><div className="flex items-center gap-2"><Lightbulb className="w-4 h-4 text-muted-foreground" /> Servicios</div></SelectItem>
                  <SelectItem value="clothing"><div className="flex items-center gap-2"><Shirt className="w-4 h-4 text-muted-foreground" /> Ropa</div></SelectItem>
                  <SelectItem value="other"><div className="flex items-center gap-2"><Package className="w-4 h-4 text-muted-foreground" /> Otros</div></SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-xs text-muted-foreground ml-2">Fecha</Label>
              <Input 
                id="date" 
                name="date"
                type="date" 
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className="h-12 rounded-2xl bg-card border-border shadow-sm px-4 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-xs text-muted-foreground ml-2">Notas (Opcional)</Label>
              <Input 
                id="notes" 
                name="notes"
                placeholder="Ej. Compra semanal" 
                className="h-12 rounded-2xl bg-card border-border shadow-sm px-4 focus-visible:ring-primary"
              />
            </div>

            <Button disabled={loading} className="w-full h-14 rounded-full mt-4 shadow-md font-medium text-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {loading ? 'Guardando...' : 'Guardar Gasto'}
            </Button>
          </form>
        </TabsContent>

        {/* INGRESO */}
        <TabsContent value="income" className="mt-6 space-y-6">
          <form className="flex flex-col gap-6" onSubmit={(e) => handleSubmit(e, 'INCOME')}>
            <div className="flex flex-col items-center justify-center py-6 bg-card rounded-3xl border border-border/50 shadow-sm px-4">
              <span className="text-sm text-muted-foreground uppercase font-medium tracking-wider mb-2">Monto</span>
              <div className="flex items-center text-4xl font-bold text-success w-full justify-center">
                <span className="mr-2 text-2xl opacity-50">$</span>
                <MoneyInput 
                  name="amount"
                  placeholder="0,00" 
                  required
                  baseTextSize="text-4xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-income" className="text-xs text-muted-foreground ml-2">Categoría</Label>
              <Select name="category" required>
                <SelectTrigger id="category-income" className="w-full h-12 rounded-2xl bg-card border-border shadow-sm px-4 focus:ring-primary focus:ring-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-base">
                  <SelectValue placeholder="Selecciona una categoría..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="salary"><div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-muted-foreground" /> Salario</div></SelectItem>
                  <SelectItem value="freelance"><div className="flex items-center gap-2"><Laptop className="w-4 h-4 text-muted-foreground" /> Freelance</div></SelectItem>
                  <SelectItem value="gifts"><div className="flex items-center gap-2"><Gift className="w-4 h-4 text-muted-foreground" /> Regalos</div></SelectItem>
                  <SelectItem value="investments"><div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-muted-foreground" /> Inversiones</div></SelectItem>
                  <SelectItem value="business"><div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" /> Negocio</div></SelectItem>
                  <SelectItem value="other"><div className="flex items-center gap-2"><Package className="w-4 h-4 text-muted-foreground" /> Otros</div></SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-income" className="text-xs text-muted-foreground ml-2">Fecha</Label>
              <Input 
                id="date-income" 
                name="date"
                type="date" 
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className="h-12 rounded-2xl bg-card border-border shadow-sm px-4 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes-income" className="text-xs text-muted-foreground ml-2">Notas (Opcional)</Label>
              <Input 
                id="notes-income"
                name="notes" 
                placeholder="Ej. Pago de cliente" 
                className="h-12 rounded-2xl bg-card border-border shadow-sm px-4 focus-visible:ring-primary"
              />
            </div>

            <Button disabled={loading} className="w-full h-14 rounded-full mt-4 shadow-md font-medium text-lg bg-success hover:bg-success/90 text-success-foreground">
              {loading ? 'Guardando...' : 'Guardar Ingreso'}
            </Button>
          </form>
        </TabsContent>

      </Tabs>

      {showMotivationalModal && (
        <MotivationalModal onClose={() => router.push('/home')} />
      )}
    </div>
  )
}
