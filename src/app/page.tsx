'use client';

import { useState, useEffect } from 'react';
import { Leaf } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { hasLocalPin, setLocalPin, verifyLocalPin } from '@/features/auth/localAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login, loginWithGoogle } from '@/features/auth/actions';
import { db } from '@/lib/db';

type AuthState = 'LOADING' | 'LOGIN' | 'SETUP_PIN_1' | 'SETUP_PIN_2' | 'SYNC_PROMPT';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authState, setAuthState] = useState<AuthState>('LOADING');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const isSetup = searchParams.get('setup');
    const newState = (!hasLocalPin() || isSetup === 'true') ? 'SETUP_PIN_1' : 'LOGIN';
    const timer = setTimeout(() => setAuthState(newState), 0);
    return () => clearTimeout(timer);
  }, [searchParams]);

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
      const user = await db.users.orderBy('id').first();
      if (!user) {
        const userId = crypto.randomUUID();
        await db.users.add({
          id: userId,
          email: '',
          name: name || 'Usuario',
          lastName: lastName || '',
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

      setAuthState('SYNC_PROMPT');
    } else if (authState === 'LOGIN') {
      const isValid = await verifyLocalPin(pin);
      if (isValid) {
        router.replace('/home');
      } else {
        setError('PIN incorrecto');
        setPin('');
      }
    }
  };

  if (authState === 'LOADING') {
    return <div className="flex h-screen items-center justify-center"><Leaf className="animate-pulse text-primary h-8 w-8" /></div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 w-full max-w-md mx-auto relative px-4 pt-12 flex flex-col gap-6 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <Leaf className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">KADOSH</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {authState === 'LOGIN' ? 'Ingresa tu PIN de acceso.' : 
             authState === 'SYNC_PROMPT' ? 'Sincronización en la nube' :
             'Configura tu perfil y PIN local.'}
          </p>
        </div>

        {(authState === 'LOGIN' || authState === 'SETUP_PIN_1' || authState === 'SETUP_PIN_2') && (
          <form onSubmit={handlePinSubmit} className="flex flex-col gap-4">
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
            
            <div className="space-y-2">
              <Input 
                id="pin" 
                name="pin" 
                placeholder={authState === 'SETUP_PIN_2' ? 'Confirma tu PIN' : (authState === 'SETUP_PIN_1' ? 'Crea un PIN (mín. 4)' : '••••')} 
                type="password" 
                inputMode="numeric"
                pattern="[0-9]*"
                required 
                maxLength={6}
                value={authState === 'SETUP_PIN_2' ? pinConfirm : pin}
                onChange={(e) => authState === 'SETUP_PIN_2' ? setPinConfirm(e.target.value) : setPin(e.target.value)}
                className="h-14 text-center text-2xl tracking-widest rounded-2xl bg-card border-border shadow-sm px-4 focus-visible:ring-primary"
              />
              {error && <p className="text-sm text-destructive text-center mt-2">{error}</p>}
            </div>
            <Button className="w-full h-12 rounded-full mt-2 shadow-sm font-medium" type="submit">
              {authState === 'LOGIN' ? 'Ingresar' : 'Continuar'}
            </Button>
          </form>
        )}

        {authState === 'SYNC_PROMPT' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-center text-foreground mb-4">
              ¿Deseas sincronizar tus datos en la nube para acceder desde otros dispositivos y tener respaldo automático?
            </p>
            
            <form action={loginWithGoogle}>
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

            <form action={login} className="flex flex-col gap-4">
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
    </div>
  );
}
