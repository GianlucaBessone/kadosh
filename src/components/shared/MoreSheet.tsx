'use client';

import { useState, useEffect } from 'react';
import { X, Settings, ChevronDown, CalendarDays, Building2, User, LifeBuoy, HelpingHand } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { cn } from '@/lib/utils';

interface MoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MoreSheet({ isOpen, onClose }: MoreSheetProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  const handleClose = () => {
    onClose(); // This sets isOpen to false in parent, triggering the useEffect
  };

  const router = useRouter();
  const user = useLiveQuery(() => db.users.orderBy('id').first());
  const userName = user?.name
    ? `${user.name}${user.lastName ? ' ' + user.lastName : ''}`
    : 'Usuario';

  const initials = userName
    .split(' ')
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() ?? '')
    .join('');

  const handleProfileClick = () => {
    handleClose();
    setTimeout(() => {
      router.push('/profile');
    }, 300);
  };

  const modules = [
    {
      icon: CalendarDays,
      label: 'Planificación',
      description: 'Compromisos y flujo financiero',
      href: '/planning',
      available: true,
    },
    {
      icon: Building2,
      label: 'Patrimonio',
      description: 'Cuentas y activos',
      href: '/accounts',
      available: false,
    },
    {
      icon: LifeBuoy,
      label: 'Asistencia',
      description: 'Ayuda, Contacto e Información',
      href: '/asistencia',
      available: true,
    },
    {
      icon: HelpingHand,
      label: 'Oraciones',
      description: 'Acompaña en oración a la comunidad KADOSH',
      href: '/oraciones',
      available: true,
    },
  ];

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-40 flex flex-col justify-end duration-300",
        isClosing ? "animate-out fade-out pointer-events-none" : "animate-in fade-in"
      )}
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Sheet */}
      <div 
        className={cn(
          "relative max-w-md w-full mx-auto bg-card rounded-t-3xl border-t border-border/40 shadow-2xl duration-300",
          isClosing ? "animate-out slide-out-to-bottom" : "animate-in slide-in-from-bottom"
        )}
        style={{ touchAction: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Content */}
        <div className="px-6 pt-6 pb-28 flex flex-col gap-6 overflow-y-auto overscroll-y-contain max-h-[85vh]">
          {/* Profile row */}
          <div className="flex items-center gap-3">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={userName}
                className="w-14 h-14 rounded-full object-cover flex-none"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-none text-lg font-bold">
                {initials || <User className="w-6 h-6" />}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{userName}</p>
              {user?.email && (
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              )}
            </div>

            <button
              onClick={handleProfileClick}
              className="flex-none w-10 h-10 rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 flex items-center justify-center transition-colors"
              aria-label="Ajustes del perfil"
            >
              <Settings className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Space selector */}
          <div className="flex items-center justify-between bg-muted/60 rounded-2xl px-4 py-3">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                Espacio actual
              </p>
              <p className="text-sm font-semibold text-foreground">Personal</p>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground opacity-40" aria-disabled="true">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          {/* Module links */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Módulos
            </p>
            {modules.map(mod => {
              const Icon = mod.icon;
              return mod.available ? (
                <Link
                  key={mod.label}
                  href={mod.href}
                  onClick={onClose}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-muted transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-none group-hover:bg-primary/15 transition-colors">
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{mod.label}</p>
                    <p className="text-xs text-muted-foreground">{mod.description}</p>
                  </div>
                </Link>
              ) : (
                <div
                  key={mod.label}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-2xl opacity-40 cursor-not-allowed"
                >
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-none">
                    <Icon className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{mod.label}</p>
                    <p className="text-xs text-muted-foreground">{mod.description}</p>
                  </div>
                  <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                    Próximamente
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bottom safe area */}
          <div className="pb-safe-bottom pb-4" />
        </div>
      </div>
    </div>
  );
}
