'use client';

import { useState, useEffect, useCallback } from 'react';
import { Leaf, ScanFace, Delete } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { hasLocalPin, setLocalPin, verifyLocalPin, clearLocalAuth, isBiometricsSupported, hasBiometricsEnrolled, setupBiometrics, verifyBiometrics } from '@/features/auth/localAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login, loginWithGoogle } from '@/features/auth/actions';
import { db, User, clearAllUserData } from '@/lib/db';

type AuthState = 'LOADING' | 'LOGIN' | 'SETUP_PIN_1' | 'SETUP_PIN_2' | 'BIOMETRIC_PROMPT' | 'SYNC_PROMPT' | 'REMOVE_USER_PIN';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authState, setAuthState] = useState<AuthState>('LOADING');
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [bioSupported, setBioSupported] = useState(false);
  const [hasBio, setHasBio] = useState(false);

  const handleBiometricLogin = useCallback(async () => {
    const success = await verifyBiometrics();
    if (success) {
      router.replace('/home');
    }
  }, [router]);
  useEffect(() => {
    async function loadData() {
      const u = await db.users.orderBy('id').first();
      if (u) setUser(u);
      
      const supported = await isBiometricsSupported();
      setBioSupported(supported);
      const enrolled = hasBiometricsEnrolled();
      setHasBio(enrolled);

      const isSetup = searchParams.get('setup');
      const newState = (!hasLocalPin() || isSetup === 'true') ? 'SETUP_PIN_1' : 'LOGIN';
      setAuthState(newState);

      // Auto-prompt biometrics if returning user
      if (newState === 'LOGIN' && enrolled) {
        setTimeout(() => handleBiometricLogin(), 300);
      }
    }
    const timer = setTimeout(() => loadData(), 0);
    return () => clearTimeout(timer);
  }, [searchParams, handleBiometricLogin]);


  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (authState === 'SETUP_PIN_1') {
      if (pin.length < 4) {
        setError('El PIN debe tener al menos 4 dígitos');
        return;
      }
      setAuthState('SETUP_PIN_2');
    } else if (authState === 'SETUP_PIN_2') {
      if (pin !== pinConfirm) {
        setError('Los PINs no coinciden. Inténtalo de nuevo.');
        setPin('');
        setPinConfirm('');
        setAuthState('SETUP_PIN_1');
        return;
      }
      await setLocalPin(pin);
      
      // Crear perfil local inicial
      const localUser = await db.users.orderBy('id').first();
      if (!localUser) {
        const userId = crypto.randomUUID();
        await db.users.add({
          id: userId,
          email: '',
          name: name || 'Usuario',
          lastName: lastName || '',
          avatarUrl: null,
          isCloudLinked: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null
        });
        
        const { AccountService } = await import('@/services/accountService');
        await AccountService.createAccount({
          userId,
          name: 'Cuenta Principal',
          balance: 0,
        });
      }

      if (bioSupported) {
        setAuthState('BIOMETRIC_PROMPT');
      } else {
        setAuthState('SYNC_PROMPT');
      }
    } else if (authState === 'LOGIN') {
      const isValid = await verifyLocalPin(pin);
      if (isValid) {
        router.replace('/home');
      } else {
        setError('PIN incorrecto');
        setPin('');
      }
    } else if (authState === 'REMOVE_USER_PIN') {
      const isValid = await verifyLocalPin(pin);
      if (!isValid) {
        setError('PIN incorrecto');
        setPin('');
        return;
      }
      
      setShowDeleteConfirm(true);
    }
  };

  const handleKeypadPress = useCallback((num: string) => {
    setError('');
    if (authState === 'SETUP_PIN_2') {
      if (pinConfirm.length < 6) setPinConfirm(prev => prev + num);
    } else {
      if (pin.length < 6) setPin(prev => prev + num);
    }
  }, [authState, pin, pinConfirm]);

  const handleBackspace = useCallback(() => {
    setError('');
    if (authState === 'SETUP_PIN_2') {
      setPinConfirm(prev => prev.slice(0, -1));
    } else {
      setPin(prev => prev.slice(0, -1));
    }
  }, [authState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en el input de Nombre/Apellido
      if (document.activeElement?.tagName === 'INPUT') return;

      if (e.key >= '0' && e.key <= '9') {
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeypadPress, handleBackspace]);

  const proceedWithDeletion = async () => {
    setShowDeleteConfirm(false);
    setAuthState('LOADING');
    try {
      const hasSupabaseSession = document.cookie.split(';').some(c => c.trim().startsWith('sb-'));
      if (hasSupabaseSession || user?.email) {
        const { syncEngine } = await import('@/services/syncEngine');
        await syncEngine.sync();
      }
    } catch (e) {
      console.warn('Sync failed before deletion:', e);
    }
    
    await clearAllUserData();
    clearLocalAuth();
    
    setUser(null);
    setPin('');
    setPinConfirm('');
    setName('');
    setLastName('');
    setAuthState('SETUP_PIN_1');
  };

  if (authState === 'LOADING') {
    return <div className="flex h-screen items-center justify-center"><Leaf className="animate-pulse text-primary h-8 w-8" /></div>;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <main className="flex-1 w-full max-w-md mx-auto relative px-4 pt-6 pb-6 flex flex-col animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center text-center mb-4">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <Leaf className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">KADOSH</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {authState === 'LOGIN' ? (user?.name ? `Hola de nuevo, ${user.name}. Ingresa tu PIN.` : 'Ingresa tu PIN de acceso.') : 
             authState === 'REMOVE_USER_PIN' ? 'Ingresa tu PIN para confirmar la eliminación de tu perfil.' :
             authState === 'SYNC_PROMPT' ? 'Sincronización en la nube' :
             authState === 'BIOMETRIC_PROMPT' ? 'Acceso rápido' :
             'Configura tu perfil y PIN local.'}
          </p>
        </div>

        {(authState === 'LOGIN' || authState === 'SETUP_PIN_1' || authState === 'SETUP_PIN_2' || authState === 'REMOVE_USER_PIN') && (
          <form onSubmit={handlePinSubmit} className="flex flex-col flex-1 pb-safe" noValidate>
            {authState === 'SETUP_PIN_1' && (
              <div className="space-y-2 mb-2 flex gap-2">
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="Nombre" 
                  type="text" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-14 text-center text-lg rounded-2xl bg-card border-border shadow-sm px-4 focus-visible:ring-primary w-1/2"
                />
                <Input 
                  id="lastName" 
                  name="lastName" 
                  placeholder="Apellido" 
                  type="text" 
                  required 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-14 text-center text-lg rounded-2xl bg-card border-border shadow-sm px-4 focus-visible:ring-primary w-1/2"
                />
              </div>
            )}
            
            <div className="flex flex-col items-center w-full mt-auto">
              <div className="h-6 mb-2">
                <p className="text-sm font-medium text-muted-foreground text-center">
                  {authState === 'SETUP_PIN_2' ? 'Confirma tu PIN' : (authState === 'SETUP_PIN_1' ? 'Crea un PIN (mín. 4)' : '')}
                </p>
              </div>

              {/* PIN Dots display */}
              <div className="flex gap-4 justify-center items-center h-10 w-full px-4 mb-2">
                {Array.from({ length: Math.max(4, (authState === 'SETUP_PIN_2' ? pinConfirm : pin).length) }).map((_, i) => {
                  const currentPin = authState === 'SETUP_PIN_2' ? pinConfirm : pin;
                  const isFilled = i < currentPin.length;
                  return (
                    <div 
                      key={i} 
                      className={`w-4 h-4 rounded-full transition-all duration-200 ${isFilled ? 'bg-primary scale-110' : 'bg-muted-foreground/20'}`}
                    />
                  );
                })}
              </div>

              <div className="h-5 flex items-center justify-center mb-2">
                <p className={`text-sm text-destructive text-center transition-opacity duration-200 ${error ? 'opacity-100' : 'opacity-0'}`}>
                  {error || ' '}
                </p>
              </div>

              {/* Custom Numeric Keypad */}
              <div className="w-full max-w-[280px] mx-auto grid grid-cols-3 gap-y-3 sm:gap-y-4 gap-x-6">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeypadPress(num)}
                    className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full flex items-center justify-center text-2xl sm:text-3xl font-medium bg-secondary/30 hover:bg-secondary active:scale-95 transition-all text-foreground"
                  >
                    {num}
                  </button>
                ))}
                
                {/* Bottom row: Bio, 0, Backspace */}
                <div className="flex items-center justify-center">
                  {authState === 'LOGIN' && hasBio ? (
                    <button
                      type="button"
                      onClick={handleBiometricLogin}
                      className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full flex items-center justify-center bg-secondary/20 hover:bg-secondary text-primary transition-all active:scale-95"
                    >
                      <ScanFace className="w-7 h-7 sm:w-8 sm:h-8" />
                    </button>
                  ) : <div className="w-14 h-14 sm:w-16 sm:h-16" />}
                </div>

                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full flex items-center justify-center text-2xl sm:text-3xl font-medium bg-secondary/30 hover:bg-secondary active:scale-95 transition-all text-foreground"
                >
                  0
                </button>

                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full flex items-center justify-center bg-secondary/20 hover:bg-secondary text-muted-foreground transition-all active:scale-95"
                  >
                    <Delete className="w-6 h-6 sm:w-7 sm:h-7" />
                  </button>
                </div>
              </div>

            </div>
            <Button className="w-full h-12 sm:h-14 rounded-full mt-4 shadow-sm font-semibold text-lg shrink-0" type="submit" variant={authState === 'REMOVE_USER_PIN' ? 'destructive' : 'default'}>
              {authState === 'LOGIN' ? 'Ingresar' : 
               authState === 'REMOVE_USER_PIN' ? 'Eliminar Perfil' : 'Continuar'}
            </Button>

            {/* Extra Options */}
            {authState === 'LOGIN' && user && (
               <div className="mt-2 flex flex-col items-center">
                 <button type="button" onClick={() => { setAuthState('REMOVE_USER_PIN'); setPin(''); setError(''); }} className="h-10 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors">
                   Cambiar o Quitar usuario
                 </button>
               </div>
            )}
            
            {authState === 'REMOVE_USER_PIN' && (
               <div className="mt-2 flex flex-col items-center">
                 <button type="button" onClick={() => { setAuthState('LOGIN'); setPin(''); setError(''); }} className="h-10 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                   Cancelar
                 </button>
               </div>
            )}
          </form>
        )}
        {/* Biometric and Sync Prompts */}

        {authState === 'BIOMETRIC_PROMPT' && (
          <div className="flex flex-col gap-6 items-center text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <ScanFace className="w-12 h-12 text-primary" />
            </div>
            <p className="text-foreground text-lg font-medium">
              ¿Deseas habilitar el acceso con tu rostro o huella digital?
            </p>
            <p className="text-muted-foreground text-sm px-4">
              Podrás desbloquear la aplicación de manera instantánea y segura sin escribir tu PIN.
            </p>
            
            <div className="w-full flex flex-col gap-3 mt-4">
              <Button 
                className="w-full rounded-full h-14 text-base font-medium"
                onClick={async () => {
                  const success = await setupBiometrics();
                  if (success) {
                    setHasBio(true);
                  }
                  setAuthState('SYNC_PROMPT');
                }}
              >
                Habilitar Biometría
              </Button>
              <Button 
                variant="ghost" 
                className="w-full rounded-full h-14 text-base font-medium text-muted-foreground"
                onClick={() => setAuthState('SYNC_PROMPT')}
              >
                Quizás más tarde
              </Button>
            </div>
          </div>
        )}

        {authState === 'SYNC_PROMPT' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-center text-foreground mb-4">
              ¿Deseas sincronizar tus datos en la nube para acceder desde otros dispositivos y tener respaldo automático?
            </p>
            
            <form action={loginWithGoogle} noValidate>
              <Button variant="outline" className="w-full rounded-full h-12 border-border shadow-sm bg-card hover:bg-muted" type="submit">
                Sincronizar con Google
              </Button>
            </form>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">O continúa con email</span>
              </div>
            </div>

            <form action={login} className="flex flex-col gap-4" noValidate>
              <Input name="email" placeholder="ejemplo@correo.com" type="email" required className="h-12 rounded-2xl bg-card" />
              <Input name="password" placeholder="••••••••" type="password" required className="h-12 rounded-2xl bg-card" />
              <Button className="w-full h-12 rounded-full mt-2 font-medium" type="submit">
                Vincular y Sincronizar
              </Button>
            </form>

            <Button 
              variant="ghost" 
              type="button"
              className="w-full h-12 rounded-full mt-2 text-muted-foreground" 
              onClick={() => router.replace('/home')}
            >
              Más tarde, usar solo offline
            </Button>
          </div>
        )}
      </main>

      {/* Modal Nativo de Confirmación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border shadow-lg rounded-3xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">¿Eliminar Perfil?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Esta acción es irreversible. Se borrarán todos los datos y registros almacenados localmente.
              </p>
              <div className="flex flex-col gap-3">
                <Button variant="destructive" className="w-full h-12 rounded-full font-medium" onClick={proceedWithDeletion}>
                  Sí, eliminar todo
                </Button>
                <Button variant="outline" className="w-full h-12 rounded-full border-border font-medium" onClick={() => setShowDeleteConfirm(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
