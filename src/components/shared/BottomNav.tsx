'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Sprout, Plus, HandHeart } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { MoreSheet } from './MoreSheet'

function GridPlusIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M14 17.5h7" />
      <path d="M17.5 14v7" />
    </svg>
  )
}

export function BottomNav() {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)
  const [pendingRoute, setPendingRoute] = useState<string | null>(null)

  // Clear pending route when pathname actually changes
  useEffect(() => {
    setPendingRoute(null)
  }, [pathname])

  const currentPath = pendingRoute || pathname

  type NavItem = {
    name: string;
    icon: React.ElementType;
    href?: string;
    isCenter?: boolean;
    isMore?: boolean;
  };

  let centerAction = { name: 'Registrar', href: '/register-tx', icon: Plus, isCenter: true };
  
  if (currentPath.startsWith('/planning')) {
    centerAction = { name: 'Nuevo', href: '/planning/new', icon: Plus, isCenter: true };
  } else if (currentPath.startsWith('/seeds')) {
    centerAction = { name: 'Nueva', href: '/seeds/new', icon: Plus, isCenter: true };
  }

  const navItems: NavItem[] = [
    { name: 'Inicio', href: '/home', icon: Home },
    { name: 'Semillas', href: '/seeds', icon: Sprout },
    // Center button (handled separately for styling)
    centerAction,
    { name: 'Diezmo', href: '/tithe', icon: HandHeart },
    // "Más" handled separately (opens MoreSheet instead of navigating)
    { name: 'Más', icon: GridPlusIcon, isMore: true },
  ]

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex min-h-[5rem] items-center justify-between bg-card px-6 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] rounded-t-3xl border-t border-border/40">
        {navItems.map((item) => {
          const Icon = item.icon

          if ('isCenter' in item && item.isCenter) {
            return (
              <Link
                key={item.name}
                href={item.href || '#'}
                prefetch={true}
                onClick={() => {
                  setPendingRoute(item.href || '#')
                  setShowMore(false)
                }}
                className="relative -top-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
              >
                <Icon className="h-8 w-8" />
                <span className="sr-only">{item.name}</span>
              </Link>
            )
          }

          if ('isMore' in item && item.isMore) {
            const isActive = showMore
            return (
              <button
                key={item.name}
                onClick={() => setShowMore(prev => !prev)}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 min-w-[48px] transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-3 w-8 h-[3px] bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="h-6 w-6 stroke-[1.5]" />
                <span className="text-[10px] font-medium tracking-wide">{item.name}</span>
              </button>
            )
          }

          const href = item.href || '#'
          const isActive = showMore ? false : (currentPath === href || currentPath.startsWith(href + '/'))

          return (
            <Link
              key={item.name}
              href={href}
              prefetch={true}
              onClick={() => {
                setPendingRoute(href)
                setShowMore(false)
              }}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 min-w-[48px] transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-3 w-8 h-[3px] bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="h-6 w-6 stroke-[1.5]" />
              <span className="text-[10px] font-medium tracking-wide">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <MoreSheet isOpen={showMore} onClose={() => setShowMore(false)} />
    </>
  )
}
