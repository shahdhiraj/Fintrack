
import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PiggyBank } from 'lucide-react';
import { GoalsPanel } from '@/components/goals/goals-panel';
import { addMonths, differenceInCalendarDays, endOfMonth, format, startOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Banknote, Target, TrendingDown, Gauge } from 'lucide-react';
import { useTransaction } from '@/context/transaction-context';
import { BudgetList, type BudgetRow } from '@/components/budgets/budget-list';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNow } from '@/hooks/use-now';
import { useToast } from '@/hooks/use-toast';
import { budgetStatus, effectiveLimit, INCOME_CATEGORIES, monthKey, type BudgetStatus } from '@/lib/budgets';
import { categories } from '@/lib/types';
import { cn, formatMoney } from '@/lib/utils';

type Filter = 'all' | BudgetStatus;

const BUDGET_CATEGORIES = categories.filter((c) => !(INCOME_CATEGORIES as readonly string[]).includes(c));

export default function BudgetsPage() {
  const { transactions, budgets, setBudgetLimit, goals } = useTransaction();
  // ?tab=goals opens the goals tab (linkable from anywhere).
  const [params, setParams] = useSearchParams();
  const view = params.get('tab') === 'goals' ? 'goals' : 'budgets';
  const setView = (v: string) => setParams(v === 'goals' ? { tab: 'goals' } : {}, { replace: true });
  const { toast } = useToast();
  const now = useNow(60_000);
  const currentKey = monthKey(now);
  const [offset, setOffset] = useState(0); // 0 = current month, -1 = last month …
  const [filter, setFilter] = useState<Filter>('all');

  const monthStart = startOfMonth(addMonths(now, offset));
  const key = monthKey(monthStart);
  const isCurrent = key === currentKey;
  const isFuture = key > currentKey;

  const rows = useMemo<BudgetRow[]>(() => {
    const spentBy = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== 'expense' || monthKey(t.date.toDate()) !== key) continue;
      spentBy.set(t.category, (spentBy.get(t.category) ?? 0) + t.amount);
    }
    return BUDGET_CATEGORIES.map((category) => {
      const eff = effectiveLimit(category, key, budgets);
      const spent = spentBy.get(category) ?? 0;
      return { category, spent, ...eff, status: budgetStatus(spent, eff.limit), pct: eff.limit > 0 ? (spent / eff.limit) * 100 : spent > 0 ? 100 : 0 };
    }).sort((a, b) => b.pct - a.pct);
  }, [transactions, budgets, key]);

  const totals = useMemo(() => {
    const cap = rows.reduce((a, r) => a + r.limit, 0);
    const spent = rows.reduce((a, r) => a + r.spent, 0);
    const daysLeft = isCurrent ? differenceInCalendarDays(endOfMonth(now), now) + 1 : 0;
    const remaining = Math.max(0, cap - spent);
    return {
      cap,
      spent,
      remaining,
      pct: cap > 0 ? Math.round((spent / cap) * 100) : 0,
      daysLeft,
      perDay: daysLeft > 0 ? remaining / daysLeft : 0,
      counts: {
        over: rows.filter((r) => r.status === 'over').length,
        near: rows.filter((r) => r.status === 'near').length,
        ok: rows.filter((r) => r.status === 'ok').length,
      },
    };
  }, [rows, isCurrent, now]);

  const onSave = useCallback(
    (category: string, limit: number) => {
      setBudgetLimit(category, key, limit);
      toast({ title: 'Budget saved', description: `${category}: ${formatMoney(limit)} from ${format(monthStart, 'MMMM yyyy')} onward.` });
    },
    // monthStart is derived from key
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setBudgetLimit, key, toast]
  );

  const visible = filter === 'all' ? rows : rows.filter((r) => r.status === filter);
  const standing = totals.pct > 100 ? 'Over budget' : totals.pct > 85 ? 'Tight' : totals.pct > 60 ? 'On pace' : 'Healthy';

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Budgets & Goals</h1>
          <p className="text-sm text-muted-foreground">
            {view === 'goals'
              ? 'Save towards things you want, and see how much to put aside each month.'
              : 'Monthly limits per category. A limit stays in place for later months until you change it.'}
          </p>
        </div>
        <div className={cn('flex items-center gap-1.5', view === 'goals' && 'hidden')}>
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setOffset((o) => o - 1)} aria-label="Previous month">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="min-w-[120px] text-center text-sm font-bold">{format(monthStart, 'MMMM yyyy')}</span>
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setOffset((o) => o + 1)} aria-label="Next month">
            <ChevronRight className="w-4 h-4" />
          </Button>
          {!isCurrent && (
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setOffset(0)}>
              This month
            </Button>
          )}
        </div>
      </div>

      <Tabs value={view} onValueChange={setView}>
        <TabsList className="h-11 rounded-xl p-1">
          <TabsTrigger value="budgets" className="h-9 gap-1.5 rounded-lg px-4 text-sm">
            <Target className="h-4 w-4" aria-hidden="true" /> Monthly budgets
          </TabsTrigger>
          <TabsTrigger value="goals" className="h-9 gap-1.5 rounded-lg px-4 text-sm">
            <PiggyBank className="h-4 w-4" aria-hidden="true" /> Savings goals
            {goals.length > 0 && <span className="rounded-full bg-primary/15 px-1.5 text-[11px] font-bold text-primary">{goals.length}</span>}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {view === 'goals' ? (
        <GoalsPanel />
      ) : (
      <>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Stat icon={Target} label="Total budget" value={formatMoney(totals.cap)} hint={`${rows.length} categories`} tone="emerald" />
        <Stat icon={TrendingDown} label="Spent" value={formatMoney(totals.spent)} hint={`${totals.pct}% of budget`} tone="amber" />
        <Stat
          icon={Banknote}
          label="Remaining"
          value={formatMoney(totals.remaining)}
          hint={isCurrent ? `${formatMoney(totals.perDay)}/day for ${totals.daysLeft} day${totals.daysLeft === 1 ? '' : 's'}` : isFuture ? 'Upcoming month' : 'Month closed'}
          tone="emerald"
        />
        <Stat
          icon={Gauge}
          label="Standing"
          value={standing}
          hint={`${totals.counts.over} over · ${totals.counts.near} near limit`}
          tone={totals.pct > 100 ? 'rose' : totals.pct > 85 ? 'amber' : 'sky'}
        />
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)} className="-mx-4 overflow-x-auto px-4 no-scrollbar md:mx-0 md:px-0">
        <TabsList className="h-auto min-h-9 w-max">
          <TabsTrigger value="all" className="text-xs">All ({rows.length})</TabsTrigger>
          <TabsTrigger value="over" className="text-xs">Exceeded ({totals.counts.over})</TabsTrigger>
          <TabsTrigger value="near" className="text-xs">Near limit ({totals.counts.near})</TabsTrigger>
          <TabsTrigger value="ok" className="text-xs">On track ({totals.counts.ok})</TabsTrigger>
        </TabsList>
      </Tabs>

      <BudgetList rows={visible} onSave={onSave} editable />
      </>
      )}
    </div>
  );
}

const TONES = {
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
};

function Stat({ icon: Icon, label, value, hint, tone }: { icon: typeof Target; label: string; value: string; hint: string; tone: keyof typeof TONES }) {
  return (
    <Card className="min-w-0 rounded-2xl border-border/50">
      {/* The icon sits in the corner so the amount gets the card's full width on phones. */}
      <CardContent className="relative p-3.5 sm:p-4">
        <div className={cn('absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg sm:right-4 sm:top-4 sm:h-10 sm:w-10 sm:rounded-xl', TONES[tone])}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        </div>
        <p className="pr-10 text-xs font-bold text-muted-foreground sm:pr-12">{label}</p>
        <p className="mt-2 text-lg font-extrabold tracking-tight tabular-nums break-words sm:text-xl">{value}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
