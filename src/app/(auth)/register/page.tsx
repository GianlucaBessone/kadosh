import { Leaf, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { register } from '@/features/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in zoom-in duration-500">
      
      <Link href="/login" className="self-start text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2 mb-2">
        <ArrowLeft className="h-5 w-5" />
        <span className="sr-only">Volver</span>
      </Link>

      <div className="flex flex-col items-start mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <Leaf className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Crear cuenta</h1>
        <p className="text-sm text-muted-foreground mt-2">Comienza a administrar con sabiduría.</p>
      </div>

      <form action={register} className="flex flex-col gap-4">
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs text-muted-foreground ml-2">Nombre</Label>
            <Input 
              id="name" 
              name="name" 
              placeholder="Tu nombre" 
              required 
              className="h-12 rounded-2xl bg-card border-border shadow-sm px-4 focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-xs text-muted-foreground ml-2">Apellido</Label>
            <Input 
              id="lastName" 
              name="lastName" 
              placeholder="Tu apellido" 
              required 
              className="h-12 rounded-2xl bg-card border-border shadow-sm px-4 focus-visible:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs text-muted-foreground ml-2">Email</Label>
          <Input 
            id="email" 
            name="email" 
            placeholder="ejemplo@correo.com" 
            type="email" 
            required 
            className="h-12 rounded-2xl bg-card border-border shadow-sm px-4 focus-visible:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs text-muted-foreground ml-2">Contraseña</Label>
          <Input 
            id="password" 
            name="password" 
            placeholder="••••••••" 
            type="password" 
            required 
            minLength={6}
            className="h-12 rounded-2xl bg-card border-border shadow-sm px-4 focus-visible:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground ml-2">Confirmar Contraseña</Label>
          <Input 
            id="confirmPassword" 
            name="confirmPassword" 
            placeholder="••••••••" 
            type="password" 
            required 
            minLength={6}
            className="h-12 rounded-2xl bg-card border-border shadow-sm px-4 focus-visible:ring-primary"
          />
        </div>

        <div className="flex items-start mt-2">
          <input type="checkbox" id="terms" required className="mt-1 mr-3 h-4 w-4 rounded-full border-border text-primary focus:ring-primary bg-card" />
          <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground leading-snug">
            Acepto los términos y condiciones, y confirmo que deseo administrar mis finanzas con paz y orden.
          </Label>
        </div>

        <Button className="w-full h-12 rounded-full mt-4 shadow-sm font-medium" type="submit">
          Crear cuenta
        </Button>
      </form>
    </div>
  )
}
