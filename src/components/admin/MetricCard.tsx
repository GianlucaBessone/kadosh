import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
}

export function MetricCard({ title, value, icon: Icon, description, trend, variant = 'default' }: MetricCardProps) {
  const variantStyles = {
    default: 'text-slate-500 bg-slate-100 dark:bg-slate-800',
    primary: 'text-primary bg-primary/10',
    success: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30',
    warning: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30',
    destructive: 'text-rose-500 bg-rose-100 dark:bg-rose-900/30',
  };

  return (
    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${variantStyles[variant]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            {trend && (
              <span className={`font-medium ${trend.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
              </span>
            )}
            {description && <span>{description}</span>}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
