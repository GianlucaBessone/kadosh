'use client';

import { useRef, useState } from 'react';
import {
  User, Moon, Bell, Download, LogOut, BookOpen,
  Camera, Mail, Sun, ChevronRight, Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Tooltip, TooltipTrigger, TooltipContent,
} from '@/components/ui/tooltip';
import { lockApp } from '@/features/auth/localAuth';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useTheme } from '@/lib/useTheme';
import { ExportModal } from '@/components/transactions/ExportModal';

// ─── Avatar Upload ────────────────────────────────────────────────────────────

function AvatarSection({ user }: { user: { id: string; name: string | null; avatarUrl: string | null } }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await db.users.update(user.id, {
        avatarUrl: base64,
        updatedAt: new Date().toISOString(),
      });
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-4 mt-2 mb-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <label
            htmlFor="avatar-upload"
            className="relative w-16 h-16 rounded-full cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Foto de perfil"
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <User className="w-8 h-8" />
              </div>
            )}

            {/* Camera overlay */}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {loading
                ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                : <Camera className="w-5 h-5 text-white" />
              }
            </div>

            <input
              id="avatar-upload"
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>
        </TooltipTrigger>
        <TooltipContent side="right">Cambiar foto de perfil</TooltipContent>
      </Tooltip>

      <div className="flex flex-col">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {user.name || 'Usuario'}
        </h1>
      </div>
    </div>
  );
}

// ─── Associate Account Banner ─────────────────────────────────────────────────

function AssociateAccountBanner({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssociate = async () => {
    setError(null);
    setLoading(true);
    try {
      // Lazy-import Supabase client to keep this offline-friendly
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();

      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;

      await db.users.update(userId, {
        email,
        isCloudLinked: true,
        updatedAt: new Date().toISOString(),
      });
      setOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al asociar la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="rounded-3xl border-border/40 bg-muted/30 shadow-none">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="bg-muted p-2 rounded-full text-muted-foreground shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Sin cuenta en la nube</p>
            <p className="text-xs text-muted-foreground truncate">
              Sincroniza y respalda tus datos
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                id="associate-account-btn"
                className="shrink-0 text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-0.5"
                onClick={() => setOpen(true)}
              >
                Asociar
                <ChevronRight className="w-3 h-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Vincula una cuenta para sincronizar en la nube</TooltipContent>
          </Tooltip>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Asociar cuenta de correo</DialogTitle>
            <DialogDescription>
              Crea una cuenta en la nube para sincronizar y respaldar tus datos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="assoc-email">Correo electrónico</Label>
              <Input
                id="assoc-email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="assoc-password">Contraseña</Label>
              <Input
                id="assoc-password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button id="confirm-associate-btn" onClick={handleAssociate} disabled={loading || !email || !password}>
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Crear cuenta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const user = useLiveQuery(() => db.users.orderBy('id').first());
  const settings = useLiveQuery(() => db.settings.orderBy('id').first());
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = () => {
    lockApp();
    router.replace('/');
  };

  const [showExport, setShowExport] = useState(false);

  const updateSetting = async (patch: Partial<typeof settings>) => {
    if (!settings || !user) return;
    if (settings) {
      await db.settings.update(settings.id, {
        ...patch,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await db.settings.add({
        id: crypto.randomUUID(),
        userId: user.id,
        theme: 'light',
        notifications: true,
        dailyVerse: true,
        showReflection: true,
        offlineDownload: true,
        ...patch,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      });
    }
  };

  return (
    <>
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">

      {/* ── Avatar ─────────────────────────────────────────────────────── */}
      {user && <AvatarSection user={user} />}

      {/* ── Associate account banner (shown when not cloud-linked) ─────── */}
      {user && !user.isCloudLinked && (
        <AssociateAccountBanner userId={user.id} />
      )}

      {/* ── Configuración ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground ml-2">
          Configuración
        </h3>

        <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
          <CardContent className="p-0 divide-y divide-border/50">

            {/* Dark mode */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="bg-muted p-2 rounded-full text-foreground">
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </div>
                <Label htmlFor="dark-mode" className="text-sm font-medium">
                  Modo {isDark ? 'Claro' : 'Oscuro'}
                </Label>
              </div>
              <Switch
                id="dark-mode"
                checked={isDark}
                onCheckedChange={toggleTheme}
              />
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="bg-success/10 p-2 rounded-full text-success">
                  <Bell className="w-4 h-4" />
                </div>
                <Label htmlFor="notifications" className="text-sm font-medium">
                  Notificaciones
                </Label>
              </div>
              <Switch
                id="notifications"
                checked={settings?.notifications ?? true}
                onCheckedChange={(checked) => updateSetting({ notifications: checked })}
              />
            </div>

            {/* Daily verse */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full text-primary">
                  <BookOpen className="w-4 h-4" />
                </div>
                <Label htmlFor="daily-verse" className="text-sm font-medium">
                  Versículo Diario
                </Label>
              </div>
              <Switch
                id="daily-verse"
                checked={settings?.dailyVerse ?? true}
                onCheckedChange={(checked) => updateSetting({ dailyVerse: checked })}
              />
            </div>

            {(settings?.dailyVerse ?? true) && (
              <>
                <div className="flex items-center justify-between p-4 pl-12 bg-muted/30">
                  <Label htmlFor="show-reflection" className="text-sm">Mostrar reflexión</Label>
                  <Switch
                    id="show-reflection"
                    checked={settings?.showReflection ?? true}
                    onCheckedChange={(checked) => updateSetting({ showReflection: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 pl-12 bg-muted/30">
                  <Label htmlFor="offline-download" className="text-sm">
                    Descargar automáticamente (Offline)
                  </Label>
                  <Switch
                    id="offline-download"
                    checked={settings?.offlineDownload ?? true}
                    onCheckedChange={(checked) => updateSetting({ offlineDownload: checked })}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Datos y Cuenta ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground ml-2">
          Datos y Cuenta
        </h3>

        <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
          <CardContent className="p-0 divide-y divide-border/50">

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  id="export-data-btn"
                  onClick={() => setShowExport(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-muted p-2 rounded-full text-foreground">
                      <Download className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Exportar mis datos</span>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent>Descarga una copia de todos tus datos</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between p-4 hover:bg-destructive/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 text-destructive">
                    <div className="bg-destructive/10 p-2 rounded-full">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Cerrar Sesión</span>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent>Bloquea la app y vuelve al PIN</TooltipContent>
            </Tooltip>

          </CardContent>
        </Card>
      </div>

    </div>

    {/* Export modal — rendered outside the scroll container */}
    {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </>
  );
}
