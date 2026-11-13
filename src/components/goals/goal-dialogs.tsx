import { useState, type FormEvent, type ReactNode } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useTransaction } from '@/context/transaction-context';
import { GOAL_EMOJIS, type SavingsGoal } from '@/lib/types';
import { cn, formatMoney } from '@/lib/utils';

const toInputDate = (d: Date) => format(d, 'yyyy-MM-dd');
const fromInputDate = (v: string) => (v ? new Date(`${v}T00:00:00`) : null);

/** Create a goal, or edit one when `goal` is given. */
export function GoalDialog({ goal, trigger }: { goal?: SavingsGoal; trigger: ReactNode }) {
  const { addGoal, updateGoal } = useTransaction();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [date, setDate] = useState('');
  const [emoji, setEmoji] = useState<string>('🎯');
  const [error, setError] = useState('');

  const onOpenChange = (next: boolean) => {
    if (next) {
      setName(goal?.name ?? '');
      setTarget(goal ? String(goal.targetAmount) : '');
      setDate(goal?.targetDate ? toInputDate(goal.targetDate.toDate()) : '');
      setEmoji(goal?.emoji ?? '🎯');
      setError('');
    }
    setOpen(next);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const amount = Math.round(parseFloat(target) * 100) / 100;
    if (!name.trim()) return setError('Give the goal a name.');
    if (!(amount > 0)) return setError('Enter a target amount above zero.');
    const data = { name: name.trim().slice(0, 60), targetAmount: amount, targetDate: fromInputDate(date), emoji };
    if (goal) updateGoal(goal.id, data);
    else addGoal(data);
    toast({ title: goal ? 'Goal updated' : 'Goal created', description: `${data.name}: ${formatMoney(amount)}${data.targetDate ? ` by ${format(data.targetDate, 'MMM d, yyyy')}` : ''}.` });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{goal ? 'Edit goal' : 'New savings goal'}</DialogTitle>
            <DialogDescription>What are you saving for, how much, and by when?</DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5">
            <Label htmlFor="goal-name">Name</Label>
            <Input id="goal-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New laptop" maxLength={60} className="rounded-xl" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="goal-target">Target amount</Label>
              <Input id="goal-target" type="number" inputMode="decimal" min="0.01" step="0.01" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0.00" className="rounded-xl" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="goal-date">Target date (optional)</Label>
              <Input id="goal-date" type="date" value={date} min={toInputDate(new Date())} onChange={(e) => setDate(e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <fieldset className="grid gap-1.5">
            <legend className="mb-1.5 text-sm font-medium">Icon</legend>
            <div className="flex flex-wrap gap-1.5">
              {GOAL_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  aria-pressed={emoji === e}
                  aria-label={`Icon ${e}`}
                  className={cn('flex h-10 w-10 items-center justify-center rounded-xl border text-lg transition-colors', emoji === e ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted')}
                >
                  {e}
                </button>
              ))}
            </div>
          </fieldset>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="rounded-xl">{goal ? 'Save changes' : 'Create goal'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Put money towards a goal, or take some out. */
export function ContributionDialog({ goal, saved, trigger }: { goal: SavingsGoal; saved: number; trigger: ReactNode }) {
  const { addGoalContribution } = useTransaction();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'add' | 'withdraw'>('add');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(toInputDate(new Date()));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const onOpenChange = (next: boolean) => {
    if (next) {
      setMode('add');
      setAmount('');
      setDate(toInputDate(new Date()));
      setNote('');
      setError('');
    }
    setOpen(next);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = Math.round(parseFloat(amount) * 100) / 100;
    if (!(value > 0)) return setError('Enter an amount above zero.');
    if (mode === 'withdraw' && value > saved) return setError(`You can take out at most ${formatMoney(saved)}.`);
    addGoalContribution(goal.id, mode === 'add' ? value : -value, fromInputDate(date) ?? new Date(), note.trim().slice(0, 120));
    toast({ title: mode === 'add' ? 'Added to goal' : 'Taken from goal', description: `${formatMoney(value)} ${mode === 'add' ? 'towards' : 'from'} ${goal.name}.` });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>
              {goal.emoji} {goal.name}
            </DialogTitle>
            <DialogDescription>Saved so far: {formatMoney(saved)}. This tracks the goal; it does not move money between wallets.</DialogDescription>
          </DialogHeader>
          <div role="radiogroup" aria-label="Add or take out" className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
            {(['add', 'withdraw'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => setMode(m)}
                className={cn('min-h-10 rounded-lg text-sm font-semibold transition-colors', mode === m ? 'bg-background shadow-sm' : 'text-muted-foreground')}
              >
                {m === 'add' ? 'Add money' : 'Take out'}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="contrib-amount">Amount</Label>
              <Input id="contrib-amount" type="number" inputMode="decimal" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="rounded-xl" autoFocus />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="contrib-date">Date</Label>
              <Input id="contrib-date" type="date" value={date} max={toInputDate(new Date())} onChange={(e) => setDate(e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="contrib-note">Note (optional)</Label>
            <Input id="contrib-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} placeholder="e.g. Bonus" className="rounded-xl" />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="rounded-xl">{mode === 'add' ? 'Add to goal' : 'Take from goal'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
