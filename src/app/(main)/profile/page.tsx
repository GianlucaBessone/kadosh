import { User, Settings, Moon, Bell, Download, LogOut, BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { logout } from '@/features/auth/actions'

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      
      <div className="flex items-center gap-4 mt-2 mb-2">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <User className="w-8 h-8" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Gianluca</h1>
          <p className="text-sm text-muted-foreground">gianluca@correo.com</p>
        </div>
      </div>

      <div className="space-y-4 mt-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground ml-2">Configuración</h3>
        
        <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
          <CardContent className="p-0 divide-y divide-border/50">
            
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="bg-muted p-2 rounded-full text-foreground"><Moon className="w-4 h-4" /></div>
                <Label htmlFor="dark-mode" className="text-sm font-medium">Modo Oscuro</Label>
              </div>
              <Switch id="dark-mode" />
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="bg-success/10 p-2 rounded-full text-success"><Bell className="w-4 h-4" /></div>
                <Label htmlFor="notifications" className="text-sm font-medium">Notificaciones</Label>
              </div>
              <Switch id="notifications" defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full text-primary"><BookOpen className="w-4 h-4" /></div>
                <Label htmlFor="daily-verse" className="text-sm font-medium">Versículo Diario</Label>
              </div>
              <Switch id="daily-verse" defaultChecked />
            </div>
            
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 mt-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground ml-2">Datos y Cuenta</h3>
        
        <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
          <CardContent className="p-0 divide-y divide-border/50">
            
            <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="bg-muted p-2 rounded-full text-foreground"><Download className="w-4 h-4" /></div>
                <span className="text-sm font-medium">Exportar mis datos</span>
              </div>
            </button>

            <form action={logout}>
              <button type="submit" className="w-full flex items-center justify-between p-4 hover:bg-destructive/5 transition-colors text-left">
                <div className="flex items-center gap-3 text-destructive">
                  <div className="bg-destructive/10 p-2 rounded-full"><LogOut className="w-4 h-4" /></div>
                  <span className="text-sm font-medium">Cerrar Sesión</span>
                </div>
              </button>
            </form>
            
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
