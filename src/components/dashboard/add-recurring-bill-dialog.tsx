
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn, formatMoney } from '@/lib/utils';
import { format } from 'date-fns';
import {
  BILL_FREQUENCIES,
  categories,
  type BillFrequency,
  type Category,
  type RecurringBill,
  type RecurringBillFormData,
} from '@/lib/types';
import { useState, type ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTransaction } from '@/context/transaction-context';
import { WalletSelect } from '@/components/wallets/wallet-select';

/**
 * Add a recurring bill, or edit one when `bill` is given.
 * Pass `trigger` to replace the default round "+" button.
 */
export function AddRecurringBillDialog({ bill, trigger }: { bill?: RecurringBill; trigger?: ReactNode }) {
  const isEdit = Boolean(bill);
  const [open, setOpen] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Subscriptions');
  const [frequency, setFrequency] = useState<BillFrequency>('monthly');
  const [walletId, setWalletId] = useState<string | undefined>();
  const [notes, setNotes] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { toast } = useToast();
  const { addRecurringBill, updateRecurringBill, preferences } = useTransaction();

  // Fill the form every time the dialog opens, so the default due date is "today" at that moment.
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setName(bill?.name ?? '');
      setAmount(bill ? String(bill.amount) : '');
      setCategory(bill?.category ?? 'Subscriptions');
      setFrequency(bill?.frequency ?? 'monthly');
      setDueDate(bill ? bill.dueDate.toDate() : new Date());
      setWalletId(bill ? bill.walletId ?? undefined : preferences.defaultWalletId || undefined);
      setNotes(bill?.notes ?? '');
    }
    setOpen(next);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!dueDate || !name.trim() || !(parsed > 0)) {
      toast({ variant: 'destructive', title: 'Check the form', description: 'Name, a positive amount and a due date are required.' });
      return;
    }

    const data: RecurringBillFormData = {
      name: name.trim(),
      amount: Math.round(parsed * 100) / 100,
      dueDate,
      category,
      frequency,
      walletId,
      notes: notes.trim(),
    };

    if (bill) {
      updateRecurringBill(bill.id, data);
      toast({ title: 'Bill updated', description: `${data.name} saved.` });
    } else {
      addRecurringBill(data);
      toast({ title: 'Bill scheduled 🗓️', description: `${data.name} for ${formatMoney(data.amount)} due ${format(dueDate, 'MMM d, yyyy')}.` });
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="icon" className="h-7 w-7 rounded-full border-border/60" title="Add bill" aria-label="Add bill">
            <Plus className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px] rounded-2xl border border-border/60 bg-card p-6">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground">{isEdit ? 'Edit Bill' : 'Add Recurring Bill'}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isEdit ? 'Change the details of this bill.' : 'Schedule an upcoming bill or subscription payment.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-xs">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bill-name" className="text-right font-bold text-muted-foreground">Name</Label>
              <Input id="bill-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3 h-9 text-xs rounded-xl" placeholder="e.g. Netflix, Rent" maxLength={80} required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bill-amount" className="text-right font-bold text-muted-foreground">Amount</Label>
              <Input id="bill-amount" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3 h-9 text-xs rounded-xl" placeholder="0.00" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-bold text-muted-foreground">Repeats</Label>
              <Select value={frequency} onValueChange={(v: BillFrequency) => setFrequency(v)}>
                <SelectTrigger className="col-span-3 h-9 text-xs rounded-xl" aria-label="Frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {BILL_FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-bold text-muted-foreground">Category</Label>
              <Select value={category} onValueChange={(value: Category) => setCategory(value)}>
                <SelectTrigger className="col-span-3 h-9 text-xs rounded-xl" aria-label="Category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-bold text-muted-foreground">Pay from</Label>
              <WalletSelect value={walletId} onChange={setWalletId} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-bold text-muted-foreground">{isEdit ? 'Next due' : 'First due'}</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('col-span-3 justify-start text-left font-normal h-9 text-xs rounded-xl', !dueDate && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(d) => {
                      setDueDate(d);
                      setCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="bill-notes" className="text-right font-bold text-muted-foreground pt-2">Notes</Label>
              <Textarea id="bill-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3 text-xs rounded-xl min-h-[60px]" placeholder="Optional — account number, reminder…" maxLength={300} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl text-xs font-bold">Cancel</Button>
            <Button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm">
              {isEdit ? 'Save Changes' : 'Schedule Bill'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
