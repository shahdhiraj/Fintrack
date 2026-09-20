'use client';

import { useTransaction } from '@/context/transaction-context';
import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, Zap, CalendarDays } from 'lucide-react';
import { CategoryBreakdownChart } from '@/components/reports/category-breakdown-chart';
import { IncomeVsExpenseChart } from '@/components/reports/income-vs-expense-chart';
import { subDays, differenceInDays } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsPage() {
  const { transactions } = useTransaction();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const reportData = useMemo(() => {
    if (!isClient) {
      return {
        monthlyIncome: 0,
        monthlyExpense: 0,
        categorySpending: {},
        highestSpendingCategory: 'N/A',
        avgDailySpending: 0,
      };
    }

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const thirtyDaysAgo = subDays(today, 29);

    const monthlyTransactions = transactions.filter(t => {
      const date = t.date.toDate();
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const last30DaysTransactions = transactions.filter(t => t.date.toDate() >= thirtyDaysAgo);

    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpense = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const categorySpending = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const categoryKey = t.category || 'Uncategorized';
        if (!acc[categoryKey]) {
          acc[categoryKey] = 0;
        }
        acc[categoryKey] += t.amount;
        return acc;
      }, {} as { [key: string]: number });
    
    const highestSpendingCategory = Object.entries(categorySpending).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

    const totalSpendingLast30Days = last30DaysTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const days = differenceInDays(today, thirtyDaysAgo) + 1;
    const avgDailySpending = totalSpendingLast30Days / days;

    return { monthlyIncome, monthlyExpense, categorySpending, highestSpendingCategory, avgDailySpending };
  }, [transactions, isClient]);

  const {
    monthlyIncome,
    monthlyExpense,
    categorySpending,
    highestSpendingCategory,
    avgDailySpending,
  } = reportData;
  
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  
  if (!isClient) {
      return (
          <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
              <div className="flex items-center justify-between space-y-2">
                <Skeleton className="h-10 w-1/3" />
              </div>
               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                   <Card><CardHeader><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-8 w-1/3" /></CardContent></Card>
                   <Card><CardHeader><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-8 w-1/3" /></CardContent></Card>
                   <Card><CardHeader><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-8 w-1/3" /></CardContent></Card>
               </div>
               <div className="grid gap-4 md:grid-cols-2">
                   <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-[350px] w-full" /></CardContent></Card>
                   <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-[350px] w-full" /></CardContent></Card>
               </div>
          </div>
      )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Spending Reports</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spending (This Month)</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(monthlyExpense)}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Highest Spending Category</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{highestSpendingCategory}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Daily Spend (Last 30 Days)</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(avgDailySpending)}</div>
            </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <IncomeVsExpenseChart income={monthlyIncome} expense={monthlyExpense} />
        <CategoryBreakdownChart data={categorySpending} />
      </div>
    </div>
  );
}
