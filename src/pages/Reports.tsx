
import { useMemo, useState } from 'react';
import { addMonths, endOfMonth, format, isSameMonth, startOfMonth, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Zap, CalendarDays, PiggyBank } from 'lucide-react';
import { useTransaction } from '@/context/transaction-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CategoryBreakdownChart } from '@/components/reports/category-breakdown-chart';
import { IncomeVsExpenseChart } from '@/components/reports/income-vs-expense-chart';
import { InsightsCard } from '@/components/reports/insights-card';
import { ExportMenu } from '@/components/reports/export-menu';
import { useTodayKey } from '@/hooks/use-now';
import { formatTrend, percentChange } from '@/lib/finance';
import { buildInsights, buildMonthReport, headline } from '@/lib/report-insights';
import { formatMoney } from '@/lib/utils';

export default function ReportsPage() {
  const { transactions, budgets, wallets } = useTransaction();
  const todayKey = useTodayKey();
  const [offset, setOffset] = useState(0);

  const view = useMemo(() => {
    const today = new Date();
    const month = startOfMonth(addMonths(today, offset));
    const prevMonth = addMonths(month, -1);
    const monthTxns = transactions.filter((t) => isSameMonth(t.date.toDate(), month));
    const previousTxns = transactions.filter((t) => isSameMonth(t.date.toDate(), prevMonth));

    const report = buildMonthReport({ month, today, monthTxns, previousTxns, budgets });

    const byCat: Record<string, number> = {};
    for (const c of report.categories) if (c.spent > 0) byCat[c.category] = c.spent;

    // Average daily spend: last 30 days for the current month, otherwise across the whole month.
    const start = report.isCurrent ? subDays(today, 29) : month;
    const end = report.isCurrent ? today : endOfMonth(month);
    const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
    const windowSpend = transactions
      .filter((t) => t.type === 'expense' && t.date.toDate() >= start && t.date.toDate() <= end)
      .reduce((a, t) => a + t.amount, 0);

    const top = report.categories.find((c) => c.spent > 0) ?? null;
    return {
      report,
      monthTxns,
      insights: buildInsights(report, today),
      summary: headline(report),
      byCat,
      top,
      avgDaily: windowSpend / days,
      trend: percentChange(report.expense, report.previousExpense),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, budgets, offset, todayKey]);

  const { report } = view;
  const monthLabel = format(report.month, 'MMMM yyyy');

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">{report.count} transactions in {monthLabel}.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setOffset((o) => o - 1)} aria-label="Previous month">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="min-w-[120px] text-center text-sm font-bold">{monthLabel}</span>
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setOffset((o) => o + 1)} disabled={offset >= 0} aria-label="Next month">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <ExportMenu report={report} insights={view.insights} transactions={view.monthTxns} wallets={wallets} />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Stat icon={TrendingDown} label="Total spending" value={formatMoney(report.expense)} hint={view.trend === null ? 'No data for the previous month' : `${formatTrend(view.trend)} vs previous month`} />
        <Stat icon={TrendingUp} label="Income" value={formatMoney(report.income)} hint={`Net ${formatMoney(report.net)}`} />
        <Stat icon={PiggyBank} label="Savings rate" value={report.savingsRate === null ? 'n/a' : `${report.savingsRate.toFixed(0)}%`} hint="Share of income kept" />
        <Stat icon={Zap} label="Top category" value={view.top?.category ?? 'None yet'} hint={view.top ? formatMoney(view.top.spent) : 'No spending yet'} />
      </div>

      <InsightsCard headline={view.summary} insights={view.insights} monthLabel={format(report.month, 'MMMM')} />

      <Card className="rounded-2xl border-border/50">
        <CardHeader className="pb-2 flex flex-row items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-sm">Average daily spend: {formatMoney(view.avgDaily)}</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground pt-0">
          {report.isCurrent ? 'Over the last 30 days.' : `Across ${format(report.month, 'MMMM')}.`}
          {report.projectedExpense !== null && ` At this pace the month ends near ${formatMoney(report.projectedExpense)}.`}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <IncomeVsExpenseChart income={report.income} expense={report.expense} />
        <CategoryBreakdownChart data={view.byCat} />
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Zap; label: string; value: string; hint: string }) {
  return (
    <Card className="rounded-2xl border-border/50 transition-[transform,border-color] hover:-translate-y-0.5 hover:border-primary/30 motion-reduce:transform-none">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-muted-foreground">{label}</p>
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="mt-1.5 text-xl font-extrabold tracking-tight tabular-nums truncate">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>
      </CardContent>
    </Card>
  );
}
