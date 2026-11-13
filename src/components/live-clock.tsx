
import { format } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { useNow } from '@/hooks/use-now';

/** Live date and time for the header; ticks every second. */
export function LiveClock() {
  const now = useNow(1000);
  return (
    <div
      className="hidden xl:flex items-center gap-2 rounded-full border border-border/60 px-3 h-9 text-xs font-semibold text-muted-foreground tabular-nums"
      title={format(now, 'PPPPpp')}
      aria-live="off"
    >
      <CalendarDays className="h-3.5 w-3.5 text-emerald-600" />
      <span className="text-foreground">{format(now, 'EEE, MMM d, yyyy')}</span>
      <span className="text-border">|</span>
      <span>{format(now, 'h:mm:ss a')}</span>
    </div>
  );
}
