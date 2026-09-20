'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, ChevronDown, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTransaction } from '@/context/transaction-context';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type Filter = 'income' | 'expense' | 'savings';

export function CashFlowChart() {
  const { transactions } = useTransaction();
  const [activeFilter, setActiveFilter] = useState<Filter>('income');

  const { data, total, hasData, currentMonthIndex } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();

    // Twelve calendar-month buckets for the current year.
    const income = new Array(12).fill(0);
    const expense = new Array(12).fill(0);

    for (const t of transactions) {
      const d = t.date.toDate();
      if (d.getFullYear() !== year) continue;
      const m = d.getMonth();
      if (t.type === 'income') income[m] += t.amount;
      else expense[m] += t.amount;
    }

    const valueFor = (m: number) => {
      if (activeFilter === 'income') return income[m];
      if (activeFilter === 'expense') return expense[m];
      return income[m] - expense[m]; // savings
    };

    const rows = MONTH_LABELS.map((month, m) => ({
      month,
      amount: valueFor(m),
      active: m === now.getMonth(),
    }));

    const sum = rows.reduce((acc, r) => acc + r.amount, 0);
    const anyActivity = income.some((v) => v > 0) || expense.some((v) => v > 0);

    return { data: rows, total: sum, hasData: anyActivity, currentMonthIndex: now.getMonth() };
  }, [transactions, activeFilter]);

  const currentMonthValue = data[currentMonthIndex]?.amount ?? 0;

  return (
    <Card className="h-full border border-border/50 bg-card rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <span className="text-sm font-bold text-foreground">Cash Flow</span>
          <Info className="w-3.5 h-3.5" />
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg gap-1 border-border/60">
          <span>Yearly</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4 pt-1 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>

          {/* Toggle Pills */}
          <div className="flex items-center gap-2 mt-3">
            {(['income', 'expense', 'savings'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-all ${
                  activeFilter === f
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="w-full h-[200px] relative">
          {hasData ? (
            <>
              {currentMonthValue !== 0 && (
                <div className="absolute right-2 top-2 z-10 bg-foreground text-background text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                  <span>{MONTH_LABELS[currentMonthIndex]} :</span>
                  <span className="text-emerald-400 font-extrabold">
                    ${currentMonthValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 30, right: 0, left: -25, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(5, 150, 105, 0.06)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border border-border text-popover-foreground px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-md">
                            ${Number(payload[0].value).toLocaleString()}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 6, 6]} barSize={18}>
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.active ? '#059669' : 'rgba(5, 150, 105, 0.15)'}
                        className="transition-colors hover:fill-emerald-500"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center gap-1.5">
              <BarChart3 className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No cash flow data yet</p>
              <p className="text-xs text-muted-foreground/70">Add transactions to see your monthly cash flow.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
