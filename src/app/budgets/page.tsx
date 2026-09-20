'use client';

import React, { useMemo } from 'react';
import { useTransaction } from '@/context/transaction-context';
import { BudgetList } from '@/components/budgets/budget-list';
import { Card, CardContent } from '@/components/ui/card';
import { Target, TrendingDown, DollarSign, ShieldAlert, Sparkles } from 'lucide-react';

export default function BudgetsPage() {
  const { transactions } = useTransaction();

  // Compute total monthly spending
  const totalExpenseThisMonth = useMemo(() => {
    const now = new Date();
    return transactions
      .filter((t) => {
        const d = t.date.toDate();
        return (
          t.type === 'expense' &&
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth()
        );
      })
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const defaultTotalLimit = 4200;
  const totalRemaining = Math.max(0, defaultTotalLimit - totalExpenseThisMonth);
  const percentUsed = Math.min(100, Math.round((totalExpenseThisMonth / defaultTotalLimit) * 100));

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <span>Monthly Category Budgets</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Active Goals
            </span>
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Set, monitor, and adjust spending limits for all categories in real time.
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border/50 bg-card rounded-2xl shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total Budget Cap
              </p>
              <h3 className="text-2xl font-extrabold text-foreground mt-1">
                ${defaultTotalLimit.toLocaleString()}
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                Target Monthly Ceiling
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card rounded-2xl shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total Spent
              </p>
              <h3 className="text-2xl font-extrabold text-foreground mt-1">
                ${totalExpenseThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                {percentUsed}% of Limit Spent
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <TrendingDown className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card rounded-2xl shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Remaining Allowance
              </p>
              <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                ${totalRemaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                Available to Spend
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card rounded-2xl shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Budget Standing
              </p>
              <h3 className="text-2xl font-extrabold text-foreground mt-1">
                {percentUsed > 90 ? 'Critical ⚠️' : percentUsed > 75 ? 'Warning 🟡' : 'Healthy 🟢'}
              </h3>
              <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                Smart Goal Assessment
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Category Budget List */}
      <div>
        <BudgetList transactions={transactions} />
      </div>
    </div>
  );
}
