'use client';

import { useTransaction } from '@/context/transaction-context';
import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import { CATEGORY_COLORS } from '@/lib/sample-data';

const COLOR_MAP: Record<string, string> = {
  Salary: '#10b981',
  Groceries: '#22c55e',
  Housing: '#3b82f6',
  Transport: '#06b6d4',
  Entertainment: '#a855f7',
  Health: '#f43f5e',
  Shopping: '#f59e0b',
  Utilities: '#ea580c',
  Other: '#64748b',
};

export function SpendingOverviewChart() {
  const { transactions, loadDemoData } = useTransaction();

  const data = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const spendingByCategory = transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          t.date.toDate().getMonth() === currentMonth &&
          t.date.toDate().getFullYear() === currentYear
      )
      .reduce((acc, t) => {
        const cat = t.category || 'Other';
        if (!acc[cat]) {
          acc[cat] = 0;
        }
        acc[cat] += t.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(spendingByCategory)
      .map(([name, total]) => ({
        name,
        total,
        fill: COLOR_MAP[name] || '#3b82f6',
      }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  const totalExpenseSum = useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.total, 0);
  }, [data]);

  return (
    <Card className="h-full border border-border/50 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            Spending Breakdown
          </CardTitle>
          <CardDescription>
            {data.length > 0
              ? `Total Expenses: $${totalExpenseSum.toLocaleString()} across ${data.length} categories`
              : 'Monthly expense breakdown by category'}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-4 flex-1 flex flex-col justify-center">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border/60 rounded-xl bg-muted/20">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
              <PieIcon className="w-6 h-6 text-emerald-500" />
            </div>
            <h4 className="font-semibold text-sm mb-1">No Expense Data Yet</h4>
            <p className="text-xs text-muted-foreground max-w-xs mb-4">
              Add transactions or load interactive sample data to visualize your spending habits.
            </p>
            <Button
              onClick={loadDemoData}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              Load Interactive Sample Data
            </Button>
          </div>
        ) : (
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      const percentage = totalExpenseSum > 0 ? ((item.total / totalExpenseSum) * 100).toFixed(1) : 0;
                      return (
                        <div className="rounded-lg border border-border/60 bg-popover/95 backdrop-blur-md p-2.5 shadow-xl text-xs space-y-1">
                          <p className="font-bold text-foreground flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                            {item.name}
                          </p>
                          <p className="text-muted-foreground">
                            Amount: <span className="font-semibold text-foreground">${item.total.toLocaleString()}</span>
                          </p>
                          <p className="text-muted-foreground">
                            Share: <span className="font-semibold text-emerald-500">{percentage}%</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
