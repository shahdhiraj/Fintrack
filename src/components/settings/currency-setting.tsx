import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCIES, CUSTOM_CODE, DEFAULT_CURRENCY, formatMoney, type CurrencyPref, type Grouping } from '@/lib/currency';

/**
 * Display currency: a list of common currencies (Nepalese rupee "Nrs." by default) or a
 * custom symbol. Only the display changes; amounts are never converted.
 */
export function CurrencySetting({ value, onChange }: { value?: CurrencyPref; onChange: (next: CurrencyPref) => void }) {
  const pref = value ?? DEFAULT_CURRENCY;
  const isCustom = pref.code === CUSTOM_CODE;
  const base = CURRENCIES.find((c) => c.code === pref.code);
  const grouping: Grouping = pref.grouping ?? base?.grouping ?? 'thousand';
  // Type the custom symbol freely; save it once it has settled.
  const [symbol, setSymbol] = useState(pref.symbol ?? '');
  useEffect(() => setSymbol(pref.symbol ?? ''), [pref.symbol]);
  useEffect(() => {
    if (!isCustom || symbol === (pref.symbol ?? '')) return;
    const t = window.setTimeout(() => onChange({ ...pref, symbol: symbol.trim().slice(0, 8) }), 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, isCustom]);

  const choose = (code: string) => {
    if (code === CUSTOM_CODE) onChange({ code, symbol: pref.symbol || 'Rs.', decimals: pref.decimals ?? 2, grouping });
    else onChange({ code });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="currency-code" className="text-xs font-semibold">Currency</Label>
          <Select value={pref.code} onValueChange={choose}>
            <SelectTrigger id="currency-code" className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.symbol} · {c.name}
                </SelectItem>
              ))}
              <SelectItem value={CUSTOM_CODE}>Custom symbol…</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="currency-grouping" className="text-xs font-semibold">Number grouping</Label>
          <Select value={grouping} onValueChange={(g) => onChange({ ...pref, grouping: g as Grouping })}>
            <SelectTrigger id="currency-grouping" className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lakh">1,23,45,678 (lakh, crore)</SelectItem>
              <SelectItem value="thousand">12,345,678 (thousands)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isCustom && (
          <>
            <div className="grid gap-1.5">
              <Label htmlFor="currency-symbol" className="text-xs font-semibold">Symbol</Label>
              <Input
                id="currency-symbol"
                value={symbol}
                maxLength={8}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g. Rs., NPR, रु"
                aria-describedby="currency-symbol-help"
                className="rounded-xl"
              />
              <p id="currency-symbol-help" className="text-xs text-muted-foreground">Up to 8 characters.</p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="currency-decimals" className="text-xs font-semibold">Decimals</Label>
              <Select value={String(pref.decimals ?? 2)} onValueChange={(d) => onChange({ ...pref, decimals: Number(d) })}>
                <SelectTrigger id="currency-decimals" className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None (1,234)</SelectItem>
                  <SelectItem value="2">Two (1,234.50)</SelectItem>
                  <SelectItem value="3">Three (1,234.500)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2.5">
        <span className="text-xs text-muted-foreground">Preview</span>
        <span className="font-bold tabular-nums" aria-live="polite">
          {formatMoney(1234567.5, { currency: isCustom ? { ...pref, symbol: symbol || pref.symbol } : { ...pref, grouping } })}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        This changes how amounts are shown. Saved amounts are not converted between currencies.
      </p>
    </div>
  );
}
