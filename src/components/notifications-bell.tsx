
import Link from '@/components/link';
import { format } from 'date-fns';
import { Bell, AlertTriangle, CalendarClock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTransaction } from '@/context/transaction-context';
import { useNow } from '@/hooks/use-now';
import { daysUntil, describeDue } from '@/lib/finance';
import { cn, formatMoney } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import type { RecurringBill } from '@/lib/types';

/** Header bell: overdue bills and bills due within the reminder window from Settings. */
export function NotificationsBell() {
  const { recurringBills, preferences, payRecurringBill } = useTransaction();
  const now = useNow(60_000);

  const items = recurringBills
    .filter((b) => b.status !== 'Paid')
    .map((b) => ({ bill: b, days: daysUntil(b.dueDate.toDate(), now) }))
    .filter(({ days }) =>
      days < 0 ? preferences.overdueAlerts : preferences.billReminders && days <= preferences.reminderDays
    );
  const overdueCount = items.filter((i) => i.days < 0).length;

  const pay = (bill: RecurringBill) => {
    const next = payRecurringBill(bill);
    toast({
      title: `${bill.name} paid`,
      description: next ? `Recorded ${formatMoney(bill.amount)}. Next due ${format(next, 'MMM d, yyyy')}.` : `Recorded ${formatMoney(bill.amount)}.`,
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full border-border/60 hover:bg-muted/50 relative"
          aria-label={`Notifications${items.length ? ` (${items.length})` : ''}`}
          title="Notifications"
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          {items.length > 0 && (
            <span
              className={cn(
                'absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center',
                overdueCount > 0 ? 'bg-rose-500' : 'bg-emerald-500'
              )}
            >
              {items.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 rounded-2xl">
        <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
          <p className="text-sm font-bold">Notifications</p>
          <Link href="/settings#notifications" className="text-[11px] font-semibold text-emerald-600 hover:underline">
            Preferences
          </Link>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {items.length === 0 ? (
            <div className="py-8 text-center space-y-1.5">
              <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-500/60" />
              <p className="text-sm font-medium">You&apos;re all caught up</p>
              <p className="text-xs text-muted-foreground">
                No bills overdue or due in the next {preferences.reminderDays} day{preferences.reminderDays === 1 ? '' : 's'}.
              </p>
            </div>
          ) : (
            items.map(({ bill, days }) => (
              <div key={bill.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/40">
                <div
                  className={cn(
                    'mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    days < 0 ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'
                  )}
                >
                  {days < 0 ? <AlertTriangle className="w-4 h-4" /> : <CalendarClock className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{bill.name}</p>
                  <p className={cn('text-[11px]', days < 0 ? 'text-rose-600 font-semibold' : 'text-muted-foreground')}>
                    {describeDue(bill.dueDate.toDate(), now)} · {formatMoney(bill.amount)}
                  </p>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg" onClick={() => pay(bill)}>
                  Pay
                </Button>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-border/50 p-2">
          <Button asChild variant="ghost" size="sm" className="w-full text-xs font-semibold">
            <Link href="/recurring">View all bills</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
