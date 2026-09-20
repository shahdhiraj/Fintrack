'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, ArrowUpRight, ArrowDownRight, ChevronDown, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTransaction } from '@/context/transaction-context';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function EarningOverviewChart() {
  const { transactions } = useTransaction();

  const { data, totalEarnings, trend, hasData } = useMemo(() => {
    const now = new Date();
    // Build the trailing 6-month buckets, oldest first.
    const buckets: { key: string; month: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        month: MONTH_LABELS[d.getMonth()],
        amount: 0,
      });
    }
    const index = new Map(buckets.map((b) => [b.key, b]));

    let total = 0;
    for (const t of transactions) {
      if (t.type !== 'income') continue;
      total += t.amount;
      const d = t.date.toDate();
      const bucket = index.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (bucket) bucket.amount += t.amount;
    }

    const current = buckets[buckets.length - 1].amount;
    const previous = buckets[buckets.length - 2]?.amount ?? 0;
    const change = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;

    return {
      data: buckets,
      totalEarnings: total,
      trend: change,
      hasData: total > 0,
    };
  }, [transactions]);

  return (
    <Card className="h-full border border-border/50 bg-card rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <span className="text-sm font-bold text-foreground">Earning Overview</span>
          <Info className="w-3.5 h-3.5" />
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg gap-1 border-border/60">
          <span>Last 6 Months</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4 pt-1 flex-1 flex flex-col justify-between">
        <div className="flex items-baseline gap-2.5">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            ${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {hasData && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full border ${
                trend >= 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              }`}
            >
              {trend >= 0 ? '+' : ''}
              {trend.toFixed(1)}%
              {trend >= 0 ? <ArrowUpRight className="w-3 h-3 inline" /> : <ArrowDownRight className="w-3 h-3 inline" />}
            </span>
          )}
        </div>

        <div className="w-full h-[180px] relative">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 30, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="earningGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip
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
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#earningGreen)"
                  dot={{ r: 4, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center gap-1.5">
              <TrendingUp className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No income recorded yet</p>
              <p className="text-xs text-muted-foreground/70">Add an income transaction to see your earnings trend.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
