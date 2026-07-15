import { Transaction } from '@/lib/db';
import { formatMoney } from '@/lib/utils';
import { MoneyDisplay } from '@/components/ui/MoneyDisplay';
import { 
  Sprout, Droplet, HandHeart, Wallet, Banknote,
  ShoppingCart, Home, Car, Utensils, Pill, BookOpen, Film, Lightbulb, Shirt, Package,
  Briefcase, Laptop, Gift, TrendingUp, Building2
} from 'lucide-react';

const categoryIconMap: Record<string, any> = {
  supermarket: ShoppingCart,
  housing: Home,
  transport: Car,
  food: Utensils,
  health: Pill,
  education: BookOpen,
  entertainment: Film,
  services: Lightbulb,
  clothing: Shirt,
  salary: Briefcase,
  freelance: Laptop,
  gifts: Gift,
  investments: TrendingUp,
  business: Building2,
  other: Package
};

export function TransactionCard({ tx }: { tx: Transaction }) {
  const isSeed = tx.notes?.toLowerCase().includes('semilla');
  const isTithe = tx.notes?.toLowerCase().includes('diezmo') || tx.categoryId === 'tithe';
  
  // Determine styles and icons based on type
  let bgColor = '';
  let textColor = '';
  let iconBgColor = '';
  let BackgroundIcon: any = null;
  let MainIcon: any = null;
  
  if (isTithe) {
    bgColor = 'bg-gold/5 border-gold/10';
    textColor = 'text-gold';
    iconBgColor = 'bg-gold/10';
    BackgroundIcon = HandHeart;
    MainIcon = HandHeart;
  } else if (isSeed) {
    if (tx.type === 'INCOME') {
      bgColor = 'bg-success/5 border-success/10';
      textColor = 'text-success';
      iconBgColor = 'bg-success/10';
      BackgroundIcon = Sprout;
      MainIcon = Sprout;
    } else {
      bgColor = 'bg-secondary/10 border-secondary/20'; 
      textColor = 'text-muted-foreground';
      iconBgColor = 'bg-secondary/20';
      BackgroundIcon = Droplet;
      MainIcon = Droplet;
    }
  } else if (tx.type === 'INCOME') {
    bgColor = 'bg-success/5 border-success/10';
    textColor = 'text-success';
    iconBgColor = 'bg-success/10';
    BackgroundIcon = Banknote;
    MainIcon = tx.categoryId && categoryIconMap[tx.categoryId] ? categoryIconMap[tx.categoryId] : Banknote;
  } else {
    bgColor = 'bg-destructive/5 border-destructive/10';
    textColor = 'text-destructive';
    iconBgColor = 'bg-destructive/10';
    BackgroundIcon = Wallet;
    MainIcon = tx.categoryId && categoryIconMap[tx.categoryId] ? categoryIconMap[tx.categoryId] : Wallet;
  }

  return (
    <div className={`relative flex items-center justify-between p-4 rounded-3xl border shadow-sm gap-2 overflow-hidden ${bgColor}`}>
      <div className={`absolute -right-2 -bottom-4 opacity-10 ${textColor} pointer-events-none`}>
        {BackgroundIcon && <BackgroundIcon className="w-24 h-24" />}
      </div>

      <div className="flex items-center gap-3 overflow-hidden z-10 relative">
        <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${iconBgColor} ${textColor}`}>
          {MainIcon && <MainIcon className="w-5 h-5" />}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{tx.notes || (tx.type === 'INCOME' ? 'Ingreso' : 'Gasto')}</p>
          <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
        </div>
      </div>
      <span className={`font-semibold text-sm shrink-0 whitespace-nowrap z-10 relative flex items-center ${textColor}`}>
        {tx.type === 'INCOME' ? '+' : '-'} <MoneyDisplay amount={tx.amount} className="ml-1" />
      </span>
    </div>
  );
}
