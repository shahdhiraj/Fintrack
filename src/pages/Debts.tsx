import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, ChevronDown, HandCoins, MoreHorizontal, Pencil, Plus, Scale, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { DebtDialog, PaymentDialog } from '@/components/debts/debt-dialogs';
import { useTransaction } from '@/context/transaction-context';
import { useTodayKey } from '@/hooks/use-now';
import { debtProgress, debtTotals, type DebtStatus } from '@/lib/debts';
import type { Debt, DebtPayment } from '@/lib/types';
import { cn, formatMoney } from '@/lib/utils';

type Filter = 'active' | 'settled' | 'all';

const STATUS: Record<DebtStatus, { label: string; tone: string }> = {
  settled: { label: 'Settled', tone: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  overdue: { label: 'Overdue', tone: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
  'due-soon': { label: 'Due soon', tone: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  open: { label: 'Open', tone: 'bg-muted text-muted-foreground' },
};

const toLike = (d: Debt) => ({ amount: d.amount, direction: d.direction, dueDate: d.dueDate?.toDate() ?? null });
const paymentsLike = (ps: DebtPayment[]) => ps.map((p) => ({ amount: p.amount, date: p.date.toDate() }));

function DebtCard({ debt, payments, index }: { debt: Debt; payments: DebtPayment[]; index: number }) {
  const reduce = useReducedMotion();
  const { deleteDebt, deleteDebtPayment } = useTransaction();
  const todayKey = useTodayKey();
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const p = useMemo(() => debtProgress(toLike(debt), paymentsLike(payments)), [debt, payments, todayKey]);
  const owe = debt.direction === 'owe';
  const status = STATUS[p.status];

  const dueText =
    p.status === 'settled'
      ? 'Fully repaid'
      : p.daysToDue === null
        ? 'No due date'
        : p.daysToDue < 0
          ? `${Math.abs(p.daysToDue)} day${p.daysToDue === -1 ? '' : 's'} overdue`
          : p.daysToDue === 0
            ? 'Due today'
            : `Due in ${p.daysToDue} day${p.daysToDue === 1 ? '' : 's'} (${format(debt.dueDate!.toDate(), 'MMM d, yyyy')})`;

  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 24, delay: reduce ? 0 : index * 0.04 }}
    >
      <Card className="h-full rounded-2xl border-border/50 transition-shadow hover:shadow-md">
        <CardContent className="flex h-full flex-col gap-4 p-5">
          <div className="flex items-start gap-3">
            <span
              className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', owe ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600')}
              aria-hidden="true"
            >
              {owe ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="truncate font-bold">{debt.name}</h3>
                <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', status.tone)}>{status.label}</span>
                {debt.isDemo && <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">Demo</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">
                {owe ? 'You owe' : 'Owes you'} · since {format(debt.startDate.toDate(), 'MMM d, yyyy')}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full" aria-label={`More for ${debt.name}`}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DebtDialog
                  debt={debt}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                  }
                />
                <ConfirmDialog
                  title={`Delete "${debt.name}"?`}
                  description="This removes it and its payment history, including any transactions those payments added."
                  onConfirm={() => deleteDebt(debt.id)}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-rose-600 focus:text-rose-600">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-extrabold tracking-tight tabular-nums">{formatMoney(p.remaining)}</span>
              <span className="text-xs text-muted-foreground tabular-nums">left of {formatMoney(debt.amount)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p.ratio * 100)} aria-label={`${debt.name} repaid`}>
              <motion.div
                className={cn('h-full origin-left rounded-full', owe ? 'bg-rose-500' : 'bg-primary')}
                initial={reduce ? false : { scaleX: 0 }}
                animate={{ scaleX: p.ratio }}
                transition={{ type: 'spring', stiffness: 90, damping: 20 }}
              />
            </div>
            <p className="flex justify-between text-xs text-muted-foreground tabular-nums">
              <span>{formatMoney(p.paid)} repaid ({Math.round(p.ratio * 100)}%)</span>
              <span className={cn(p.status === 'overdue' && 'font-semibold text-rose-600', p.status === 'due-soon' && 'font-semibold text-amber-600')}>{dueText}</span>
            </p>
          </div>

          {debt.notes && <p className="text-sm text-muted-foreground">{debt.notes}</p>}

          <div className="mt-auto flex flex-wrap items-center gap-2">
            {p.status !== 'settled' && (
              <PaymentDialog
                debt={debt}
                remaining={p.remaining}
                trigger={
                  <Button size="sm" className="h-9 gap-1.5 rounded-xl">
                    <HandCoins className="h-4 w-4" /> {owe ? 'Record repayment' : 'Record payment received'}
                  </Button>
                }
              />
            )}
            {payments.length > 0 && (
              <Button variant="ghost" size="sm" className="h-9 gap-1 rounded-xl text-xs" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
                Payments ({payments.length})
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
              </Button>
            )}
          </div>

          {open && (
            <ul className="divide-y divide-border/60 rounded-xl border border-border/60 text-sm">
              {payments.map((pay) => (
                <li key={pay.id} className="flex items-center gap-3 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    {format(pay.date.toDate(), 'MMM d, yyyy')}
                    {pay.note ? ` · ${pay.note}` : ''}
                    {pay.transactionId ? ' · in transactions' : ''}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">{formatMoney(pay.amount)}</span>
                  <ConfirmDialog
                    title="Remove this payment?"
                    description={pay.transactionId ? 'The matching transaction is removed too.' : 'The remaining balance updates straight away.'}
                    actionLabel="Remove"
                    onConfirm={() => deleteDebtPayment(pay)}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full" aria-label="Remove payment">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </motion.li>
  );
}

function Stat({ label, value, hint, icon: Icon, tone }: { label: string; value: string; hint: string; icon: typeof Scale; tone: string }) {
  return (
    <Card className="min-w-0 rounded-2xl border-border/50">
      <CardContent className="relative p-3.5 sm:p-4">
        <span className={cn('absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg sm:right-4 sm:top-4', tone)} aria-hidden="true">
          <Icon className="h-4 w-4" />
        </span>
        <p className="pr-10 text-xs font-bold text-muted-foreground">{label}</p>
        <p className="mt-2 break-words text-lg font-extrabold tracking-tight tabular-nums sm:text-xl">{value}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

export default function DebtsPage() {
  const { debts, debtPayments } = useTransaction();
  const todayKey = useTodayKey();
  const [filter, setFilter] = useState<Filter>('active');

  const byDebt = useMemo(() => {
    const map = new Map<string, DebtPayment[]>();
    for (const p of debtPayments) map.set(p.debtId, [...(map.get(p.debtId) ?? []), p]);
    return map;
  }, [debtPayments]);
  const paymentsFor = (id: string) => byDebt.get(id) ?? [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const totals = useMemo(() => debtTotals(debts.map((d) => ({ ...toLike(d), id: d.id })), (id) => paymentsLike(paymentsFor(id))), [debts, byDebt, todayKey]);

  const settled = (d: Debt) => debtProgress(toLike(d), paymentsLike(paymentsFor(d.id))).status === 'settled';
  const visible = debts.filter((d) => (filter === 'all' ? true : filter === 'settled' ? settled(d) : !settled(d)));
  const counts = { active: debts.filter((d) => !settled(d)).length, settled: debts.filter(settled).length };

  const addButton = (
    <DebtDialog
      trigger={
        <Button className="h-10 gap-1.5 rounded-xl">
          <Plus className="h-4 w-4" /> Add debt or loan
        </Button>
      }
    />
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Debts &amp; Loans</h1>
          <p className="text-sm text-muted-foreground">Money you owe and money owed to you, with what is left and when it is due.</p>
        </div>
        {debts.length > 0 && addButton}
      </div>

      {debts.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Scale className="h-7 w-7" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-bold">No debts or loans yet</h2>
            <p className="max-w-sm text-sm text-muted-foreground">Add a loan you are paying off, or money you lent a friend. Record each repayment and watch the balance go down.</p>
            {addButton}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="You owe" value={formatMoney(totals.owe)} hint="Still to pay back" icon={ArrowUpRight} tone="bg-rose-500/10 text-rose-600" />
            <Stat label="Owed to you" value={formatMoney(totals.owed)} hint="Still to come back" icon={ArrowDownLeft} tone="bg-emerald-500/10 text-emerald-600" />
            <Stat
              label="Net"
              value={`${totals.net < 0 ? '−' : ''}${formatMoney(Math.abs(totals.net))}`}
              hint={totals.net < 0 ? 'You owe more than you are owed' : 'You are owed more than you owe'}
              icon={Scale}
              tone="bg-sky-500/10 text-sky-600"
            />
            <Stat label="Overdue" value={String(totals.overdue)} hint={totals.overdue ? 'Past their due date' : 'Nothing overdue'} icon={AlertTriangle} tone={totals.overdue ? 'bg-rose-500/10 text-rose-600' : 'bg-muted text-muted-foreground'} />
          </div>

          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)} className="-mx-4 overflow-x-auto px-4 no-scrollbar md:mx-0 md:px-0">
            <TabsList className="h-auto min-h-9 w-max">
              <TabsTrigger value="active" className="text-xs">Active ({counts.active})</TabsTrigger>
              <TabsTrigger value="settled" className="text-xs">Settled ({counts.settled})</TabsTrigger>
              <TabsTrigger value="all" className="text-xs">All ({debts.length})</TabsTrigger>
            </TabsList>
          </Tabs>

          {visible.length === 0 ? (
            <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              {filter === 'settled' ? 'Nothing settled yet.' : 'Everything is settled.'}
            </p>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((d, i) => (
                <DebtCard key={d.id} debt={d} payments={paymentsFor(d.id)} index={i} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
