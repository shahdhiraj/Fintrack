
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTransaction } from '@/context/transaction-context';
import { useTodayKey } from '@/hooks/use-now';
import { TrendingDown, Zap, Calendar } from 'lucide-react';
import { CATEGORY_ICONS } from '@/lib/sample-data';
import { Category } from '@/lib/types';
import { formatMoney } from '@/lib/currency';

export function DashboardStatCards() {
  const { transactions } = useTransaction();
  const todayKey = useTodayKey();

  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Expenses for this month
    const thisMonthExpenses = transactions.filter((t) => {
      const d = t.date.toDate();
      return (
        t.type === 'expense' &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      );
    });

    const totalSpendingThisMonth = thisMonthExpenses.reduce((sum, t) => sum + t.amount, 0);

    // Highest spending category
    const categoryTotals: Record<string, number> = {};
    thisMonthExpenses.forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    let highestCategory = 'N/A';
    let maxAmount = 0;
    Object.entries(categoryTotals).forEach(([cat, amt]) => {
      if (amt > maxAmount) {
        maxAmount = amt;
        highestCategory = cat;
      }
    });

    // Last 30 days expenses
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const last30DaysExpenses = transactions.filter((t) => {
      const d = t.date.toDate();
      return t.type === 'expense' && d >= thirtyDaysAgo;
    });

    const total30Days = last30DaysExpenses.reduce((sum, t) => sum + t.amount, 0);
    const avgDailySpend = total30Days / 30;

    return {
      totalSpendingThisMonth,
      highestCategory,
      highestCategoryAmount: maxAmount,
      avgDailySpend,
    };
    // todayKey recomputes the date windows at midnight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, todayKey]);

  const formatCurrency = (val: number) => formatMoney(val);

  return (
    <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
      {/* Card 1: Total Spending (This Month) */}
      <Card className="border border-border/50 bg-card rounded-2xl shadow-sm hover:shadow-md transition-all">
        <CardContent className="p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Total Spending (This Month)
            </span>
            <TrendingDown className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-foreground tracking-tight">
              {formatCurrency(metrics.totalSpendingThisMonth)}
            </h3>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Highest Spending Category */}
      <Card className="border border-border/50 bg-card rounded-2xl shadow-sm hover:shadow-md transition-all">
        <CardContent className="p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Highest Spending Category
            </span>
            <Zap className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl font-extrabold text-foreground tracking-tight">
              {metrics.highestCategory !== 'N/A' && (
                <span className="mr-1.5 text-xl">
                  {CATEGORY_ICONS[metrics.highestCategory as Category] || '📦'}
                </span>
              )}
              {metrics.highestCategory}
            </h3>
            {metrics.highestCategoryAmount > 0 && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                ({formatCurrency(metrics.highestCategoryAmount)})
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Avg. Daily Spend (Last 30 Days) */}
      <Card className="border border-border/50 bg-card rounded-2xl shadow-sm hover:shadow-md transition-all">
        <CardContent className="p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Avg. Daily Spend (Last 30 Days)
            </span>
            <Calendar className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-foreground tracking-tight">
              {formatCurrency(metrics.avgDailySpend)}
            </h3>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
