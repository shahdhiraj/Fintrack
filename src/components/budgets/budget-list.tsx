'use client';

import { useMemo, useState, useEffect } from 'react';
import type { Budget, Transaction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import { useFirestore, useUser, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, where, query }from 'firebase/firestore';
import { categories } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { CATEGORY_ICONS } from '@/lib/sample-data';

type BudgetListProps = {
  transactions: Transaction[];
};

const DEFAULT_LIMITS: Record<string, number> = {
  Housing: 1800,
  Groceries: 500,
  Transport: 300,
  Utilities: 250,
  'Dining Out': 250,
  Entertainment: 200,
  Shopping: 300,
  Health: 150,
  Education: 300,
  Travel: 400,
  Subscriptions: 100,
  Pets: 150,
  Gifts: 150,
  Investments: 500,
  Other: 200,
};

export function BudgetList({ transactions }: BudgetListProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [currentMonthKey, setCurrentMonthKey] = useState<string | null>(null);

  useEffect(() => {
    setCurrentMonthKey(new Date().toISOString().slice(0, 7)); // "YYYY-MM"
  }, []);

  const budgetsCol = useMemoFirebase(() => {
    if (!firestore || !user || !currentMonthKey) return null;
    return query(
        collection(firestore, 'users', user.uid, 'budgets'),
        where('month', '==', currentMonthKey)
    );
  }, [firestore, user, currentMonthKey]);

  const { data: budgets, isLoading: budgetsLoading } = useCollection<Budget>(budgetsCol);

  const spendingByCat = useMemo(() => {
    if (!currentMonthKey) return {};
    const [year, month] = currentMonthKey.split('-').map(Number);
    const currentMonthDate = month - 1;

    return transactions
      .filter(
        (t) => {
            const transactionDate = t.date.toDate();
            return (
                t.type === 'expense' &&
                transactionDate.getFullYear() === year &&
                transactionDate.getMonth() === currentMonthDate
            );
        }
      )
      .reduce((acc, t) => {
        if (!acc[t.category]) {
          acc[t.category] = 0;
        }
        acc[t.category] += t.amount;
        return acc;
      }, {} as { [key: string]: number });
  }, [transactions, currentMonthKey]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

  const handleBudgetChange = (budgetId: string, categoryId: string, newLimit: number) => {
    if (!firestore || !user || !currentMonthKey) return;
    
    // If the budget has a real ID from firestore, use it. Otherwise, create a new one.
    const isNewBudget = budgetId === categoryId;
    const budgetRef = isNewBudget
        ? doc(collection(firestore, 'users', user.uid, 'budgets'))
        : doc(firestore, 'users', user.uid, 'budgets', budgetId);

    // Ensure we include the 'id' field in the data to satisfy firestore security rules
    setDocumentNonBlocking(budgetRef, {
        id: budgetRef.id,
        categoryId: categoryId,
        month: currentMonthKey,
        limit: newLimit,
    }, { merge: true });
  };

  const displayBudgets = useMemo(() => {
    if (!currentMonthKey) return [];
    const budgetMap = new Map(budgets?.map(b => [b.categoryId, b]));
    return categories
        .filter(c => c !== 'Salary')
        .map(catName => {
            const existingBudget = budgetMap.get(catName);
            const defaultLimit = DEFAULT_LIMITS[catName] || 300;
            if (existingBudget && existingBudget.limit > 0) {
                return existingBudget;
            }
            return {
                id: catName,
                categoryId: catName,
                limit: defaultLimit,
                month: currentMonthKey,
            };
        });
  }, [budgets, currentMonthKey]);

  if (budgetsLoading || !currentMonthKey) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-3 w-full" />
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-4 w-1/4" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {displayBudgets.map((budget) => {
        const spent = spendingByCat[budget.categoryId] || 0;
        const progress = budget.limit > 0 ? Math.min((spent / budget.limit) * 100, 100) : 0;
        const icon = CATEGORY_ICONS[budget.categoryId as keyof typeof CATEGORY_ICONS] || '📦';
        const isOver = spent > budget.limit && budget.limit > 0;
        const isNear = progress >= 80 && !isOver;

        return (
          <Card key={budget.categoryId} className="border border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                {budget.categoryId}
              </CardTitle>
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                  isOver
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    : isNear
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                )}
              >
                {isOver ? "Exceeded" : isNear ? "Near Limit" : "On Track"}
              </span>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Progress
                  value={progress}
                  className={cn(
                    "h-2.5 bg-muted/50",
                    isOver ? "[&>div]:bg-rose-500" : isNear ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"
                  )}
                />
                <div className="flex justify-between text-xs text-muted-foreground font-medium pt-1">
                  <span>Spent: <strong className="text-foreground">{formatCurrency(spent)}</strong></span>
                  <span>Limit: <strong className="text-foreground">{formatCurrency(budget.limit)}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                <Label htmlFor={`budget-${budget.categoryId}`} className="text-xs text-muted-foreground whitespace-nowrap">
                  Set Goal ($):
                </Label>
                <Input
                  id={`budget-${budget.categoryId}`}
                  type="number"
                  defaultValue={budget.limit}
                  onBlur={(e) => handleBudgetChange(budget.id, budget.categoryId, Number(e.target.value))}
                  className="h-8 text-xs font-semibold"
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
