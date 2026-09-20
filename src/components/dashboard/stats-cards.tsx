'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ArrowDownRight, ArrowUpRight, DollarSign, Wallet, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { useTransaction } from '@/context/transaction-context';
import { Progress } from '@/components/ui/progress';

export function StatsCards() {
  const { transactions } = useTransaction();
  
  const { totalIncome, totalExpenses, netBalance, savingsRate, healthScore, healthLabel } = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyTransactions = transactions.filter((t) => {
      const date = t.date.toDate();
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const income = monthlyTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthlyTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;
    const rate = income > 0 ? Math.max(0, Math.round((balance / income) * 100)) : 0;

    let score = 50;
    if (income > 0) {
      if (expenses <= income * 0.5) score = 92;
      else if (expenses <= income * 0.75) score = 78;
      else if (expenses <= income) score = 64;
      else score = 35;
    } else if (transactions.length > 0) {
      score = 45;
    }

    let label = 'Neutral';
    if (score >= 85) label = 'Excellent';
    else if (score >= 70) label = 'Good';
    else if (score >= 50) label = 'Fair';
    else label = 'Needs Review';

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netBalance: balance,
      savingsRate: rate,
      healthScore: score,
      healthLabel: label,
    };
  }, [transactions]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Income Card */}
      <Card className="relative overflow-hidden border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-card to-card hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Income
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">
              {formatCurrency(totalIncome)}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold">
              +Active
            </span>
            <span>This month</span>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Card */}
      <Card className="relative overflow-hidden border border-rose-500/20 bg-gradient-to-br from-rose-500/5 via-card to-card hover:border-rose-500/40 hover:shadow-lg hover:shadow-rose-500/5 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Expenses
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">
              {formatCurrency(totalExpenses)}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
            <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold">
              {totalIncome > 0 ? `${Math.round((totalExpenses / totalIncome) * 100)}% of Income` : 'Monthly'}
            </span>
            <span>Total Outflow</span>
          </div>
        </CardContent>
      </Card>

      {/* Net Balance Card */}
      <Card className="relative overflow-hidden border border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-card to-card hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Net Balance
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className={`text-3xl font-extrabold tracking-tight ${netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(netBalance)}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
            <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold">
              {savingsRate}% Savings Rate
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Financial Health Score Card */}
      <Card className="relative overflow-hidden border border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-card to-card hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Financial Health
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold tracking-tight text-foreground">
                {healthScore}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">/100</span>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              {healthLabel}
            </span>
          </div>
          <div className="mt-3 space-y-1">
            <Progress value={healthScore} className="h-1.5 bg-purple-500/10" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
