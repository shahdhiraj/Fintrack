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
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { categories, Category, RecurringBillFormData } from '@/lib/types';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTransaction } from '@/context/transaction-context';

export function AddRecurringBillDialog() {
  const [open, setOpen] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category | undefined>('Subscriptions');
  const { toast } = useToast();
  const { addRecurringBill } = useTransaction();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dueDate || !amount || !name || !category) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill out all fields.',
      });
      return;
    }

    const bill: RecurringBillFormData = {
      name,
      amount: parseFloat(amount),
      dueDate,
      category,
    };

    addRecurringBill(bill);

    toast({
      title: 'Bill Scheduled 🗓️',
      description: `${name} for $${parseFloat(amount).toFixed(2)} added.`,
    });

    setDueDate(new Date());
    setAmount('');
    setName('');
    setCategory('Subscriptions');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-7 w-7 rounded-full border-border/60" title="Add bill">
          <Plus className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl border border-border/60 bg-card p-6">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground">Add Recurring Bill</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Schedule an upcoming bill or subscription payment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-xs">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bill-name" className="text-right font-bold text-muted-foreground">
                Name
              </Label>
              <Input id="bill-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3 h-9 text-xs rounded-xl" placeholder="e.g. Netflix, Rent" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bill-amount" className="text-right font-bold text-muted-foreground">
                Amount
              </Label>
              <Input id="bill-amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3 h-9 text-xs rounded-xl" placeholder="0.00" required />
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
              <Label className="text-right font-bold text-muted-foreground">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'col-span-3 justify-start text-left font-normal h-9 text-xs rounded-xl',
                      !dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl">
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl text-xs font-bold">
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm">
              Schedule Bill
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
