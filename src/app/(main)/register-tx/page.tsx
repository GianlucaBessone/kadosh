import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function RegisterTransactionPage() {
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in zoom-in duration-500 pb-8">
      
      <div className="flex items-center gap-4 mb-2">
        <Link href="/home" className="text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Volver</span>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Registrar movimiento</h1>
      </div>

      <Tabs defaultValue="expense" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 rounded-full h-12 p-1">
          <TabsTrigger value="expense" className="rounded-full data-[state=active]:bg-card data-[state=active]:text-destructive data-[state=active]:shadow-sm">Gasto</TabsTrigger>
          <TabsTrigger value="income" className="rounded-full data-[state=active]:bg-card data-[state=active]:text-success data-[state=active]:shadow-sm">Ingreso</TabsTrigger>
          <TabsTrigger value="transfer" className="rounded-full data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">Transferencia</TabsTrigger>
        </TabsList>

        {/* GASTO */}
        <TabsContent value="expense" className="mt-6 space-y-6">
          <form className="flex flex-col gap-6">
            
            {/* Monto Grande */}
            <div className="flex flex-col items-center justify-center py-6 bg-card rounded-3xl border border-border/50 shadow-sm">
              <span className="text-sm text-muted-foreground uppercase font-medium tracking-wider mb-2">Monto</span>
              <div className="flex items-center text-4xl font-bold text-destructive">
                <span className="mr-2 text-2xl opacity-50">$</span>
                <input 
                  type="number" 
                  autoFocus
                  placeholder="0.00" 
                  className="bg-transparent border-none outline-none w-32 text-center text-foreground placeholder:text-muted-foreground/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-xs text-muted-foreground ml-2">Categoría</Label>
              <select 
                id="category" 
                className="flex h-12 w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Selecciona una categoría...</option>
                <option value="supermarket">Supermercado</option>
                <option value="housing">Hogar</option>
                <option value="transport">Transporte</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-xs text-muted-foreground ml-2">Fecha</Label>
              <Input 
                id="date" 
                type="date" 
                defaultValue={new Date().toISOString().split('T')[0]}
                className="h-12 rounded-2xl bg-card border-border shadow-sm px-4 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-xs text-muted-foreground ml-2">Notas (Opcional)</Label>
              <Input 
                id="notes" 
                placeholder="Ej. Compra semanal" 
                className="h-12 rounded-2xl bg-card border-border shadow-sm px-4 focus-visible:ring-primary"
              />
            </div>

            <Button className="w-full h-14 rounded-full mt-4 shadow-md font-medium text-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Guardar Gasto
            </Button>
          </form>
        </TabsContent>

        {/* INGRESO */}
        <TabsContent value="income" className="mt-6 space-y-6">
          <form className="flex flex-col gap-6">
            <div className="flex flex-col items-center justify-center py-6 bg-card rounded-3xl border border-border/50 shadow-sm">
              <span className="text-sm text-muted-foreground uppercase font-medium tracking-wider mb-2">Monto</span>
              <div className="flex items-center text-4xl font-bold text-success">
                <span className="mr-2 text-2xl opacity-50">$</span>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  className="bg-transparent border-none outline-none w-32 text-center text-foreground placeholder:text-muted-foreground/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-income" className="text-xs text-muted-foreground ml-2">Categoría</Label>
              <select 
                id="category-income" 
                className="flex h-12 w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecciona una categoría...</option>
                <option value="salary">Salario</option>
                <option value="freelance">Freelance</option>
                <option value="gifts">Regalos</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-income" className="text-xs text-muted-foreground ml-2">Fecha</Label>
              <Input 
                id="date-income" 
                type="date" 
                defaultValue={new Date().toISOString().split('T')[0]}
                className="h-12 rounded-2xl bg-card border-border shadow-sm px-4 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes-income" className="text-xs text-muted-foreground ml-2">Notas (Opcional)</Label>
              <Input 
                id="notes-income" 
                placeholder="Ej. Pago de cliente" 
                className="h-12 rounded-2xl bg-card border-border shadow-sm px-4 focus-visible:ring-primary"
              />
            </div>

            <Button className="w-full h-14 rounded-full mt-4 shadow-md font-medium text-lg bg-success hover:bg-success/90 text-success-foreground">
              Guardar Ingreso
            </Button>
          </form>
        </TabsContent>

        {/* TRANSFERENCIA */}
        <TabsContent value="transfer" className="mt-6 space-y-6">
          <form className="flex flex-col gap-6">
             <div className="flex flex-col items-center justify-center py-6 bg-card rounded-3xl border border-border/50 shadow-sm">
              <span className="text-sm text-muted-foreground uppercase font-medium tracking-wider mb-2">Monto</span>
              <div className="flex items-center text-4xl font-bold text-primary">
                <span className="mr-2 text-2xl opacity-50">$</span>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  className="bg-transparent border-none outline-none w-32 text-center text-foreground placeholder:text-muted-foreground/30"
                />
              </div>
            </div>
             <Button className="w-full h-14 rounded-full mt-4 shadow-md font-medium text-lg">
              Registrar Transferencia
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
