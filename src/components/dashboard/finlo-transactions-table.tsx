'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter, MoreHorizontal, CheckCircle2, ArrowUpRight, ArrowDownRight, Smartphone, Laptop, ShoppingBag } from 'lucide-react';
import { useTransaction } from '@/context/transaction-context';

export function FinloTransactionsTable() {
  const { transactions } = useTransaction();

  const displayList = useMemo(() => {
    if (transactions.length > 0) {
      return transactions.slice(0, 5).map((t) => ({
        id: t.id,
        activity: t.description,
        date: t.date.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', weekday: 'short' }),
        amount: `${t.type === 'income' ? '+' : '-'}\$${t.amount.toLocaleString()}`,
        status: 'Success',
        type: t.type,
      }));
    }

    return [
      {
        id: '1',
        activity: 'Mobile App Purchase',
        date: 'Wed 10:29 AM',
        amount: '+$25,500',
        status: 'Success',
        type: 'income',
        icon: Smartphone,
        iconBg: 'bg-sky-500/10 text-sky-600',
      },
      {
        id: '2',
        activity: 'Software License',
        date: 'Wed 10:29 AM',
        amount: '+$25,500',
        status: 'Success',
        type: 'income',
        icon: Laptop,
        iconBg: 'bg-rose-500/10 text-rose-600',
      },
    ];
  }, [transactions]);

  return (
    <Card className="border border-border/50 bg-card rounded-2xl shadow-sm hover:shadow-md transition-all">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <span className="text-base font-bold text-foreground">Recent Transaction</span>
        <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl gap-1.5 border-border/60">
          <span>Filter</span>
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                <th className="pb-2.5 font-bold">Activity</th>
                <th className="pb-2.5 font-bold">Date</th>
                <th className="pb-2.5 font-bold">Total Amount</th>
                <th className="pb-2.5 font-bold">Status</th>
                <th className="pb-2.5 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {displayList.map((row) => (
                <tr key={row.id} className="group hover:bg-muted/30 transition-colors">
                  <td className="py-3 font-semibold text-foreground flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                      {row.type === 'income' ? 'A' : 'S'}
                    </div>
                    <span>{row.activity}</span>
                  </td>
                  <td className="py-3 text-muted-foreground font-medium">{row.date}</td>
                  <td className={`py-3 font-bold ${row.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                    {row.amount}
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> {row.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
