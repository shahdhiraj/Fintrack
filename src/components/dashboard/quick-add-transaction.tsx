'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { categories, Category, TransactionFormData } from '@/lib/types';
import {
  PieChart,
  Home,
  Car,
  Clapperboard,
  HeartPulse,
  ShoppingBag,
  Zap,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { useTransaction } from '@/context/transaction-context';
import { Skeleton } from '../ui/skeleton';

const categoryIcons: { [key in Category]?: React.ElementType } = {
  Groceries: PieChart,
  Housing: Home,
  Transport: Car,
  Entertainment: Clapperboard,
  Health: HeartPulse,
  Shopping: ShoppingBag,
  Utilities: Zap,
  Other: MoreHorizontal,
};

const expenseCategories = categories.filter(c => c !== 'Salary');

export function QuickAddTransaction() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [amount, setAmount] = useState('');
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const { addTransaction } = useTransaction();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
  };

  const handleAddExpense = () => {
    if (!selectedCategory || !amount) return;

    const newTransaction: TransactionFormData = {
      category: selectedCategory,
      amount: parseFloat(amount),
      date: new Date(),
      type: 'expense' as const,
      description: `Expense for ${selectedCategory}`,
    };

    addTransaction(newTransaction);

    toast({
      title: 'Expense Added',
      description: `$${amount} spent on ${selectedCategory}.`,
    });

    // Reset state and close dialog
    setAmount('');
    setSelectedCategory(null);
  };

  const angleStep = 360 / expenseCategories.length;
  const radius = 120; // radius of the circle

  if (!mounted) {
      return (
          <div className="flex flex-col items-center justify-center space-y-8 p-4 border rounded-lg h-full min-h-[450px]">
              <h2 className="text-xl font-bold tracking-tight text-center">Add Expense</h2>
              <Skeleton className="w-80 h-80 rounded-full" />
          </div>
      )
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-8 p-4 border rounded-lg h-full min-h-[450px]">
       <h2 className="text-xl font-bold tracking-tight text-center">Add Expense</h2>
      <div
        className="relative w-80 h-80 flex items-center justify-center"
      >
        <div className="absolute w-32 h-32 bg-primary rounded-full flex items-center justify-center shadow-lg">
          <Plus className="h-12 w-12 text-primary-foreground" />
        </div>
        {expenseCategories.map((category, index) => {
          const angle = angleStep * index - 90; // -90 to start from top
          const x = radius * Math.cos((angle * Math.PI) / 180);
          const y = radius * Math.sin((angle * Math.PI) / 180);
          const Icon = categoryIcons[category] || MoreHorizontal;
          return (
            <div
              key={category}
              className="absolute flex flex-col items-center"
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
            >
              <Button
                variant="outline"
                size="icon"
                className="w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-110"
                onClick={() => handleCategoryClick(category)}
              >
                <Icon className="h-6 w-6" />
              </Button>
              <p className="text-xs mt-2 font-medium">{category}</p>
            </div>
          );
        })}
      </div>

      <Dialog
        open={!!selectedCategory}
        onOpenChange={() => setSelectedCategory(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense to {selectedCategory}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="col-span-3"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setSelectedCategory(null)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleAddExpense}>Add Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
