'use client';

import { useState } from 'react';
import type { Transaction } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTransaction } from '@/context/transaction-context';
import { Skeleton } from '@/components/ui/skeleton';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '@/lib/sample-data';
import { Trash2, Search, ArrowUpRight, ArrowDownRight, Sparkles, ReceiptText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function RecentTransactions() {
  const { transactions, deleteTransaction, loadDemoData, loading } = useTransaction();
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const filteredTransactions = transactions
    .filter(
      (t) =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 6);

  const handleDelete = (id: string, description: string) => {
    deleteTransaction(id);
    toast({
      title: 'Transaction Removed',
      description: `Deleted "${description}"`,
    });
  };

  const formatCurrency = (amount: number, type: 'income' | 'expense') => {
    const sign = type === 'income' ? '+' : '-';
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
    return `${sign}${formatted}`;
  };

  return (
    <Card className="h-full border border-border/50 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-emerald-500" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-xs">
              Showing latest financial activity
            </CardDescription>
          </div>
        </div>

        {transactions.length > 0 && (
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search activity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs bg-muted/30 border-border/40 focus-visible:ring-emerald-500/20"
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-center pt-0">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-xl" />
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-[140px]" />
                    <Skeleton className="h-3 w-[80px]" />
                  </div>
                </div>
                <Skeleton className="h-4 w-[60px]" />
              </div>
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-border/60 rounded-xl bg-muted/20 my-auto">
            <ReceiptText className="w-8 h-8 text-muted-foreground/60 mb-2" />
            <p className="text-xs text-muted-foreground mb-3">No transactions found</p>
            {transactions.length === 0 && (
              <Button
                onClick={loadDemoData}
                size="sm"
                variant="outline"
                className="text-xs gap-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Populate Demo Data
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((transaction) => {
              const icon = CATEGORY_ICONS[transaction.category] || '💸';
              const style = CATEGORY_COLORS[transaction.category] || {
                bg: 'bg-muted',
                text: 'text-foreground',
                border: 'border-border',
              };

              return (
                <div
                  key={transaction.id}
                  className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border/40 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold border ${style.bg} ${style.border}`}
                    >
                      {icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {transaction.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">
                          {transaction.date.toDate().toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 font-medium rounded-md border ${style.bg} ${style.text} ${style.border}`}>
                          {transaction.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-2 shrink-0">
                    <span
                      className={`text-xs font-bold flex items-center gap-0.5 ${
                        transaction.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-foreground'
                      }`}
                    >
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 inline" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 text-rose-500 inline" />
                      )}
                      {formatCurrency(transaction.amount, transaction.type)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(transaction.id, transaction.description)}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
