'use client';

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlantAvatar } from '@/components/seeds/PlantAvatar'
import { SeedService } from '@/services/seedService'
import { db } from '@/lib/db'

export default function NewSeedPage() {
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const targetAmount = parseFloat(formData.get('targetAmount') as string);
    
    if (name && targetAmount > 0) {
      const user = await db.users.orderBy('id').first();
      if (!user) return;

      await SeedService.createSeedGoal({
        userId: user.id,
        name,
        targetAmount,
        currentAmount: 0,
        status: 'ACTIVE',
        targetDate: null
      });
      
      router.push('/seeds');
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      
      <div className="flex items-center gap-4 mt-2">
        <Link href="/seeds" className="text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Volver</span>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Plantar nueva semilla</h1>
      </div>

      <div className="flex justify-center my-6">
        <div className="w-48 h-48 rounded-full bg-secondary/10 flex items-center justify-center overflow-hidden border border-secondary/20 shadow-inner">
          <PlantAvatar progress={0} className="w-full h-full transform scale-125" />
        </div>
      </div>

      <form onSubmit={handleCreate} className="flex flex-col gap-6">
        
        <div className="space-y-2">
          <Label htmlFor="name" className="text-xs text-muted-foreground ml-2">¿Qué propósito tiene esta semilla?</Label>
          <Input 
            id="name" 
            name="name" 
            placeholder="Ej: Fondo de Emergencia, Nueva Laptop..." 
            required 
            className="h-14 rounded-2xl bg-card border-border shadow-sm px-4 focus-visible:ring-primary text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetAmount" className="text-xs text-muted-foreground ml-2">Meta a cosechar ($)</Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground">
              $
            </div>
            <Input 
              id="targetAmount" 
              name="targetAmount" 
              type="number" 
              placeholder="0.00" 
              required 
              min="1"
              step="0.01"
              className="h-14 pl-8 rounded-2xl bg-card border-border shadow-sm pr-4 focus-visible:ring-primary text-base font-semibold"
            />
          </div>
        </div>

        <Button className="w-full h-14 rounded-full mt-4 shadow-md font-medium text-lg bg-primary hover:bg-primary/90 text-primary-foreground">
          Plantar Semilla
        </Button>
      </form>
    </div>
  )
}
