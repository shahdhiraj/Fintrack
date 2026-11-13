
import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { CalendarClock, Check, ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AddRecurringBillDialog } from '@/components/dashboard/add-recurring-bill-dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { useTransaction } from '@/context/transaction-context';
import { useNow } from '@/hooks/use-now';
import { useToast } from '@/hooks/use-toast';
import { daysUntil, describeDue, monthlyEquivalent, nextDueDate } from '@/lib/finance';
import { CATEGORY_ICONS } from '@/lib/sample-data';
import { BILL_FREQUENCIES, type RecurringBill } from '@/lib/types';
import { cn, formatMoney } from '@/lib/utils';

type Tab = 'upcoming' | 'overdue' | 'paid' | 'all';

/** Occurrences of a bill that fall inside [from, to], projected forward from its next due date. */
function occurrencesBetween(bill: RecurringBill, from: Date, to: Date): Date[] {
  const out: Date[] = [];
  let d: Date | null = bill.dueDate.toDate();
  for (let guard = 0; d && d <= to && guard < 60; guard++) {
    if (d >= from) out.push(d);
    d = nextDueDate(d, bill.frequency ?? 'monthly');
  }
  return out;
}

export default function RecurringBillsPage() {
  const { recurringBills, wallets, payRecurringBill, deleteRecurringBill } = useTransaction();
  const { toast } = useToast();
  const now = useNow(60_000);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [query, setQuery] = useState('');
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const scheduled = recurringBills.filter((b) => b.status !== 'Paid');

  const stats = useMemo(() => {
    const overdue = scheduled.filter((b) => daysUntil(b.dueDate.toDate(), now) < 0);
    const week = scheduled.filter((b) => {
      const d = daysUntil(b.dueDate.toDate(), now);
      return d >= 0 && d <= 7;
    });
    const monthly = scheduled.reduce((acc, b) => acc + monthlyEquivalent(b.amount, b.frequency ?? 'monthly'), 0);
    const startThisMonth = startOfMonth(now);
    const paidThisMonth = recurringBills.filter((b) => b.lastPaidAt && b.lastPaidAt.toDate() >= startThisMonth).length;
    const sum = (list: RecurringBill[]) => list.reduce((acc, b) => acc + b.amount, 0);
    return { overdue, week, monthly, paidThisMonth, overdueSum: sum(overdue), weekSum: sum(week) };
  }, [scheduled, recurringBills, now]);

  // Calendar: every projected occurrence in the visible month.
  const calendar = useMemo(() => {
    const from = startOfWeek(startOfMonth(month));
    const to = endOfWeek(endOfMonth(month));
    const byDay = new Map<string, { bill: RecurringBill; date: Date }[]>();
    for (const bill of scheduled) {
      for (const date of occurrencesBetween(bill, from, to)) {
        const key = format(date, 'yyyy-MM-dd');
        byDay.set(key, [...(byDay.get(key) ?? []), { bill, date }]);
      }
    }
    const monthTotal = [...byDay.entries()]
      .filter(([k]) => isSameMonth(new Date(`${k}T00:00:00`), month))
      .reduce((acc, [, items]) => acc + items.reduce((s, i) => s + i.bill.amount, 0), 0);
    return { days: eachDayOfInterval({ start: from, end: to }), byDay, monthTotal };
  }, [scheduled, month]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let items = recurringBills;
    if (tab === 'upcoming') items = scheduled.filter((b) => daysUntil(b.dueDate.toDate(), now) >= 0);
    if (tab === 'overdue') items = stats.overdue;
    if (tab === 'paid') items = recurringBills.filter((b) => b.status === 'Paid');
    if (selectedDay) {
      const key = format(selectedDay, 'yyyy-MM-dd');
      const ids = new Set((calendar.byDay.get(key) ?? []).map((i) => i.bill.id));
      items = recurringBills.filter((b) => ids.has(b.id));
    }
    if (q) items = items.filter((b) => b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q));
    return items;
  }, [recurringBills, scheduled, stats.overdue, tab, query, now, selectedDay, calendar.byDay]);

  const walletName = (id?: string) => wallets.find((w) => w.id === id)?.name;

  const pay = (bill: RecurringBill) => {
    const next = payRecurringBill(bill);
    toast({
      title: `${bill.name} paid 💳`,
      description: next
        ? `Recorded ${formatMoney(bill.amount)} as an expense. Next due ${format(next, 'MMM d, yyyy')}.`
        : `Recorded ${formatMoney(bill.amount)}. One-time bill marked as paid.`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Recurring Bills</h1>
          <p className="text-sm text-muted-foreground">
            Subscriptions and regular payments. Paying a bill records the expense and moves it to its next due date.
          </p>
        </div>
        <AddRecurringBillDialog
          trigger={
            <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5">
              <Plus className="w-4 h-4" /> Add Bill
            </Button>
          }
        />
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Monthly commitment" value={formatMoney(stats.monthly)} hint={`${scheduled.length} active bill${scheduled.length === 1 ? '' : 's'}`} />
        <StatCard label="Due in the next 7 days" value={formatMoney(stats.weekSum)} hint={`${stats.week.length} bill${stats.week.length === 1 ? '' : 's'}`} tone="text-amber-600" />
        <StatCard label="Overdue" value={formatMoney(stats.overdueSum)} hint={`${stats.overdue.length} bill${stats.overdue.length === 1 ? '' : 's'}`} tone={stats.overdue.length ? 'text-rose-600' : undefined} />
        <StatCard label="Paid this month" value={String(stats.paidThisMonth)} hint={format(now, 'MMMM yyyy')} tone="text-emerald-600 dark:text-emerald-400" />
      </div>

      <div className="grid gap-5 lg:grid-cols-7">
        {/* Bill list */}
        <Card className="lg:col-span-4 rounded-2xl border-border/50">
          <CardHeader className="space-y-3 pb-3">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <Tabs value={tab} onValueChange={(v) => { setTab(v as Tab); setSelectedDay(null); }}>
                <TabsList className="h-auto min-h-8 w-full justify-start overflow-x-auto no-scrollbar sm:w-auto">
                  <TabsTrigger value="upcoming" className="text-xs">Upcoming</TabsTrigger>
                  <TabsTrigger value="overdue" className="text-xs">
                    Overdue{stats.overdue.length > 0 && <span className="ml-1 rounded-full bg-rose-500 text-white px-1.5 text-[10px]">{stats.overdue.length}</span>}
                  </TabsTrigger>
                  <TabsTrigger value="paid" className="text-xs">Paid</TabsTrigger>
                  <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search bills" className="h-8 pl-8 text-xs rounded-xl sm:w-48" aria-label="Search bills" />
              </div>
            </div>
            {selectedDay && (
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="secondary" className="gap-1">
                  Due {format(selectedDay, 'EEE, MMM d')}
                  <button onClick={() => setSelectedDay(null)} aria-label="Clear day filter"><X className="w-3 h-3" /></button>
                </Badge>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {list.length === 0 ? (
              <div className="py-12 text-center space-y-1.5">
                <CalendarClock className="w-8 h-8 mx-auto text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">
                  {recurringBills.length === 0 ? 'No bills yet' : 'Nothing here'}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {recurringBills.length === 0 ? 'Add rent, subscriptions or insurance to get reminders.' : 'Try another tab or clear the search.'}
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {list.map((bill) => {
                  const due = bill.dueDate.toDate();
                  const d = daysUntil(due, now);
                  const isPaid = bill.status === 'Paid';
                  const freq = BILL_FREQUENCIES.find((f) => f.value === (bill.frequency ?? 'monthly'))?.label;
                  return (
                    <li key={bill.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:bg-muted/30 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg flex-shrink-0" aria-hidden>
                        {CATEGORY_ICONS[bill.category] ?? '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-bold truncate">{bill.name}</p>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{freq}</Badge>
                          {bill.isDemo && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Demo</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {bill.category}
                          {walletName(bill.walletId) && ` · ${walletName(bill.walletId)}`}
                          {bill.notes && ` · ${bill.notes}`}
                        </p>
                        <p className={cn('text-[11px] font-semibold', isPaid ? 'text-emerald-600' : d < 0 ? 'text-rose-600' : d <= 3 ? 'text-amber-600' : 'text-muted-foreground')}>
                          {isPaid
                            ? `Paid${bill.lastPaidAt ? ` on ${format(bill.lastPaidAt.toDate(), 'MMM d, yyyy')}` : ''}`
                            : `${format(due, 'EEE, MMM d, yyyy')} · ${describeDue(due, now)}`}
                        </p>
                      </div>
                      <p className="text-sm font-extrabold tabular-nums">{formatMoney(bill.amount)}</p>
                      {!isPaid && (
                        <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs gap-1" onClick={() => pay(bill)}>
                          <Check className="w-3.5 h-3.5" /> Pay
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Actions for ${bill.name}`}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <AddRecurringBillDialog
                            bill={bill}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-xs gap-2">
                                <Pencil className="w-3.5 h-3.5" /> {isPaid ? 'Reschedule' : 'Edit'}
                              </DropdownMenuItem>
                            }
                          />
                          <DropdownMenuSeparator />
                          <ConfirmDialog
                            title={`Delete ${bill.name}?`}
                            description={<p>The bill and its reminders are removed. Payments already recorded stay in your transactions.</p>}
                            onConfirm={() => {
                              deleteRecurringBill(bill.id);
                              toast({ title: 'Bill deleted', description: bill.name });
                            }}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-xs gap-2 text-rose-600 focus:text-rose-600">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </DropdownMenuItem>
                            }
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card className="lg:col-span-3 rounded-2xl border-border/50 h-fit">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{format(month, 'MMMM yyyy')}</CardTitle>
              <div className="flex gap-1">
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setMonth((m) => addMonths(m, -1))} aria-label="Previous month">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setMonth(startOfMonth(new Date()))}>
                  Today
                </Button>
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Next month">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatMoney(calendar.monthTotal)} scheduled this month. Click a day to filter.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-muted-foreground mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendar.days.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                const items = calendar.byDay.get(key) ?? [];
                const isToday = isSameDay(day, now);
                const inMonth = isSameMonth(day, month);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const overdue = items.some((i) => daysUntil(i.date, now) < 0);
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    disabled={items.length === 0}
                    title={items.map((i) => `${i.bill.name} ${formatMoney(i.bill.amount)}`).join('\n') || undefined}
                    className={cn(
                      'aspect-square rounded-lg text-xs flex flex-col items-center justify-center gap-0.5 transition-colors',
                      inMonth ? 'text-foreground' : 'text-muted-foreground/40',
                      items.length > 0 ? 'hover:bg-emerald-500/10 cursor-pointer font-semibold' : 'cursor-default',
                      isToday && 'ring-1 ring-emerald-600',
                      isSelected && 'bg-emerald-600 text-white hover:bg-emerald-600'
                    )}
                  >
                    {format(day, 'd')}
                    {items.length > 0 && (
                      <span className="flex gap-0.5">
                        {items.slice(0, 3).map((i, n) => (
                          <span key={n} className={cn('w-1 h-1 rounded-full', isSelected ? 'bg-white' : overdue ? 'bg-rose-500' : 'bg-emerald-500')} />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: string }) {
  return (
    <Card className="rounded-2xl border-border/50">
      <CardContent className="p-4">
        <p className="text-xs font-bold text-muted-foreground">{label}</p>
        <p className={cn('mt-2 text-xl font-extrabold tracking-tight tabular-nums', tone)}>{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>
      </CardContent>
    </Card>
  );
}
