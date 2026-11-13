
import { useMemo, useState } from 'react';
import Link from '@/components/link';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Filter, MoreHorizontal, Pencil, Receipt, Trash2 } from 'lucide-react';
import { useTransaction } from '@/context/transaction-context';
import { AddTransactionDialog } from '@/components/transactions/add-transaction-dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { CATEGORY_ICONS } from '@/lib/sample-data';
import { formatMoney } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

type Filter = 'all' | 'income' | 'expense';

export function FinloTransactionsTable() {
  const { transactions, wallets, deleteTransaction } = useTransaction();
  const [filter, setFilter] = useState<Filter>('all');

  const walletName = useMemo(() => new Map(wallets.map((w) => [w.id, w.name])), [wallets]);
  const rows = useMemo(
    () => (filter === 'all' ? transactions : transactions.filter((t) => t.type === filter)).slice(0, 6),
    [transactions, filter]
  );

  return (
    <Card className="border border-border/50 bg-card rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <span className="text-base font-bold text-foreground">Recent Transactions</span>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl gap-1.5 border-border/60">
                <span>{filter === 'all' ? 'All' : filter === 'income' ? 'Income' : 'Expenses'}</span>
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={filter} onValueChange={(v) => setFilter(v as Filter)}>
                <DropdownMenuRadioItem value="all" className="text-xs">All</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="income" className="text-xs">Income</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="expense" className="text-xs">Expenses</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild variant="outline" size="sm" className="h-8 text-xs rounded-xl border-border/60">
            <Link href="/transactions">View all</Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {rows.length === 0 ? (
          <div className="py-10 text-center space-y-1.5">
            <Receipt className="w-8 h-8 mx-auto text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No transactions yet</p>
            <p className="text-xs text-muted-foreground/70">Add one from the sidebar, or turn on Demo Mode to explore.</p>
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground">
                  <th className="pb-2.5 font-bold">Activity</th>
                  <th className="pb-2.5 font-bold">Date</th>
                  <th className="pb-2.5 font-bold hidden sm:table-cell">Wallet</th>
                  <th className="pb-2.5 font-bold text-right">Amount</th>
                  <th className="pb-2.5 text-right font-bold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {rows.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm flex-shrink-0" aria-hidden>
                          {CATEGORY_ICONS[t.category] ?? '📦'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate max-w-[220px]">{t.description}</p>
                          <p className="text-[11px] text-muted-foreground">{t.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 text-muted-foreground whitespace-nowrap">{format(t.date.toDate(), 'EEE, MMM d')}</td>
                    <td className="py-2.5 text-muted-foreground hidden sm:table-cell">{(t.walletId && walletName.get(t.walletId)) || '—'}</td>
                    <td className={`py-2.5 text-right font-bold tabular-nums ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                      {t.type === 'income' ? '+' : '−'}
                      {formatMoney(t.amount)}
                    </td>
                    <td className="py-2.5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground" aria-label={`Actions for ${t.description}`}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <AddTransactionDialog
                            transaction={t}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-xs gap-2">
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </DropdownMenuItem>
                            }
                          />
                          <DropdownMenuSeparator />
                          <ConfirmDialog
                            title="Delete this transaction?"
                            description={<p>{t.description}: {formatMoney(t.amount)}. This cannot be undone.</p>}
                            onConfirm={() => {
                              deleteTransaction(t.id);
                              toast({ title: 'Transaction deleted', description: t.description });
                            }}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-xs gap-2 text-rose-600 focus:text-rose-600">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </DropdownMenuItem>
                            }
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
