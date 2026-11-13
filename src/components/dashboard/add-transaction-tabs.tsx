
import React, { useState, useEffect } from 'react';
import { CategoryWheel, softHyphenate } from './category-wheel';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Category, TransactionFormData } from '@/lib/types';
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
  DollarSign,
  Briefcase,
  Laptop,
  TrendingUp,
  Building,
  Gift,
  CreditCard,
  Plane,
  Utensils,
} from 'lucide-react';
import { useTransaction } from '@/context/transaction-context';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/utils';

const expenseCategories: Category[] = [
  'Groceries',
  'Housing',
  'Transport',
  'Entertainment',
  'Health',
  'Shopping',
  'Utilities',
  'Dining Out',
  'Subscriptions',
  'Travel',
  'Other',
];

const incomeCategories: Category[] = [
  'Salary',
  'Freelance',
  'Investments',
  'Business',
  'Gifts',
  'Other',
];

const categoryIcons: Record<string, React.ElementType> = {
  Groceries: PieChart,
  Housing: Home,
  Transport: Car,
  Entertainment: Clapperboard,
  Health: HeartPulse,
  Shopping: ShoppingBag,
  Utilities: Zap,
  Salary: Briefcase,
  Freelance: Laptop,
  Investments: TrendingUp,
  Business: Building,
  Gifts: Gift,
  Subscriptions: CreditCard,
  Travel: Plane,
  'Dining Out': Utensils,
  Other: MoreHorizontal,
};

