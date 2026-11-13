import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, MoreHorizontal, Pencil, Plus, PiggyBank, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { useTransaction } from '@/context/transaction-context';
import { useTodayKey } from '@/hooks/use-now';
import { goalProgress, type GoalProgress, type GoalStatus } from '@/lib/goals';
import type { GoalContribution, SavingsGoal } from '@/lib/types';
import { cn, formatMoney } from '@/lib/utils';
import { ContributionDialog, GoalDialog } from './goal-dialogs';

const STATUS: Record<GoalStatus, { label: string; tone: string }> = {
  done: { label: 'Reached', tone: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  'on-track': { label: 'On track', tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  behind: { label: 'Behind', tone: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  overdue: { label: 'Past date', tone: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
  'no-date': { label: 'In progress', tone: 'bg-muted text-muted-foreground' },
  'not-started': { label: 'Not started', tone: 'bg-muted text-muted-foreground' },
};

/** One plain sentence about what to do next for this goal. */
function advice(goal: SavingsGoal, p: GoalProgress) {
  if (p.status === 'done') return `Target reached. ${formatMoney(p.saved)} saved.`;
  if (goal.targetDate && p.daysLeft !== null && p.daysLeft < 0) return `The date has passed with ${formatMoney(p.remaining)} still to go. Pick a new date or keep adding.`;
  if (goal.targetDate && p.monthlyNeeded !== null) {
    const by = format(goal.targetDate.toDate(), 'MMM yyyy');
    const pace = p.monthlyPace !== null ? ` You have been saving about ${formatMoney(p.monthlyPace)} a month.` : '';
    return `Save ${formatMoney(p.monthlyNeeded)} a month to reach it by ${by}.${pace}`;
  }
  if (p.projectedDate) return `At your pace you reach it around ${format(p.projectedDate, 'MMM yyyy')}.`;
  return 'Add money whenever you can; progress shows here.';
}

function GoalCard({ goal, contributions, index }: { goal: SavingsGoal; contributions: GoalContribution[]; index: number }) {
  const reduce = useReducedMotion();
  const { deleteGoal, deleteGoalContribution } = useTransaction();
  const todayKey = useTodayKey();
  const [showHistory, setShowHistory] = useState(false);
  const p = useMemo(
    () => goalProgress({ targetAmount: goal.targetAmount, targetDate: goal.targetDate?.toDate() ?? null }, contributions.map((c) => ({ amount: c.amount, date: c.date.toDate() }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [goal, contributions, todayKey],
  );
  const status = STATUS[p.status];

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
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-xl" aria-hidden="true">{goal.emoji ?? '🎯'}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="truncate font-bold">{goal.name}</h3>
                <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', status.tone)}>{status.label}</span>
                {goal.isDemo && <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">Demo</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">
                {goal.targetDate ? `By ${format(goal.targetDate.toDate(), 'MMM d, yyyy')}` : 'No deadline'}
                {p.daysLeft !== null && p.daysLeft > 0 && ` · ${p.daysLeft} days left`}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full" aria-label={`More for ${goal.name}`}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <GoalDialog
                  goal={goal}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                  }
                />
                <ConfirmDialog
                  title={`Delete "${goal.name}"?`}
                  description="The goal and its saving history are removed. Your wallets and transactions are not affected."
                  onConfirm={() => deleteGoal(goal.id)}
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
              <span className="text-2xl font-extrabold tracking-tight tabular-nums">{formatMoney(p.saved)}</span>
              <span className="text-xs text-muted-foreground tabular-nums">of {formatMoney(goal.targetAmount)}</span>
            </div>
            <div
              className="h-2.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(p.ratio * 100)}
              aria-label={`${goal.name} progress`}
            >
              <motion.div
                className={cn('h-full origin-left rounded-full', p.status === 'behind' || p.status === 'overdue' ? 'bg-amber-500' : 'bg-primary')}
                initial={reduce ? false : { scaleX: 0 }}
                animate={{ scaleX: p.ratio }}
                transition={{ type: 'spring', stiffness: 90, damping: 20 }}
              />
            </div>
            <p className="flex justify-between text-xs text-muted-foreground tabular-nums">
              <span>{Math.round(p.ratio * 100)}%</span>
              <span>{p.remaining > 0 ? `${formatMoney(p.remaining)} to go` : 'Done'}</span>
            </p>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">{advice(goal, p)}</p>

          <div className="mt-auto flex flex-wrap items-center gap-2">
            <ContributionDialog
              goal={goal}
              saved={p.saved}
              trigger={
                <Button size="sm" className="h-9 gap-1.5 rounded-xl">
                  <Plus className="h-4 w-4" /> Add money
                </Button>
              }
            />
            {contributions.length > 0 && (
              <Button variant="ghost" size="sm" className="h-9 gap-1 rounded-xl text-xs" onClick={() => setShowHistory((s) => !s)} aria-expanded={showHistory}>
                History ({contributions.length})
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showHistory && 'rotate-180')} />
              </Button>
            )}
          </div>

          {showHistory && (
            <ul className="divide-y divide-border/60 rounded-xl border border-border/60 text-sm">
              {contributions.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    {format(c.date.toDate(), 'MMM d, yyyy')}
                    {c.note ? ` · ${c.note}` : ''}
                  </span>
                  <span className={cn('shrink-0 font-semibold tabular-nums', c.amount < 0 && 'text-rose-600')}>
                    {c.amount < 0 ? '−' : '+'}
                    {formatMoney(Math.abs(c.amount))}
                  </span>
                  <ConfirmDialog
                    title="Remove this entry?"
                    description="The goal's saved amount updates straight away."
                    actionLabel="Remove"
                    onConfirm={() => deleteGoalContribution(c.id)}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full" aria-label="Remove entry">
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

/** "Savings goals" tab of Budgets & Goals. */
export function GoalsPanel() {
  const { goals, goalContributions } = useTransaction();
  const byGoal = useMemo(() => {
    const map = new Map<string, GoalContribution[]>();
    for (const c of goalContributions) map.set(c.goalId, [...(map.get(c.goalId) ?? []), c]);
    return map;
  }, [goalContributions]);
  const totals = useMemo(() => {
    const saved = goalContributions.reduce((s, c) => s + c.amount, 0);
    const target = goals.reduce((s, g) => s + g.targetAmount, 0);
    return { saved, target, ratio: target > 0 ? Math.min(1, saved / target) : 0 };
  }, [goals, goalContributions]);

  const newGoal = (
    <GoalDialog
      trigger={
        <Button className="h-10 gap-1.5 rounded-xl">
          <Plus className="h-4 w-4" /> New goal
        </Button>
      }
    />
  );

  if (goals.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed">
        <CardContent className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <PiggyBank className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-bold">Save for something specific</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Set a target and a date. FinTrack tells you how much to put aside each month and whether you are on track.
          </p>
          {newGoal}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-border/50">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xs font-bold text-muted-foreground">Saved across {goals.length} goal{goals.length === 1 ? '' : 's'}</p>
            <p className="text-2xl font-extrabold tracking-tight tabular-nums">
              {formatMoney(totals.saved)} <span className="text-sm font-medium text-muted-foreground">of {formatMoney(totals.target)}</span>
            </p>
            <div className="h-2 max-w-md overflow-hidden rounded-full bg-muted">
              <div className="h-full origin-left rounded-full bg-primary transition-transform duration-700" style={{ transform: `scaleX(${totals.ratio})` }} />
            </div>
          </div>
          {newGoal}
        </CardContent>
      </Card>

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {goals.map((g, i) => (
          <GoalCard key={g.id} goal={g} contributions={byGoal.get(g.id) ?? []} index={i} />
        ))}
      </ul>
    </div>
  );
}
