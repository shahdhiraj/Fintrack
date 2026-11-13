import { useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, Calculator, Camera, CheckCircle2, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { parseBillText } from '@/lib/bill-parse';
import { formatMoney } from '@/lib/currency';
import { readBillText } from '@/lib/ocr';
import { cn } from '@/lib/utils';

export type ScannedBill = { name?: string; amount?: number; dueDate?: Date };

type State = { kind: 'idle' } | { kind: 'busy'; progress: number; stage: 'loading' | 'reading' } | { kind: 'error'; message: string } | { kind: 'done' };

/**
 * Scan a bill photo: read its text on the device, find the amounts, check that they add up,
 * and fill the bill form. The text stays editable, and the figures recalculate as it changes.
 */
export function BillScanner({ onApply }: { onApply: (bill: ScannedBill) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [text, setText] = useState('');
  const [use, setUse] = useState<'printed' | 'calculated'>('printed');
  const parsed = useMemo(() => (text.trim() ? parseBillText(text) : null), [text]);

  const scan = async (file: File | undefined) => {
    if (!file) return;
    setState({ kind: 'busy', progress: 0, stage: 'loading' });
    try {
      const found = await readBillText(file, (progress, stage) => setState({ kind: 'busy', progress, stage }));
      setText(found.trim());
      setUse('printed');
      setState({ kind: 'done' });
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'The bill could not be read.' });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const amount = parsed ? (use === 'calculated' ? parsed.calculatedTotal : parsed.printedTotal) ?? parsed.suggestedAmount : null;

  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-border bg-muted/20 p-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => void scan(e.target.files?.[0])}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Scan a bill</p>
          <p className="text-xs text-muted-foreground">Take or choose a photo, and the amount, dates and name are filled in for you.</p>
        </div>
        {state.kind !== 'busy' && (
          <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5 rounded-xl text-xs" onClick={() => fileRef.current?.click()}>
            {state.kind === 'done' ? <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> : <Camera className="h-3.5 w-3.5" aria-hidden="true" />}
            {state.kind === 'done' ? 'Scan another' : 'Scan photo'}
          </Button>
        )}
      </div>

      {state.kind === 'busy' && (
        <div role="status" aria-live="polite" className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            {state.stage === 'loading' ? 'Getting the text reader ready…' : `Reading the bill… ${Math.round(state.progress * 100)}%`}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full origin-left rounded-full bg-primary transition-transform"
              style={{ transform: `scaleX(${state.stage === 'loading' ? 0.05 : Math.max(0.05, state.progress)})` }}
            />
          </div>
        </div>
      )}

      {state.kind === 'error' && (
        <p role="alert" className="flex items-start gap-2 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      )}

      {state.kind === 'done' && parsed && (
        <div className="space-y-3">
          {/* What was found */}
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <dt className="text-muted-foreground">From</dt>
            <dd className="truncate text-right font-medium">{parsed.merchant ?? 'Not found'}</dd>
            <dt className="text-muted-foreground">Bill date</dt>
            <dd className="text-right font-medium">{parsed.billDate ? format(parsed.billDate, 'MMM d, yyyy') : parsed.bsDateText ? `${parsed.bsDateText} (B.S.)` : 'Not found'}</dd>
            <dt className="text-muted-foreground">Due date</dt>
            <dd className="text-right font-medium">{parsed.dueDate ? format(parsed.dueDate, 'MMM d, yyyy') : 'Not found'}</dd>
          </dl>

          {/* The calculation */}
          <div className="rounded-xl border border-border/60 bg-background p-3 text-xs">
            <p className="mb-2 flex items-center gap-1.5 font-semibold">
              <Calculator className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Calculation
            </p>
            {parsed.items.length > 0 && (
              <ul className="mb-2 max-h-28 space-y-0.5 overflow-y-auto pr-1">
                {parsed.items.map((item, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="truncate text-muted-foreground">{item.label}</span>
                    <span className="shrink-0 tabular-nums">{formatMoney(item.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="space-y-0.5 border-t border-border/60 pt-2">
              {parsed.itemsSum !== null && <Row label={`${parsed.items.length} item${parsed.items.length === 1 ? '' : 's'}`} value={parsed.itemsSum} />}
              {parsed.subtotal !== null && <Row label="Subtotal on bill" value={parsed.subtotal} />}
              {parsed.discount !== null && <Row label="Discount" value={-parsed.discount} />}
              {parsed.charges.map((c, i) => (
                <Row key={i} label={c.label} value={c.amount} plus />
              ))}
              {parsed.calculatedTotal !== null && <Row label="Calculated total" value={parsed.calculatedTotal} strong />}
              {parsed.printedTotal !== null && <Row label="Total on bill" value={parsed.printedTotal} strong />}
            </div>

            {parsed.totalsMatch === true && (
              <p className="mt-2 flex items-center gap-1.5 font-medium text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                The bill adds up.
              </p>
            )}
            {parsed.totalsMatch === false && parsed.calculatedTotal !== null && parsed.printedTotal !== null && (
              <div className="mt-2 space-y-2">
                <p className="flex items-start gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  These differ by {formatMoney(Math.abs(parsed.printedTotal - parsed.calculatedTotal))}. A line may have been misread; check the text below.
                </p>
                <div role="radiogroup" aria-label="Amount to use" className="grid grid-cols-2 gap-2">
                  {(['printed', 'calculated'] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={use === k}
                      onClick={() => setUse(k)}
                      className={cn(
                        'min-h-10 rounded-lg border px-2 text-xs font-semibold transition-colors',
                        use === k ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted',
                      )}
                    >
                      Use {k === 'printed' ? 'bill total' : 'calculated'}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {parsed.suggestedAmount === null && <p className="mt-2 text-muted-foreground">No amounts found. Edit the text below, or type the amount in the form.</p>}
          </div>

          <details className="group text-xs">
            <summary className="flex min-h-9 cursor-pointer items-center font-semibold text-primary">Text found (edit to fix mistakes)</summary>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label="Text read from the bill"
              className="mt-1 min-h-[140px] rounded-xl font-mono text-xs leading-relaxed"
            />
          </details>

          <Button
            type="button"
            className="h-10 w-full rounded-xl text-xs font-bold"
            disabled={amount === null && !parsed.merchant && !parsed.dueDate}
            onClick={() =>
              onApply({
                name: parsed.merchant ?? undefined,
                amount: amount ?? undefined,
                dueDate: parsed.dueDate ?? undefined,
              })
            }
          >
            Fill the form{amount !== null ? ` with ${formatMoney(amount)}` : ''}
          </Button>
        </div>
      )}

      {state.kind !== 'done' && state.kind !== 'busy' && (
        <p className="text-[11px] text-muted-foreground">
          The photo is read on this device and is not uploaded. The first scan downloads the text reader (a few MB).
        </p>
      )}
    </div>
  );
}

function Row({ label, value, strong, plus }: { label: string; value: number; strong?: boolean; plus?: boolean }) {
  return (
    <div className={cn('flex justify-between gap-3', strong && 'font-bold')}>
      <span className={cn('truncate', !strong && 'text-muted-foreground')}>{label}</span>
      <span className="shrink-0 tabular-nums">
        {plus ? '+' : ''}
        {formatMoney(value)}
      </span>
    </div>
  );
}
