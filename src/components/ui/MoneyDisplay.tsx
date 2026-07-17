import { cn } from "@/lib/utils";

export interface MoneyDisplayProps {
  amount: number;
  className?: string;
  hideSymbol?: boolean;
  compact?: boolean;
}

export function MoneyDisplay({ amount, className, hideSymbol = false, compact = false }: MoneyDisplayProps) {
  let formatted = '';
  let isCompactM = false;

  if (compact && Math.abs(amount) >= 100_000_000) {
    const millions = amount / 1_000_000;
    formatted = millions.toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    isCompactM = true;
  } else {
    formatted = new Intl.NumberFormat('es-AR', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  const parts = formatted.split(',');
  const intPart = parts[0];
  const decPart = parts.length > 1 ? parts[1] : null;

  return (
    <span 
      className={cn("tracking-tight", className)}
      style={{ fontFamily: 'var(--font-outfit)' }}
    >
      {!hideSymbol && <span className="mr-1">$</span>}
      <span>{intPart}</span>
      {decPart && (
        <sup className="text-[0.65em] font-medium opacity-60 ml-[0.1em]">
          {decPart}
        </sup>
      )}
      {isCompactM && <span className="ml-0.5 text-[0.8em]">M</span>}
    </span>
  );
}
