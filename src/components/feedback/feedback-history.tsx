
import { formatDistanceToNow, format } from 'date-fns';
import { Inbox, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTransaction } from '@/context/transaction-context';
import { useNow } from '@/hooks/use-now';
import type { FeedbackType } from '@/lib/types';
import { FEEDBACK_TYPES } from './feedback-form';

export function FeedbackHistory({ only }: { only?: FeedbackType[] }) {
  const { feedback } = useTransaction();
  useNow(60_000); // keep "x minutes ago" fresh
  const items = only ? feedback.filter((f) => only.includes(f.type)) : feedback;

  if (items.length === 0) {
    return (
      <div className="py-8 text-center space-y-1.5">
        <Inbox className="w-7 h-7 mx-auto text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Nothing sent yet.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/50">
      {items.map((f) => {
        const type = FEEDBACK_TYPES.find((t) => t.value === f.type);
        const created = f.createdAt?.toDate?.();
        return (
          <li key={f.id} className="py-3 flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              {type && <type.icon className="w-4 h-4 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold truncate">{f.subject}</p>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{type?.label ?? f.type}</Badge>
                <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 border-0">{f.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{f.message}</p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                {created ? <span title={format(created, 'PPpp')}>{formatDistanceToNow(created, { addSuffix: true })}</span> : <span>Sending…</span>}
                {f.rating ? (
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: f.rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </span>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
