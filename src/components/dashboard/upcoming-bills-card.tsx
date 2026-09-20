'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, CalendarClock } from 'lucide-react';
import { useTransaction } from '@/context/transaction-context';
import { useToast } from '@/hooks/use-toast';
import { AddRecurringBillDialog } from './add-recurring-bill-dialog';
import type { RecurringBill } from '@/lib/types';
import { format } from 'date-fns';

const AVATAR_STYLES = [
  'bg-rose-500/10 text-rose-600 border-rose-500/20',
  'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  'bg-sky-500/10 text-sky-600 border-sky-500/20',
  'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'bg-violet-500/10 text-violet-600 border-violet-500/20',
];

export function UpcomingBillsCard() {
  const { recurringBills, addTransaction, deleteRecurringBill } = useTransaction();
  const { toast } = useToast();

  const handlePay = (bill: RecurringBill) => {
    addTransaction({
      description: bill.name,
      amount: bill.amount,
      type: 'expense',
      category: bill.category,
      date: new Date(),
    });
    deleteRecurringBill(bill.id);

    toast({
      title: 'Bill Paid! 💳',
      description: `Recorded $${bill.amount.toFixed(2)} for ${bill.name}`,
    });
  };

  const visibleBills = recurringBills.slice(0, 4);

  return (
    <Card className="h-full border border-border/50 bg-card rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <span className="text-sm font-bold text-foreground">Upcoming Bill & Payment</span>
        <AddRecurringBillDialog />
      </CardHeader>

      <CardContent className="space-y-3 pt-1 flex-1 flex flex-col justify-between">
        {visibleBills.length > 0 ? (
          <div className="space-y-2.5">
            {visibleBills.map((bill, idx) => (
              <div
                key={bill.id}
                onClick={() => handlePay(bill)}
                className="group flex items-center justify-between p-2.5 rounded-xl border border-border/40 hover:bg-muted/40 transition-all cursor-pointer"
                title="Click to mark as paid"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border ${AVATAR_STYLES[idx % AVATAR_STYLES.length]}`}>
                    {bill.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground group-hover:text-emerald-600 transition-colors">
                      {bill.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(bill.dueDate.toDate(), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="text-right flex items-center gap-2">
                  <div>
                    <p className="text-xs font-extrabold text-foreground">${bill.amount.toFixed(2)}</p>
                    <span className="text-[10px] text-muted-foreground">{bill.status}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-1.5 py-8">
            <CalendarClock className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No upcoming bills</p>
            <p className="text-xs text-muted-foreground/70">Use the + button to schedule a recurring payment.</p>
          </div>
        )}

        {recurringBills.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-xl h-8 mt-2"
          >
            View All
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
