'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      if (pathname === '/admin/login') {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          if (mounted) router.push('/admin/login');
          return;
        }

        // Verify if the email is in the Admin table
        const response = await fetch('/api/admin/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: session.user.email }),
        });

        if (!response.ok) {
          await supabase.auth.signOut();
          if (mounted) router.push('/admin/login');
          return;
        }

        if (mounted) {
          setIsAuthenticated(true);
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth error:', error);
        if (mounted) router.push('/admin/login');
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
