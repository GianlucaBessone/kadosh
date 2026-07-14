'use client';

import { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { shortMonthName } from '../utils/dateUtils';

interface MonthSelectorProps {
  selectedMonth: number; // 1-12
  selectedYear: number;
  onChange: (month: number, year: number) => void;
}

const TOTAL_MONTHS = 24; // Show 12 past + current + 12 future

function generateMonthList(anchorMonth: number, anchorYear: number) {
  const months: Array<{ month: number; year: number }> = [];
  for (let i = -12; i <= 12; i++) {
    let m = anchorMonth + i;
    let y = anchorYear;
    while (m < 1) { m += 12; y--; }
    while (m > 12) { m -= 12; y++; }
    months.push({ month: m, year: y });
  }
  return months;
}

export function MonthSelector({ selectedMonth, selectedYear, onChange }: MonthSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const months = generateMonthList(today.getMonth() + 1, today.getFullYear());

  // Scroll the selected month into view
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const idx = months.findIndex(m => m.month === selectedMonth && m.year === selectedYear);
    if (idx === -1) return;
    const itemWidth = 72; // px
    const offset = idx * itemWidth - container.clientWidth / 2 + itemWidth / 2;
    container.scrollTo({ left: offset, behavior: 'smooth' });
  }, [selectedMonth, selectedYear]); // eslint-disable-line

  const handlePrev = () => {
    let m = selectedMonth - 1;
    let y = selectedYear;
    if (m < 1) { m = 12; y--; }
    onChange(m, y);
  };

  const handleNext = () => {
    let m = selectedMonth + 1;
    let y = selectedYear;
    if (m > 12) { m = 1; y++; }
    onChange(m, y);
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <button
        onClick={handlePrev}
        className="flex-none p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Mes anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto scrollbar-hide flex-1 py-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {months.map(({ month, year }) => {
          const isSelected = month === selectedMonth && year === selectedYear;
          const isCurrentMonth = month === (today.getMonth() + 1) && year === today.getFullYear();

          return (
            <button
              key={`${year}-${month}`}
              onClick={() => onChange(month, year)}
              className={cn(
                'flex-none flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-200 gap-0.5',
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <span className={cn('text-xs font-semibold uppercase tracking-wide', isSelected ? '' : isCurrentMonth ? 'text-primary' : '')}>
                {shortMonthName(month)}
              </span>
              {(isSelected || months.find(m2 => m2.month === month && m2.year === year)?.year !== today.getFullYear()) && (
                <span className={cn('text-[10px] font-medium', isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                  {year}
                </span>
              )}
              {isCurrentMonth && !isSelected && (
                <div className="w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleNext}
        className="flex-none p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Mes siguiente"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
