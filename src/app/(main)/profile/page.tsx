'use client';

import { useRef, useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  User, Moon, Bell, Download, LogOut, BookOpen,
  Camera, Mail, Sun, ChevronRight, Loader2, CalendarDays, Volume2, ShieldCheck,
  CheckCircle2, Circle, AlertCircle, HelpingHand
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
import { db } from '@/lib/db';
import { WorkspaceQueries } from '@/store/queries/WorkspaceQueries';
import { useTheme } from '@/lib/useTheme';
import { ExportModal } from '@/components/transactions/ExportModal';
import { useLiveQuery } from 'dexie-react-hooks';

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
      if (typeof reader.result !== 'string') return;
      const base64 = reader.result;
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
  const [success, setSuccess] = useState(false);

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasLength && hasUpper && hasLower && hasNumber;

  const handleAssociate = async () => {
    setError(null);
    setLoading(true);
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();

      const { error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (signUpError) throw signUpError;

      await db.users.update(userId, {
        email,
        isCloudLinked: true,
        isEmailConfirmed: false,
        updatedAt: new Date().toISOString(),
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al asociar la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { error } = await supabase.auth.resend({ 
        type: 'signup', 
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) {
        if (error.message.toLowerCase().includes('already verified')) {
          await db.users.update(userId, { isEmailConfirmed: true, updatedAt: new Date().toISOString() });
          toast.success('Tu cuenta ya fue verificada exitosamente.');
          setSuccess(false);
          setOpen(false);
          return;
        }
        throw error;
      }
      toast.success('Correo reenviado exitosamente. Revisa tu bandeja de entrada y SPAM.');
    } catch (err) {
      toast.error('Error al reenviar el correo.');
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
          {!success ? (
            <>
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
                    placeholder="Contraseña segura"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="flex flex-col gap-1 mt-2 text-xs">
                    <div className={`flex items-center gap-1 ${hasLength ? 'text-success' : 'text-muted-foreground'}`}>
                      {hasLength ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />} Mínimo 8 caracteres
                    </div>
                    <div className={`flex items-center gap-1 ${hasUpper ? 'text-success' : 'text-muted-foreground'}`}>
                      {hasUpper ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />} Al menos 1 mayúscula
                    </div>
                    <div className={`flex items-center gap-1 ${hasLower ? 'text-success' : 'text-muted-foreground'}`}>
                      {hasLower ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />} Al menos 1 minúscula
                    </div>
                    <div className={`flex items-center gap-1 ${hasNumber ? 'text-success' : 'text-muted-foreground'}`}>
                      {hasNumber ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />} Al menos 1 número
                    </div>
                  </div>
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                  Cancelar
                </Button>
                <Button id="confirm-associate-btn" onClick={handleAssociate} disabled={loading || !email || !isPasswordValid}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Crear cuenta
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="bg-success/20 p-4 rounded-full text-success">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-xl font-bold">¡Revisa tu correo!</h2>
              <p className="text-sm text-muted-foreground">
                Te enviamos un enlace a <strong>{email}</strong> para confirmar tu cuenta.
                Si no lo encuentras, revisa tu carpeta de SPAM o correo no deseado.
              </p>
              <div className="flex flex-col gap-2 w-full pt-4">
                <Button variant="default" onClick={() => setOpen(false)} className="rounded-xl w-full">
                  Entendido, ya cierro
                </Button>
                <Button variant="outline" onClick={handleResend} disabled={loading} className="rounded-xl w-full">
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Reenviar correo
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const user = useLiveQuery(() => db.users.orderBy('id').first());
  const settingsArray = useLiveQuery(() => db.settings.toArray());
  const settings = settingsArray ? settingsArray[0] : undefined;
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    async function checkConfirmation() {
      if (user?.isCloudLinked && !user.isEmailConfirmed) {
        try {
          const { createClient } = await import('@/utils/supabase/client');
          const supabase = createClient();
          const { data: { user: supaUser } } = await supabase.auth.getUser();
          if (supaUser?.email_confirmed_at) {
            await db.users.update(user.id, { isEmailConfirmed: true, updatedAt: new Date().toISOString() });
            // Start sync engine now that email is confirmed
            const { syncEngine } = await import('@/services/syncEngine');
            syncEngine.start();
          }
        } catch (e) {
          console.error('Error checking confirmation', e);
        }
      }
    }

    if (user?.isCloudLinked && !user.isEmailConfirmed) {
      checkConfirmation(); // Initial check
      intervalId = setInterval(checkConfirmation, 5000); // Poll every 5 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user?.isCloudLinked, user?.isEmailConfirmed, user?.id]);

  const handleResendConfirmation = async () => {
    if (!user?.email) return;
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { error } = await supabase.auth.resend({ 
        type: 'signup', 
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) {
        if (error.message.toLowerCase().includes('already verified')) {
          await db.users.update(user.id, { isEmailConfirmed: true, updatedAt: new Date().toISOString() });
          toast.success('Tu cuenta ya estaba verificada. ¡Sincronización activada!');
          return;
        }
        throw error;
      }
      toast.success('Correo reenviado exitosamente. Revisa tu bandeja de entrada y SPAM.');
    } catch (err: any) {
      toast.error(err.message || 'Error al reenviar el correo.');
    }
  };

  const handleLogout = () => {
    lockApp();
    router.replace('/');
  };

  const [showExport, setShowExport] = useState(false);

  const updateSetting = async (patch: Partial<typeof settings>) => {
    if (!user) return;
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
        soundEffects: true,
        ...patch,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      });
    }
  };

  const handleRepeatOnboarding = () => {
    localStorage.removeItem('kadosh_onboarding_done');
    router.push('/registro');
  };

  return (
    <>
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">

      {/* ── Avatar ─────────────────────────────────────────────────────── */}
      {user && <AvatarSection user={user} />}

      {/* ── Pending Confirmation Banner ─────── */}
      {user && user.isCloudLinked && !user.isEmailConfirmed && (
        <Card className="rounded-3xl border-warning/40 bg-warning/10 shadow-none">
          <CardContent className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-warning/20 p-2 rounded-full text-warning shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground flex items-center gap-1">
                  Cuenta aún no confirmada
                </p>
                <p className="text-xs text-muted-foreground leading-tight">
                  Revisa tu correo para verificar tu cuenta y activar la sincronización.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleResendConfirmation} className="w-full rounded-xl border-warning/30 text-warning hover:bg-warning/20">
              Reenviar confirmación
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Cloud Sync Status ─────── */}
      {user && !user.isCloudLinked ? (
        <AssociateAccountBanner userId={user.id} />
      ) : user && user.isCloudLinked && user.isEmailConfirmed ? (
        <Card className="rounded-3xl border-success/30 bg-success/5 shadow-none overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-success"></div>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-success/20 p-2 rounded-full text-success shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground flex items-center gap-1">
                Sincronización Segura Activada
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                Tus datos tienen cifrado de extremo a extremo (E2EE)
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

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

            {/* Sonidos */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full text-primary">
                  <Volume2 className="w-4 h-4" />
                </div>
                <Label htmlFor="sound-effects" className="text-sm font-medium">
                  Efectos de Sonido
                </Label>
              </div>
              <Switch
                id="sound-effects"
                checked={settings?.soundEffects ?? true}
                onCheckedChange={async (checked) => {
                  await updateSetting({ soundEffects: checked });
                  const { soundService } = await import('@/lib/SoundService');
                  soundService.reloadSettings();
                  if (checked) soundService.play('success');
                }}
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

            {/* Prayer card access */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full text-primary">
                  <HelpingHand className="w-4 h-4" />
                </div>
                <div>
                  <Label htmlFor="show-prayer-card" className="text-sm font-medium">
                    Acceso rápido a oraciones
                  </Label>
                  <p className="text-xs text-muted-foreground leading-tight">
                    Mostrar tarjeta de comunidad en la pantalla principal.
                  </p>
                </div>
              </div>
              <Switch
                id="show-prayer-card"
                checked={settings?.showPrayerCard ?? true}
                onCheckedChange={(checked) => updateSetting({ showPrayerCard: checked })}
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

      {/* ── Planificación Financiera ───────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground ml-2">
          Planificación Financiera
        </h3>
        <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
          <CardContent className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full text-primary">
                <CalendarDays className="w-4 h-4" />
              </div>
              <Label className="text-sm font-medium">
                Modo de Planificación
              </Label>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full mt-1">
              <Button 
                variant={settings?.planningMode === 'MONTHLY' || !settings?.planningMode ? 'default' : 'outline'} 
                className="w-full font-semibold rounded-xl"
                onClick={() => updateSetting({ planningMode: 'MONTHLY', hasSelectedPlanningMode: true })}
              >
                Mensual
              </Button>
              <Button 
                variant={settings?.planningMode === 'BIWEEKLY' ? 'default' : 'outline'} 
                className="w-full font-semibold rounded-xl"
                onClick={() => updateSetting({ planningMode: 'BIWEEKLY', hasSelectedPlanningMode: true })}
              >
                Quincenal
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1 px-1">
              {settings?.planningMode === 'BIWEEKLY' 
                ? 'Los indicadores y balances se calcularán por quincena (Q1 y Q2).'
                : 'Todo se organiza y calcula en base al mes calendario completo.'
              }
            </p>
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

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleRepeatOnboarding}
                  className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 text-primary">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Repetir Tutorial</span>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent>Vuelve a ver la guía de introducción</TooltipContent>
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
