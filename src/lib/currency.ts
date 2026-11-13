/**
 * Currency display for the whole app. Pure (no React): the active currency is set once per
 * render from the user's preferences (TransactionProvider calls applyCurrency), and every
 * formatter reads it, so amounts change everywhere when the setting changes.
 *
 * Only the display changes. Stored amounts are plain numbers, nothing is converted.
 */

export type Grouping = 'lakh' | 'thousand';

/** What is saved in preferences. `symbol` and `decimals` are used for code "CUSTOM". */
export type CurrencyPref = { code: string; symbol?: string; decimals?: number; grouping?: Grouping };

export type CurrencyDef = { code: string; name: string; symbol: string; decimals: number; grouping: Grouping };

export const CURRENCIES: CurrencyDef[] = [
  { code: 'NPR', name: 'Nepalese rupee', symbol: 'Nrs.', decimals: 2, grouping: 'lakh' },
  { code: 'INR', name: 'Indian rupee', symbol: '₹', decimals: 2, grouping: 'lakh' },
  { code: 'USD', name: 'US dollar', symbol: '$', decimals: 2, grouping: 'thousand' },
  { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2, grouping: 'thousand' },
  { code: 'GBP', name: 'British pound', symbol: '£', decimals: 2, grouping: 'thousand' },
  { code: 'AUD', name: 'Australian dollar', symbol: 'A$', decimals: 2, grouping: 'thousand' },
  { code: 'CAD', name: 'Canadian dollar', symbol: 'C$', decimals: 2, grouping: 'thousand' },
  { code: 'AED', name: 'UAE dirham', symbol: 'AED', decimals: 2, grouping: 'thousand' },
  { code: 'JPY', name: 'Japanese yen', symbol: '¥', decimals: 0, grouping: 'thousand' },
  { code: 'BDT', name: 'Bangladeshi taka', symbol: '৳', decimals: 2, grouping: 'lakh' },
  { code: 'PKR', name: 'Pakistani rupee', symbol: 'Rs', decimals: 2, grouping: 'lakh' },
  { code: 'LKR', name: 'Sri Lankan rupee', symbol: 'Rs', decimals: 2, grouping: 'thousand' },
];

export const CUSTOM_CODE = 'CUSTOM';
export const DEFAULT_CURRENCY: CurrencyPref = { code: 'NPR' };

function resolve(pref?: CurrencyPref): CurrencyDef {
  const base = CURRENCIES.find((c) => c.code === pref?.code) ?? CURRENCIES[0];
  if (pref?.code === CUSTOM_CODE) {
    const symbol = (pref.symbol ?? '').trim().slice(0, 8) || base.symbol;
    const decimals = Number.isInteger(pref.decimals) ? Math.min(3, Math.max(0, pref.decimals as number)) : 2;
    return { code: CUSTOM_CODE, name: 'Custom', symbol, decimals, grouping: pref.grouping ?? 'thousand' };
  }
  return { ...base, grouping: pref?.grouping ?? base.grouping };
}

let active: CurrencyDef = resolve(DEFAULT_CURRENCY);
const numberFormats = new Map<string, Intl.NumberFormat>();

/** Make `pref` the currency every formatter uses. Cheap and safe to call on every render. */
export function applyCurrency(pref?: CurrencyPref) {
  active = resolve(pref);
}

export function activeCurrency(): CurrencyDef {
  return active;
}

export function currencySymbol(): string {
  return active.symbol;
}

function numberFormat(decimals: number, grouping: Grouping) {
  const key = `${decimals}|${grouping}`;
  let f = numberFormats.get(key);
  if (!f) {
    // en-IN groups as 1,23,45,678 (lakh/crore); en-US as 12,345,678.
    f = new Intl.NumberFormat(grouping === 'lakh' ? 'en-IN' : 'en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    numberFormats.set(key, f);
  }
  return f;
}

/** "Nrs. 1,23,456.50", "Rs 99", "$1,234.50": no space after a currency sign, a space after words or abbreviations. */
function withSymbol(def: CurrencyDef, value: number, digits: string) {
  const sign = value < 0 ? '-' : '';
  const space = /\p{Sc}$/u.test(def.symbol) ? '' : ' ';
  return `${sign}${def.symbol}${space}${digits}`;
}

/** Format an amount in the active currency. `decimals` overrides the currency's usual decimals. */
export function formatMoney(value: number, opts?: { decimals?: number; currency?: CurrencyPref }): string {
  const def = opts?.currency ? resolve(opts.currency) : active;
  const decimals = opts?.decimals ?? def.decimals;
  const n = Number.isFinite(value) ? value : 0;
  return withSymbol(def, n, numberFormat(decimals, def.grouping).format(Math.abs(n)));
}

/** Whole units, for headlines and advice: "Nrs. 4,412". */
export function formatMoneyRounded(value: number): string {
  return formatMoney(value, { decimals: 0 });
}

/** Short form for chart axes: "Nrs. 12k", "Nrs. 1.2L" (lakh), "$1.5M". */
export function formatMoneyCompact(value: number): string {
  const n = Math.abs(value);
  let digits: string;
  if (active.grouping === 'lakh' && n >= 1e7) digits = `${trim(n / 1e7)}Cr`;
  else if (active.grouping === 'lakh' && n >= 1e5) digits = `${trim(n / 1e5)}L`;
  else if (n >= 1e6) digits = `${trim(n / 1e6)}M`;
  else if (n >= 1e3) digits = `${trim(n / 1e3)}k`;
  else digits = String(Math.round(n));
  return withSymbol(active, value, digits);
}

function trim(n: number) {
  return (Math.round(n * 10) / 10).toString();
}
