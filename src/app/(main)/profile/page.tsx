'use client';

import { User, Settings, Moon, Bell, Download, LogOut, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { lockApp } from '@/features/auth/localAuth';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

export default function ProfilePage() {
  const router = useRouter();
  const user = useLiveQuery(() => db.users.orderBy('id').first());
  const settings = useLiveQuery(() => db.settings.orderBy('id').first());

  const handleLogout = () => {
    lockApp();
    router.replace('/');
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      
      <div className="flex items-center gap-4 mt-2 mb-2">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <User className="w-8 h-8" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {user?.name || 'Usuario'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {user?.email || 'Sin correo asociado'}
          </p>
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
              <Switch 
                id="daily-verse" 
                checked={settings?.dailyVerse ?? true}
                onCheckedChange={async (checked) => {
                  if (settings) {
                    await db.settings.update(settings.id, { dailyVerse: checked });
                  } else if (user) {
                    await db.settings.add({
                      id: crypto.randomUUID(),
                      userId: user.id,
                      theme: 'light',
                      notifications: true,
                      dailyVerse: checked,
                      showReflection: true,
                      offlineDownload: true,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      deletedAt: null
                    });
                  }
                }} 
              />
            </div>

            {(settings?.dailyVerse ?? true) && (
              <>
                <div className="flex items-center justify-between p-4 pl-12 bg-muted/30">
                  <Label htmlFor="show-reflection" className="text-sm">Mostrar reflexión</Label>
                  <Switch 
                    id="show-reflection" 
                    checked={settings?.showReflection ?? true}
                    onCheckedChange={async (checked) => {
                      if (settings) {
                        await db.settings.update(settings.id, { showReflection: checked });
                      } else if (user) {
                        await db.settings.add({
                          id: crypto.randomUUID(),
                          userId: user.id,
                          theme: 'light',
                          notifications: true,
                          dailyVerse: true,
                          showReflection: checked,
                          offlineDownload: true,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                          deletedAt: null
                        });
                      }
                    }} 
                  />
                </div>
                <div className="flex items-center justify-between p-4 pl-12 bg-muted/30">
                  <Label htmlFor="offline-download" className="text-sm">Descargar automáticamente (Offline)</Label>
                  <Switch 
                    id="offline-download" 
                    checked={settings?.offlineDownload ?? true}
                    onCheckedChange={async (checked) => {
                      if (settings) {
                        await db.settings.update(settings.id, { offlineDownload: checked });
                      } else if (user) {
                        await db.settings.add({
                          id: crypto.randomUUID(),
                          userId: user.id,
                          theme: 'light',
                          notifications: true,
                          dailyVerse: true,
                          showReflection: true,
                          offlineDownload: checked,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                          deletedAt: null
                        });
                      }
                    }} 
                  />
                </div>
              </>
            )}
            
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

            <button 
              onClick={handleLogout} 
              className="w-full flex items-center justify-between p-4 hover:bg-destructive/5 transition-colors text-left"
            >
              <div className="flex items-center gap-3 text-destructive">
                <div className="bg-destructive/10 p-2 rounded-full"><LogOut className="w-4 h-4" /></div>
                <span className="text-sm font-medium">Cerrar Sesión</span>
              </div>
            </button>
            
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
