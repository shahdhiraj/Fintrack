import { useState, type FormEvent, type ReactNode } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { WalletSelect } from '@/components/wallets/wallet-select';
import { useToast } from '@/hooks/use-toast';
import { useTransaction } from '@/context/transaction-context';
import type { Debt, DebtDirection } from '@/lib/types';
import { cn, formatMoney } from '@/lib/utils';

const toInputDate = (d: Date) => format(d, 'yyyy-MM-dd');
const fromInputDate = (v: string) => (v ? new Date(`${v}T00:00:00`) : null);

const DIRECTIONS: { value: DebtDirection; label: string; hint: string }[] = [
  { value: 'owe', label: 'I owe', hint: 'A loan or money you borrowed' },
  { value: 'lent', label: 'Owed to me', hint: 'Money you lent someone' },
];

/** Add a debt or loan, or edit one when `debt` is given. */
export function DebtDialog({ debt, trigger }: { debt?: Debt; trigger: ReactNode }) {
  const { addDebt, updateDebt } = useTransaction();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<DebtDirection>('owe');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [start, setStart] = useState(toInputDate(new Date()));
  const [due, setDue] = useState('');
  const [walletId, setWalletId] = useState<string | undefined>();
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const onOpenChange = (next: boolean) => {
    if (next) {
      setDirection(debt?.direction ?? 'owe');
      setName(debt?.name ?? '');
      setAmount(debt ? String(debt.amount) : '');
      setStart(toInputDate(debt ? debt.startDate.toDate() : new Date()));
      setDue(debt?.dueDate ? toInputDate(debt.dueDate.toDate()) : '');
      setWalletId(debt?.walletId ?? undefined);
      setNotes(debt?.notes ?? '');
      setError('');
    }
    setOpen(next);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = Math.round(parseFloat(amount) * 100) / 100;
    if (!name.trim()) return setError(direction === 'owe' ? 'Who do you owe? (e.g. Bank loan, Ram)' : 'Who owes you?');
    if (!(value > 0)) return setError('Enter an amount above zero.');
    const startDate = fromInputDate(start) ?? new Date();
    const dueDate = fromInputDate(due);
    if (dueDate && dueDate < startDate) return setError('The due date is before the start date.');
    const data = { name: name.trim().slice(0, 60), direction, amount: value, startDate, dueDate, walletId: walletId ?? null, notes: notes.trim().slice(0, 300) };
    if (debt) updateDebt(debt.id, data);
    else addDebt(data);
    toast({ title: debt ? 'Saved' : direction === 'owe' ? 'Debt added' : 'Loan added', description: `${data.name}: ${formatMoney(value)}.` });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{debt ? 'Edit' : 'Add a debt or loan'}</DialogTitle>
            <DialogDescription>Keep track of what you owe and what you are owed.</DialogDescription>
          </DialogHeader>

          <div role="radiogroup" aria-label="Type" className="grid grid-cols-2 gap-2">
            {DIRECTIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                role="radio"
                aria-checked={direction === d.value}
                onClick={() => setDirection(d.value)}
                className={cn(
                  'rounded-xl border p-3 text-left transition-colors',
                  direction === d.value ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted',
                )}
              >
                <span className="block text-sm font-semibold">{d.label}</span>
                <span className="block text-xs text-muted-foreground">{d.hint}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="debt-name">{direction === 'owe' ? 'Owed to' : 'Owed by'}</Label>
              <Input id="debt-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder={direction === 'owe' ? 'e.g. Bank loan' : 'e.g. Sita'} className="rounded-xl" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="debt-amount">Amount</Label>
              <Input id="debt-amount" type="number" inputMode="decimal" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="rounded-xl" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="debt-start">Start date</Label>
              <Input id="debt-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-xl" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="debt-due">Due date (optional)</Label>
              <Input id="debt-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Wallet for repayments (optional)</Label>
            <WalletSelect value={walletId} onChange={setWalletId} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="debt-notes">Notes (optional)</Label>
            <Textarea id="debt-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} placeholder="e.g. Monthly instalments, interest" className="min-h-[60px] rounded-xl" />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="rounded-xl">{debt ? 'Save changes' : 'Add'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Record a repayment (paid back, or received). */
export function PaymentDialog({ debt, remaining, trigger }: { debt: Debt; remaining: number; trigger: ReactNode }) {
  const { addDebtPayment, wallets } = useTransaction();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(toInputDate(new Date()));
  const [note, setNote] = useState('');
  const [asTransaction, setAsTransaction] = useState(false);
  const [error, setError] = useState('');
  const owe = debt.direction === 'owe';
  const walletName = wallets.find((w) => w.id === debt.walletId)?.name;

  const onOpenChange = (next: boolean) => {
    if (next) {
      setAmount(remaining > 0 ? String(remaining) : '');
      setDate(toInputDate(new Date()));
      setNote('');
      setAsTransaction(false);
      setError('');
    }
    setOpen(next);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = Math.round(parseFloat(amount) * 100) / 100;
    if (!(value > 0)) return setError('Enter an amount above zero.');
    if (value > remaining + 0.001) return setError(`Only ${formatMoney(remaining)} is left on this ${owe ? 'debt' : 'loan'}.`);
    addDebtPayment(debt, value, fromInputDate(date) ?? new Date(), note.trim().slice(0, 120), asTransaction);
    const settled = Math.abs(value - remaining) < 0.005;
    toast({ title: settled ? 'Settled' : 'Payment recorded', description: `${formatMoney(value)} ${owe ? 'paid to' : 'received from'} ${debt.name}.` });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{owe ? `Pay back ${debt.name}` : `Payment from ${debt.name}`}</DialogTitle>
            <DialogDescription>{formatMoney(remaining)} left.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="pay-amount">Amount</Label>
              <Input id="pay-amount" type="number" inputMode="decimal" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded-xl" autoFocus />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pay-date">Date</Label>
              <Input id="pay-date" type="date" value={date} max={toInputDate(new Date())} onChange={(e) => setDate(e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="pay-note">Note (optional)</Label>
            <Input id="pay-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} className="rounded-xl" />
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3">
            <Checkbox checked={asTransaction} onCheckedChange={(v) => setAsTransaction(v === true)} className="mt-0.5" />
            <span className="text-sm">
              <span className="block font-medium">Also add to transactions</span>
              <span className="block text-xs text-muted-foreground">
                Records it as {owe ? 'an expense' : 'income'} in "Other"{walletName ? ` from ${walletName}` : ''}, so wallet balances include it. Leave off to keep loan repayments out of your spending.
              </span>
            </span>
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="rounded-xl">Record payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
