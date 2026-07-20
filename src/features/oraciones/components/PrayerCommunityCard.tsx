'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpingHand } from 'lucide-react';
import { db } from '@/lib/db';
import { usePrayerStats } from '@/features/oraciones/services/prayerRequestService';

export function PrayerCommunityCard() {
  const [activeCount, setActiveCount] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [rotationDirection, setRotationDirection] = useState<'up' | 'down' | null>(null);
  const [excludeUserId, setExcludeUserId] = useState<string | null>(null);
  const previousCount = useRef<number>(0);
  const prayerCount = usePrayerStats(excludeUserId);

  useEffect(() => {
    const loadUser = async () => {
      const current = await db.users.orderBy('id').first();
      if (current?.id) {
        setExcludeUserId(current.id);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (prayerCount === previousCount.current) return;
    setRotationDirection(prayerCount > previousCount.current ? 'up' : 'down');
    previousCount.current = prayerCount;
    setActiveCount(prayerCount);
    setIsRotating(true);
    const timeout = window.setTimeout(() => setIsRotating(false), 200);
    return () => window.clearTimeout(timeout);
  }, [prayerCount]);

  return (
    <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden bg-background">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <HelpingHand className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Comunidad orando</p>
            <p className="text-xs text-muted-foreground">
              <span
                style={
                  isRotating
                    ? {
                        transform:
                          rotationDirection === 'up'
                            ? 'perspective(140px) rotateX(-20deg)'
                            : 'perspective(140px) rotateX(20deg)',
                      }
                    : {}
                }
                className="inline-block transition-transform duration-200 ease-out"
              >
                {activeCount}
              </span>{' '}
              {activeCount === 1
                ? 'persona está siendo acompañada hoy'
                : 'personas están siendo acompañadas hoy'}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button asChild type="button" className="rounded-3xl px-3 py-2 text-xs">
            <Link href="/oraciones">Ver oraciones</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
