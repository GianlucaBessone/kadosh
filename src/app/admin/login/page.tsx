'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/admin');
      }
    };
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error('Credenciales inválidas');
        setLoading(false);
        return;
      }

      // Check if user is admin
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.user.email }),
      });

      if (!response.ok) {
        await supabase.auth.signOut();
        toast.error('No tienes permisos de administrador');
        setLoading(false);
        return;
      }

      toast.success('¡Bienvenido!');
      router.push('/admin');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-800">
        <form onSubmit={handleLogin} noValidate>
          <CardHeader className="space-y-1 text-center pb-6">
            <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">KADOSH</h1>
            <CardTitle className="text-2xl">Panel de Administración</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@kadosh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="pt-4">
            <Button className="w-full" type="submit" disabled={loading || !email || !password}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ingresar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
