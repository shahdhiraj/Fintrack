'use client';

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
import { categories, Category, TransactionFormData } from '@/lib/types';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTransaction } from '@/context/transaction-context';

export function AddTransactionDialog({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category | undefined>();
  const { toast } = useToast();
  const { addTransaction } = useTransaction();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!date || !amount || !description || !category) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill out all fields.',
      });
      return;
    }

    const newTransaction: TransactionFormData = {
      date,
      description,
      amount: parseFloat(amount),
      type,
      category,
    };
    
    addTransaction(newTransaction);

    toast({
      title: 'Success!',
      description: 'New transaction added.',
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isCollapsed ? (
          <Button className="w-10 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center p-0 mx-auto transition-all" title="Add Transaction">
            <Plus className="w-5 h-5" />
          </Button>
        ) : (
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-10 shadow-sm gap-2 text-xs transition-all">
            <Plus className="w-4 h-4" />
            Add Transaction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl border border-border/60 bg-card p-6">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground">Add Transaction</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a new income or expense to your records.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-xs">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-bold text-muted-foreground">Type</Label>
              <RadioGroup 
                value={type} 
                onValueChange={(value: 'income' | 'expense') => setType(value)} 
                className="col-span-3 flex gap-4"
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right font-bold text-muted-foreground">
                Amount
              </Label>
              <Input id="amount" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="col-span-3 h-9 text-xs rounded-xl" placeholder="0.00" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right font-bold text-muted-foreground">
                Description
              </Label>
              <Input id="description" value={description} onChange={e => setDescription(e.target.value)} className="col-span-3 h-9 text-xs rounded-xl" placeholder="e.g. Starbucks, Salary" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-bold text-muted-foreground">Category</Label>
              <Select value={category} onValueChange={(value: Category) => setCategory(value)}>
                <SelectTrigger className="col-span-3 h-9 text-xs rounded-xl">
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-bold text-muted-foreground">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'col-span-3 justify-start text-left font-normal h-9 text-xs rounded-xl',
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
                    onSelect={setDate}
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
            <Button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm">
              Save Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
