'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, ArrowDownRight, ChevronDown } from 'lucide-react';
import { useTransaction } from '@/context/transaction-context';

export function SpendingBreakdownCard() {
  const { transactions } = useTransaction();

  const totalSpending = useMemo(() => {
    const sum = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    return sum > 0 ? sum : 20520.32;
  }, [transactions]);

  const items = [
    { label: 'House Rent', amount: 2000.0, color: 'bg-emerald-700 dark:bg-emerald-600', width: '46%' },
    { label: 'Foods', amount: 1500.0, color: 'bg-emerald-500 dark:bg-emerald-400', width: '35%' },
    { label: 'Others', amount: 800.0, color: 'bg-slate-300 dark:bg-slate-700', width: '19%' },
  ];

  return (
    <Card className="h-full border border-border/50 bg-card rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <span className="text-sm font-bold text-foreground">Spending Overview</span>
          <Info className="w-3.5 h-3.5" />
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg gap-1 border-border/60">
          <span>This Month</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-5 pt-1 flex-1 flex flex-col justify-between">
        <div className="flex items-baseline gap-2.5">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            ${totalSpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            +1.5% <ArrowDownRight className="w-3 h-3 inline" />
          </span>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold text-foreground">Spending Breakdown</p>
          
          {/* Legend Items */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-700" /> House Rent
              </p>
              <p className="font-bold text-foreground mt-0.5">$2,000.00</p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Foods
              </p>
              <p className="font-bold text-foreground mt-0.5">$1,500.00</p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                <span className="w-2 h-2 rounded-full bg-slate-300" /> Others
              </p>
              <p className="font-bold text-foreground mt-0.5">$800.00</p>
            </div>
          </div>

          {/* Multi-segment Progress Bar */}
          <div className="h-6 w-full rounded-xl bg-muted p-1 flex items-center gap-1 overflow-hidden">
            {items.map((item, idx) => (
              <div
                key={idx}
                className={`h-full rounded-lg ${item.color} transition-all duration-300`}
                style={{ width: item.width }}
                title={`${item.label}: $${item.amount}`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
