'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Sprout, Plus, HandHeart, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MoreSheet } from './MoreSheet'

export function BottomNav() {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  type NavItem = {
    name: string;
    icon: React.ElementType;
    href?: string;
    isCenter?: boolean;
    isMore?: boolean;
  };

  const navItems: NavItem[] = [
    { name: 'Inicio', href: '/home', icon: Home },
    { name: 'Semillas', href: '/seeds', icon: Sprout },
    // Center button (handled separately for styling)
    { name: 'Registrar', href: '/register-tx', icon: Plus, isCenter: true },
    { name: 'Diezmo', href: '/tithe', icon: HandHeart },
    // "Más+" handled separately (opens MoreSheet instead of navigating)
    { name: 'Más+', icon: MoreHorizontal, isMore: true },
  ]

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-between bg-card px-6 pb-safe pt-2 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] rounded-t-3xl border-t border-border/40">
        {navItems.map((item) => {
          const Icon = item.icon

          if ('isCenter' in item && item.isCenter) {
            return (
              <Link
                key={item.name}
                href={item.href || '#'}
                prefetch={true}
                className="relative -top-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
              >
                <Icon className="h-8 w-8" />
                <span className="sr-only">{item.name}</span>
              </Link>
            )
          }

          if ('isMore' in item && item.isMore) {
            return (
              <button
                key={item.name}
                onClick={() => setShowMore(true)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 min-w-[48px] transition-colors',
                  showMore ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-6 w-6 stroke-[1.5]" />
                <span className="text-[10px] font-medium tracking-wide">{item.name}</span>
              </button>
            )
          }

          const href = item.href || '#'
          const isActive = pathname === href || pathname.startsWith(href + '/')

          return (
            <Link
              key={item.name}
              href={href}
              prefetch={true}
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-w-[48px] transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-6 w-6 stroke-[1.5]" />
              <span className="text-[10px] font-medium tracking-wide">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {showMore && <MoreSheet onClose={() => setShowMore(false)} />}
    </>
  )
}
