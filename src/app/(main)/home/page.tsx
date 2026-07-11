import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowDownIcon, ArrowUpIcon, Droplet, HandHeart, Plus } from 'lucide-react'
import Link from 'next/link'
import prisma from '@/lib/prisma'

export default async function HomePage() {
  const latestVerse = await prisma.dailyVerse.findFirst({
    orderBy: { date: 'desc' }
  })

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      {/* Saludo */}
      <div className="flex flex-col gap-1 mt-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Hola, Gianluca</h1>
        <p className="text-sm text-muted-foreground">Tu administración en paz y orden.</p>
      </div>

      {/* Versículo Diario (Opcional) */}
      <Card className="bg-primary/5 border-none shadow-none rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Droplet className="w-24 h-24" />
        </div>
        <CardContent className="p-6">
          <p className="text-sm font-medium italic text-primary/90 leading-relaxed">
            "{latestVerse?.verse || 'Donde esté tu tesoro, allí estará también tu corazón.'}"
          </p>
          <p className="text-xs text-primary/70 mt-2 font-semibold">
            {latestVerse?.reference || 'MATEO 6:21'}
          </p>
        </CardContent>
      </Card>

      {/* Balance Disponible */}
      <div className="flex flex-col gap-2 items-center justify-center py-6">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Balance Total</span>
        <h2 className="text-5xl font-bold tracking-tighter text-foreground">$ 1,245.50</h2>
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
            <span className="text-lg font-bold text-foreground">$ 3,500.00</span>
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
            <span className="text-lg font-bold text-foreground">$ 1,820.00</span>
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
            <span className="text-lg font-bold text-foreground">$ 350.00</span>
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
            <span className="text-lg font-bold text-foreground">3</span>
            <span className="text-[10px] text-muted-foreground">En crecimiento</span>
          </CardContent>
        </Card>
      </div>

      {/* Accesos Rápidos (Botones rápidos adicionales) */}
      <div className="grid grid-cols-4 gap-2 mt-2">
        <Link href="/register-tx?type=INCOME" className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center">
            <ArrowUpIcon className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium">Ingreso</span>
        </Link>
        <Link href="/register-tx?type=EXPENSE" className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
            <ArrowDownIcon className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium">Gasto</span>
        </Link>
        <Link href="/seeds" className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-secondary/20 text-secondary-foreground flex items-center justify-center">
            <Droplet className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium">Regar</span>
        </Link>
        <Link href="/tithe" className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-gold/10 text-gold flex items-center justify-center">
            <HandHeart className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium">Diezmo</span>
        </Link>
      </div>

      {/* Últimos Movimientos */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Últimos movimientos</h3>
          <Link href="/transactions" className="text-xs font-medium text-primary hover:underline">Ver todos</Link>
        </div>
        
        <div className="flex flex-col gap-3">
          {/* Placeholder para transacciones */}
          <div className="flex items-center justify-between p-4 rounded-3xl bg-card border border-border/50 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                🛒
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">Supermercado</p>
                <p className="text-xs text-muted-foreground">Hoy</p>
              </div>
            </div>
            <span className="font-semibold text-destructive">- $ 120.00</span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-3xl bg-card border border-border/50 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                💼
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">Honorarios</p>
                <p className="text-xs text-muted-foreground">Ayer</p>
              </div>
            </div>
            <span className="font-semibold text-success">+ $ 800.00</span>
          </div>
        </div>
      </div>
    </div>
  )
}
