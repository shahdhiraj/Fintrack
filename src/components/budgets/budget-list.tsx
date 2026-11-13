
import { memo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { cn, formatMoney } from '@/lib/utils';
import { CATEGORY_ICONS } from '@/lib/sample-data';
import type { BudgetStatus, EffectiveLimit } from '@/lib/budgets';
import type { Category } from '@/lib/types';

export type BudgetRow = {
  category: string;
  spent: number;
  status: BudgetStatus;
  pct: number;
} & EffectiveLimit;

const STATUS_STYLE: Record<BudgetStatus, { label: string; badge: string; bar: string }> = {
  over: { label: 'Exceeded', badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', bar: '[&>div]:bg-rose-500' },
  near: { label: 'Near Limit', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', bar: '[&>div]:bg-amber-500' },
  ok: { label: 'On Track', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', bar: '[&>div]:bg-emerald-500' },
};

/** Monthly budget cards. Saving happens on blur/Enter, and only when the value actually changed. */
export function BudgetList({ rows, onSave, editable }: { rows: BudgetRow[]; onSave: (category: string, limit: number) => void; editable: boolean }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-10 text-center">No categories match this filter.</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => (
        <BudgetCard key={row.category} row={row} onSave={onSave} editable={editable} />
      ))}
    </div>
  );
}

const BudgetCard = memo(function BudgetCard({ row, onSave, editable }: { row: BudgetRow; onSave: (category: string, limit: number) => void; editable: boolean }) {
  const [draft, setDraft] = useState(String(row.limit));
  // Follow external changes (another device, month switch) while not being edited.
  useEffect(() => setDraft(String(row.limit)), [row.limit]);

  const style = STATUS_STYLE[row.status];
  const remaining = row.limit - row.spent;

  const commit = () => {
    const value = Math.round(parseFloat(draft) * 100) / 100;
    if (!Number.isFinite(value) || value < 0) {
      setDraft(String(row.limit));
      return;
    }
    if (value !== row.limit || row.source !== 'this-month') onSave(row.category, value);
  };

  return (
    <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <span className="text-lg" aria-hidden>{CATEGORY_ICONS[row.category as Category] ?? '📦'}</span>
          {row.category}
        </CardTitle>
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', style.badge)}>{style.label}</span>
      </CardHeader>
      <CardContent className="space-y-3 pt-1">
        <Progress value={Math.min(row.pct, 100)} className={cn('h-2.5 bg-muted/50', style.bar)} aria-label={`${row.category}: ${Math.round(row.pct)}% of budget used`} />
        <div className="flex justify-between text-xs text-muted-foreground font-medium">
          <span>
            Spent <strong className="text-foreground">{formatMoney(row.spent)}</strong>
          </span>
          <span className="tabular-nums">{Math.round(row.pct)}%</span>
        </div>
        <p className={cn('text-[11px] font-semibold', remaining < 0 ? 'text-rose-600' : 'text-muted-foreground')}>
          {remaining < 0 ? `${formatMoney(-remaining)} over budget` : `${formatMoney(remaining)} left`}
        </p>

        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
          <label htmlFor={`budget-${row.category}`} className="text-xs text-muted-foreground whitespace-nowrap">
            Limit ($)
          </label>
          <Input
            id={`budget-${row.category}`}
            type="number"
            min="0"
            step="10"
            inputMode="decimal"
            value={draft}
            disabled={!editable}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
            className="h-8 text-xs font-semibold rounded-lg"
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          {row.source === 'this-month' ? 'Set for this month' : row.source === 'carried' ? `Carried over from ${row.fromMonth}` : 'Default limit'}
        </p>
      </CardContent>
    </Card>
  );
});
