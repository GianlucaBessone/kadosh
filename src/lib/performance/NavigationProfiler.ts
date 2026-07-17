'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { PerformanceMonitor } from './PerformanceMonitor';
import { PerformanceReporter } from './PerformanceReporter';

export function NavigationProfiler() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // We start marking navigation when the route changes.
    // However, since we are inside useEffect, this component mounts/updates AFTER the render is mostly complete.
    // This gives a rough estimate of client-side navigation settling time.
    PerformanceMonitor.start(`nav_${pathname}`);
    
    const timeout = setTimeout(() => {
      const duration = PerformanceMonitor.end(`nav_${pathname}`);
      if (duration !== null) {
        PerformanceReporter.record({
          name: `Navigation_Settled_${pathname}`,
          category: 'navigation',
          duration,
          details: { searchParams: searchParams?.toString() }
        });
      }
    }, 0); // End of current event loop tick
    
    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  return null;
}
