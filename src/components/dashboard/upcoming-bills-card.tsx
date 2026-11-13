
import Link from '@/components/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarClock, Check } from 'lucide-react';
import { useTransaction } from '@/context/transaction-context';
import { useToast } from '@/hooks/use-toast';
import { useNow } from '@/hooks/use-now';
import { AddRecurringBillDialog } from './add-recurring-bill-dialog';
import type { RecurringBill } from '@/lib/types';
import { describeDue, dueState } from '@/lib/finance';
import { cn, formatMoney } from '@/lib/utils';
import { format } from 'date-fns';

const AVATAR_STYLES = [
  'bg-rose-500/10 text-rose-600 border-rose-500/20',
  'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  'bg-sky-500/10 text-sky-600 border-sky-500/20',
  'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'bg-violet-500/10 text-violet-600 border-violet-500/20',
];

export function UpcomingBillsCard() {
  const { recurringBills, payRecurringBill } = useTransaction();
  const { toast } = useToast();
  const now = useNow(60_000);

  const scheduled = recurringBills.filter((b) => b.status !== 'Paid');
  const visibleBills = scheduled.slice(0, 4);

  const handlePay = (bill: RecurringBill) => {
    const next = payRecurringBill(bill);
    toast({
      title: 'Bill paid 💳',
      description: next
        ? `Recorded ${formatMoney(bill.amount)} for ${bill.name}. Next due ${format(next, 'MMM d, yyyy')}.`
        : `Recorded ${formatMoney(bill.amount)} for ${bill.name}.`,
    });
  };

  return (
    <Card className="h-full border border-border/50 bg-card rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <span className="text-sm font-bold text-foreground">Upcoming Bill & Payment</span>
        <AddRecurringBillDialog />
      </CardHeader>

      <CardContent className="space-y-3 pt-1 flex-1 flex flex-col justify-between">
        {visibleBills.length > 0 ? (
          <div className="space-y-2.5">
            {visibleBills.map((bill, idx) => {
              const due = bill.dueDate.toDate();
              const state = dueState(due, now, 3);
              return (
                <div key={bill.id} className="group flex items-center justify-between p-2.5 rounded-xl border border-border/40 hover:bg-muted/40 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border flex-shrink-0 ${AVATAR_STYLES[idx % AVATAR_STYLES.length]}`}>
                      {bill.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{bill.name}</p>
                      <p
                        className={cn(
                          'text-[11px]',
                          state === 'overdue' ? 'text-rose-600 font-semibold' : state === 'today' || state === 'soon' ? 'text-amber-600' : 'text-muted-foreground'
                        )}
                      >
                        {format(due, 'MMM d, yyyy')} · {describeDue(due, now)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className="text-xs font-extrabold text-foreground">{formatMoney(bill.amount)}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px] rounded-lg gap-1"
                      onClick={() => handlePay(bill)}
                      title="Mark as paid and record the expense"
                    >
                      <Check className="w-3 h-3" /> Pay
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-1.5 py-8">
            <CalendarClock className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No upcoming bills</p>
            <p className="text-xs text-muted-foreground/70">Use the + button to schedule a recurring payment.</p>
          </div>
        )}

        <Button
          asChild
          variant="secondary"
          size="sm"
          className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-xl h-8 mt-2"
        >
          <Link href="/recurring">{scheduled.length > visibleBills.length ? `View all ${scheduled.length} bills` : 'Manage bills'}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
