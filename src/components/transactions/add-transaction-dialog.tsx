
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { categories, Category, TransactionFormData, type Transaction } from '@/lib/types';
import { useState, type ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTransaction } from '@/context/transaction-context';
import { WalletSelect } from '@/components/wallets/wallet-select';

/** Add a transaction, or edit one when `transaction` is given. `trigger` replaces the default sidebar button. */
export function AddTransactionDialog({
  isCollapsed = false,
  transaction,
  trigger,
}: {
  isCollapsed?: boolean;
  transaction?: Transaction;
  trigger?: ReactNode;
}) {
  const isEdit = Boolean(transaction);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category | undefined>();
  const { toast } = useToast();
  const { addTransaction, updateTransaction, preferences, wallets } = useTransaction();
  const [walletId, setWalletId] = useState<string | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Default to today and the default wallet each time the dialog opens.
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDate(transaction ? transaction.date.toDate() : new Date());
      setWalletId(transaction ? transaction.walletId ?? undefined : preferences.defaultWalletId || undefined);
      setType(transaction?.type ?? 'expense');
      setAmount(transaction ? String(transaction.amount) : '');
      setDescription(transaction?.description ?? '');
      setCategory(transaction?.category);
    }
    setOpen(next);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!date || !(parseFloat(amount) > 0) || !description.trim() || !category) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill out all fields.',
      });
      return;
    }

    const newTransaction: TransactionFormData = {
      date,
      description: description.trim(),
      amount: Math.round(parseFloat(amount) * 100) / 100,
      type,
      category,
      walletId,
    };
    
    if (transaction) updateTransaction(transaction.id, newTransaction);
    else addTransaction(newTransaction);

    toast({
      title: isEdit ? 'Transaction updated' : 'Transaction added',
      description: newTransaction.description,
    });

    // Reset form and close dialog
    setDate(new Date());
    setType('expense');
    setAmount('');
    setDescription('');
    setCategory(undefined);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (isCollapsed ? (
          <Button className="chrome-green chrome-sheen w-10 h-10 text-white font-bold rounded-xl shadow-sm flex items-center justify-center p-0 mx-auto transition-all" title="Add Transaction">
            <Plus className="w-5 h-5" />
          </Button>
        ) : (
          <Button className="chrome-green chrome-sheen w-full text-white font-bold rounded-xl h-10 shadow-sm gap-2 text-xs transition-all">
            <Plus className="w-4 h-4" />
            Add Transaction
          </Button>
        ))}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl border border-border/60 bg-card p-6">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground">{isEdit ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a new income or expense to your records.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-xs">
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label id="tx-type-label" className="font-bold text-muted-foreground sm:text-right">Type</Label>
              <RadioGroup aria-labelledby="tx-type-label"
                value={type} 
                onValueChange={(value: 'income' | 'expense') => setType(value)} 
                className="sm:col-span-3 flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expense" id="r-expense" />
                  <Label htmlFor="r-expense" className="font-semibold">Expense</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="r-income" />
                  <Label htmlFor="r-income" className="font-semibold">Income</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="amount" className="font-bold text-muted-foreground sm:text-right">
                Amount
              </Label>
              <Input id="amount" type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="sm:col-span-3 h-9 text-xs rounded-xl" placeholder="0.00" required />
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="description" className="font-bold text-muted-foreground sm:text-right">
                Description
              </Label>
              <Input id="description" value={description} onChange={e => setDescription(e.target.value)} className="sm:col-span-3 h-9 text-xs rounded-xl" placeholder="e.g. Starbucks, Salary" required />
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="tx-category" className="font-bold text-muted-foreground sm:text-right">Category</Label>
              <Select value={category} onValueChange={(value: Category) => setCategory(value)}>
                <SelectTrigger id="tx-category" className="sm:col-span-3 h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {wallets.length > 0 && (
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-4 sm:items-center sm:gap-4">
                <Label className="font-bold text-muted-foreground sm:text-right">Wallet</Label>
                <WalletSelect value={walletId} onChange={setWalletId} className="sm:col-span-3" />
              </div>
            )}
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label className="font-bold text-muted-foreground sm:text-right">Date</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'sm:col-span-3 justify-start text-left font-normal h-9 text-xs rounded-xl',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      setDate(d);
                      setCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl text-xs font-bold">
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl chrome-green chrome-sheen text-white font-bold text-xs">
              {isEdit ? 'Save Changes' : 'Save Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
