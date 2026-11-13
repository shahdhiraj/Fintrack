
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, ArrowDownRight, ArrowUpRight, ChevronDown, PieChart } from 'lucide-react';
import { useTransaction } from '@/context/transaction-context';
import { useTodayKey } from '@/hooks/use-now';
import { expensesByCategory, formatTrend, percentChange, periodRange, PERIOD_LABELS, type Period } from '@/lib/finance';
import { formatMoney } from '@/lib/utils';

const SEGMENT_STYLES = [
  { bar: 'bg-emerald-700 dark:bg-emerald-600', dot: 'bg-emerald-700' },
  { bar: 'bg-emerald-500 dark:bg-emerald-400', dot: 'bg-emerald-500' },
  { bar: 'bg-slate-300 dark:bg-slate-600', dot: 'bg-slate-300 dark:bg-slate-600' },
];

export function SpendingBreakdownCard() {
  const { transactions } = useTransaction();
  const [period, setPeriod] = useState<Period>('this-month');
  const todayKey = useTodayKey();

  const { total, trend, segments } = useMemo(() => {
    const now = new Date();
    const range = periodRange(period, now);
    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .map((t) => ({ amount: t.amount, type: t.type, category: t.category, date: t.date.toDate() }));

    const inRange = range ? expenses.filter((t) => t.date >= range.start && t.date < range.end) : expenses;
    const prev = range ? expenses.filter((t) => t.date >= range.prevStart && t.date < range.prevEnd) : [];

    const sum = inRange.reduce((acc, t) => acc + t.amount, 0);
    const prevSum = prev.reduce((acc, t) => acc + t.amount, 0);

    // Top two categories, everything else grouped as "Others".
    const byCat = expensesByCategory(inRange);
    const top = byCat.slice(0, 2);
    const others = byCat.slice(2).reduce((acc, c) => acc + c.amount, 0);
    const segs = [...top.map((c) => ({ label: c.category, amount: c.amount }))];
    if (others > 0) segs.push({ label: 'Others', amount: others });

    return {
      total: sum,
      trend: range ? percentChange(sum, prevSum) : null,
      segments: segs.map((s) => ({ ...s, pct: sum > 0 ? (s.amount / sum) * 100 : 0 })),
    };
    // todayKey makes "this month" roll over at midnight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, period, todayKey]);

  const prevLabel = period === 'this-year' ? 'last year' : 'the previous month';

  return (
    <Card className="h-full border border-border/50 bg-card rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <span className="text-sm font-bold text-foreground">Spending Overview</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger aria-label="About this card" data-compact className="-m-2.5 flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted">
                <Info className="w-3.5 h-3.5" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px] text-xs">
                Total expenses for the selected period, with your two biggest categories.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg gap-1 border-border/60">
              <span>{PERIOD_LABELS[period]}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup value={period} onValueChange={(v) => setPeriod(v as Period)}>
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <DropdownMenuRadioItem key={p} value={p} className="text-xs">
                  {PERIOD_LABELS[p]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-5 pt-1 flex-1 flex flex-col justify-between">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{formatMoney(total)}</span>
          {trend !== null && (
            <span
              title={`Compared with ${prevLabel}`}
              className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full border ${
                trend <= 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              }`}
            >
              {formatTrend(trend)}
              {trend > 0 ? <ArrowUpRight className="w-3 h-3 inline" /> : <ArrowDownRight className="w-3 h-3 inline" />}
            </span>
          )}
        </div>

        {segments.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-bold text-foreground">Spending Breakdown</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {segments.map((s, i) => (
                <div key={s.label} className="min-w-0">
                  <p className="flex items-center gap-1.5 text-muted-foreground text-[11px] truncate">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${SEGMENT_STYLES[i].dot}`} /> {s.label}
                  </p>
                  <p className="font-bold text-foreground mt-0.5">{formatMoney(s.amount)}</p>
                  <p className="text-[10px] text-muted-foreground">{s.pct.toFixed(0)}%</p>
                </div>
              ))}
            </div>
            <div className="h-6 w-full rounded-xl bg-muted p-1 flex items-center gap-1 overflow-hidden" role="img" aria-label="Spending split by category">
              {segments.map((s, i) => (
                <div
                  key={s.label}
                  className={`h-full rounded-lg ${SEGMENT_STYLES[i].bar} transition-all duration-300`}
                  style={{ width: `${Math.max(s.pct, 2)}%` }}
                  title={`${s.label}: ${formatMoney(s.amount)}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-1.5 py-6">
            <PieChart className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No spending in {PERIOD_LABELS[period].toLowerCase()}</p>
            <p className="text-xs text-muted-foreground/70">Expenses you add will be broken down here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