export function AddTransactionTabs() {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [mounted, setMounted] = useState(false);

  const { toast } = useToast();
  const { addTransaction } = useTransaction();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentCategories = activeTab === 'expense' ? expenseCategories : incomeCategories;

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    setAmount('');
    setDescription('');
  };

  const handleAddTransaction = () => {
    if (!selectedCategory) return;
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter an amount greater than zero.',
      });
      return;
    }

    const newTransaction: TransactionFormData = {
      category: selectedCategory,
      amount: parsedAmount,
      date: new Date(),
      type: activeTab,
      description: description.trim() || `${activeTab === 'income' ? 'Income' : 'Expense'} for ${selectedCategory}`,
    };

    addTransaction(newTransaction);

    toast({
      title: `${activeTab === 'income' ? 'Income' : 'Expense'} Added!`,
      description: `${formatMoney(parsedAmount)} for ${selectedCategory}.`,
    });

    setAmount('');
    setDescription('');
    setSelectedCategory(null);
  };

  const radius = 115; // circle radius

  if (!mounted) {
    return (
      <Card className="h-full border border-border/50 bg-card rounded-2xl shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-1" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="flex justify-center p-8">
          <Skeleton className="w-72 h-72 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const autoDetectCategory = (text: string): Category | null => {
    const lower = text.toLowerCase().trim();
    if (!lower) return null;

    if (/(coffee|starbucks|grocery|groceries|walmart|target|whole foods|food|supermarket|bistro|market|bakery)/i.test(lower)) {
      return 'Groceries';
    }
    if (/(rent|apartment|mortgage|housing|lease|landlord|home)/i.test(lower)) {
      return 'Housing';
    }
    if (/(uber|lyft|gas|shell|subway|bus|transit|car|parking|fuel|cab|taxi)/i.test(lower)) {
      return 'Transport';
    }
    if (/(netflix|spotify|movie|cinema|hulu|game|steam|entertainment|ticket)/i.test(lower)) {
      return 'Entertainment';
    }
    if (/(doctor|hospital|gym|fitness|pharmacy|health|vitamin|clinic|dental|medical)/i.test(lower)) {
      return 'Health';
    }
    if (/(nike|amazon|clothes|apparel|shoes|shopping|store|mall|fashion)/i.test(lower)) {
      return 'Shopping';
    }
    if (/(electric|internet|water|utility|power|fiber|wifi|bill|phone)/i.test(lower)) {
      return 'Utilities';
    }
    if (/(salary|payroll|paycheck|freelance|client|stipend|bonus|income|payout)/i.test(lower)) {
      return /freelance|client/i.test(lower) ? 'Freelance' : 'Salary';
    }
    if (/(dividend|stock|interest|crypto|invest)/i.test(lower)) {
      return 'Investments';
    }
    return null;
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDescription(val);
    const detected = autoDetectCategory(val);
    if (detected && detected !== selectedCategory && currentCategories.includes(detected)) {
      setSelectedCategory(detected);
    }
  };

  return (
    <Card className="h-full border border-border/50 bg-card rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-extrabold tracking-tight">
          <span className="text-heading-gradient">Add Transaction</span>
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Quickly add a new expense or income.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-1 flex-1 flex flex-col justify-between">
        {/* Tabs for Expense vs Income */}
        <Tabs defaultValue="expense" value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-full h-11 border border-slate-200/50 dark:border-slate-700/50">
            <TabsTrigger
              value="expense"
              className="text-xs font-bold rounded-full h-9 text-slate-500 dark:text-slate-400 transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              Expense
            </TabsTrigger>
            <TabsTrigger
              value="income"
              className="text-xs font-bold rounded-full h-9 text-slate-500 dark:text-slate-400 transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              Income
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Phones: a grid of category buttons. The wheel needs more room than a phone has. */}
        <div className="space-y-3 py-4 sm:hidden lg:block xl:hidden">
          <button
            type="button"
            onClick={() => handleCategoryClick('Other')}
            className="flex min-h-12 w-full items-center justify-center gap-2 chrome-green chrome-sheen rounded-2xl text-sm font-bold text-white active:scale-[0.98]"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            Add {activeTab === 'income' ? 'income' : 'an expense'}
          </button>
          <ul className="grid grid-cols-3 gap-2 min-[400px]:grid-cols-4" aria-label="Choose a category">
            {currentCategories.map((category) => {
              const Icon = categoryIcons[category] || MoreHorizontal;
              return (
                <li key={category} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => handleCategoryClick(category)}
                    className="flex min-h-[4.5rem] w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-border/60 bg-card px-1 transition-colors hover:border-emerald-600 active:scale-95"
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    <span className="w-full text-center text-xs font-semibold leading-tight break-words">{softHyphenate(category)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Circular wheel (640-1023px, where the card is full width, and 1280px up).
            Positions are percentages of the square, so spacing grows with it and labels never
            reach the next item; long names wrap with a hyphen. */}
        <div className="hidden flex-1 items-center justify-center py-6 sm:flex lg:hidden xl:flex">
          <CategoryWheel categories={currentCategories} icons={categoryIcons} onPick={handleCategoryClick} onAdd={() => handleCategoryClick('Other')} />
        </div>
      </CardContent>

      {/* Pop-up Modal Dialog for Inputting Amount */}
      <Dialog open={!!selectedCategory} onOpenChange={() => setSelectedCategory(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl border border-border/60 bg-card p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground flex items-center justify-between">
              <span>Add {activeTab === 'income' ? 'Income' : 'Expense'} to {selectedCategory}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div>
              <Label htmlFor="amount" className="text-xs font-bold text-muted-foreground">
                Amount
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTransaction()}
                  autoFocus
                  className="h-11 text-sm font-semibold rounded-xl border-emerald-600/70 focus-visible:ring-emerald-600/30"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="desc" className="text-xs font-bold text-muted-foreground">
                  Note / Description (Optional)
                </Label>
                {description.trim() && currentCategories.includes(autoDetectCategory(description) as Category) && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    ✨ Auto-Detected Category
                  </span>
                )}
              </div>
              <Input
                id="desc"
                type="text"
                value={description}
                onChange={handleDescriptionChange}
                placeholder="e.g. Starbucks coffee, Walmart groceries, Uber ride"
                onKeyDown={(e) => e.key === 'Enter' && handleAddTransaction()}
                className="h-10 text-xs rounded-xl mt-1.5"
              />
            </div>

            {/* Quick Category Switcher in Modal */}
            <div>
              <Label className="text-[11px] font-bold text-muted-foreground block mb-1.5">
                Change Category:
              </Label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {currentCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-muted/30 border-border/60 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedCategory(null)}
              className="rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddTransaction}
              className="rounded-xl chrome-green chrome-sheen text-white text-xs font-bold"
            >
              Add {activeTab === 'income' ? 'Income' : 'Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
