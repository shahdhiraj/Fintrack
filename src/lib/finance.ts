/**
 * Pure finance helpers. No React, no Firebase runtime — plain values in,
 * plain values out — so they can be unit-tested in isolation.
 */
import { addMonths, addWeeks, addYears, differenceInCalendarDays, startOfDay } from 'date-fns';
import type { BillFrequency } from './types';

/** Minimal shapes so these helpers work with both Firestore docs and plain test data. */
export type TxLike = { amount: number; type: 'income' | 'expense'; walletId?: string; date: Date; category?: string };
export type TransferLike = { amount: number; fromWalletId: string; toWalletId: string };

/**
 * Next due date after paying a bill. Month-based steps clamp to the end of
 * shorter months (Jan 31 -> Feb 28/29), which is what date-fns does.
 * Returns null for one-time bills.
 */
export function nextDueDate(current: Date, frequency: BillFrequency = 'monthly'): Date | null {
  switch (frequency) {
    case 'once':
      return null;
    case 'weekly':
      return addWeeks(current, 1);
    case 'monthly':
      return addMonths(current, 1);
    case 'quarterly':
      return addMonths(current, 3);
    case 'yearly':
      return addYears(current, 1);
  }
}

/** Whole calendar days from `now` until `due` (negative = overdue). */
export function daysUntil(due: Date, now: Date): number {
  return differenceInCalendarDays(startOfDay(due), startOfDay(now));
}

export type DueState = 'overdue' | 'today' | 'soon' | 'later';

export function dueState(due: Date, now: Date, soonWindowDays = 7): DueState {
  const d = daysUntil(due, now);
  if (d < 0) return 'overdue';
  if (d === 0) return 'today';
  if (d <= soonWindowDays) return 'soon';
  return 'later';
}

export function describeDue(due: Date, now: Date): string {
  const d = daysUntil(due, now);
  if (d < -1) return `${-d} days overdue`;
  if (d === -1) return '1 day overdue';
  if (d === 0) return 'Due today';
  if (d === 1) return 'Due tomorrow';
  return `Due in ${d} days`;
}

/** Normalise any bill amount to its monthly equivalent. */
export function monthlyEquivalent(amount: number, frequency: BillFrequency = 'monthly'): number {
  switch (frequency) {
    case 'once':
      return 0;
    case 'weekly':
      return (amount * 52) / 12;
    case 'monthly':
      return amount;
    case 'quarterly':
      return amount / 3;
    case 'yearly':
      return amount / 12;
  }
}

/**
 * Current balance of a wallet:
 * opening balance + income - expenses + transfers in - transfers out.
 */
export function walletBalance(
  walletId: string,
  openingBalance: number,
  transactions: TxLike[],
  transfers: TransferLike[]
): number {
  let balance = openingBalance;
  for (const t of transactions) {
    if (t.walletId !== walletId) continue;
    balance += t.type === 'income' ? t.amount : -t.amount;
  }
  for (const tr of transfers) {
    if (tr.toWalletId === walletId) balance += tr.amount;
    if (tr.fromWalletId === walletId) balance -= tr.amount;
  }
  return round2(balance);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Percent change from `previous` to `current`; null when there is no baseline. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export type Period = 'this-month' | 'last-month' | 'this-year' | 'all-time';

export const PERIOD_LABELS: Record<Period, string> = {
  'this-month': 'This Month',
  'last-month': 'Last Month',
  'this-year': 'This Year',
  'all-time': 'All Time',
};

/** [start, end) range for a period, plus the equivalent previous range for trend comparison. */
export function periodRange(period: Period, now: Date): { start: Date; end: Date; prevStart: Date; prevEnd: Date } | null {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (period) {
    case 'this-month':
      return { start: new Date(y, m, 1), end: new Date(y, m + 1, 1), prevStart: new Date(y, m - 1, 1), prevEnd: new Date(y, m, 1) };
    case 'last-month':
      return { start: new Date(y, m - 1, 1), end: new Date(y, m, 1), prevStart: new Date(y, m - 2, 1), prevEnd: new Date(y, m - 1, 1) };
    case 'this-year':
      return { start: new Date(y, 0, 1), end: new Date(y + 1, 0, 1), prevStart: new Date(y - 1, 0, 1), prevEnd: new Date(y, 0, 1) };
    case 'all-time':
      return null;
  }
}

/** Group expense totals by category, largest first. */
export function expensesByCategory(transactions: TxLike[]): { category: string; amount: number }[] {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    const key = t.category ?? 'Other';
    totals.set(key, (totals.get(key) ?? 0) + t.amount);
  }
  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount: round2(amount) }))
    .sort((a, b) => b.amount - a.amount);
}

/** Escape one CSV cell (RFC 4180). */
export function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: unknown[][]): string {
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
}

/** Readable trend label: "+12.3%", or "20.6×" once a change passes +999%. */
export function formatTrend(pct: number): string {
  if (pct >= 1000) return `${(1 + pct / 100).toFixed(1)}×`;
  return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
}
