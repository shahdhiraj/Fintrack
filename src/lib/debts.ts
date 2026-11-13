/**
 * Debt and loan maths. Pure functions (no React or Firebase).
 * "owe": money you borrowed and pay back. "lent": money someone owes you.
 */
import { differenceInCalendarDays, startOfDay } from 'date-fns';

export type DebtDirection = 'owe' | 'lent';
export type DebtLike = { amount: number; direction: DebtDirection; dueDate?: Date | null };
export type PaymentLike = { amount: number; date: Date };

export type DebtStatus = 'settled' | 'overdue' | 'due-soon' | 'open';

export type DebtProgress = {
  paid: number;
  remaining: number;
  ratio: number;
  daysToDue: number | null;
  lastPayment: Date | null;
  status: DebtStatus;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function debtProgress(debt: DebtLike, payments: PaymentLike[], today = new Date(), soonDays = 7): DebtProgress {
  const paid = round2(payments.reduce((s, p) => s + Math.max(0, p.amount), 0));
  const total = Math.max(0, debt.amount);
  const remaining = round2(Math.max(0, total - paid));
  const ratio = total > 0 ? Math.min(1, paid / total) : 1;
  const daysToDue = debt.dueDate ? differenceInCalendarDays(startOfDay(debt.dueDate), startOfDay(today)) : null;
  const lastPayment = payments.length ? new Date(Math.max(...payments.map((p) => p.date.getTime()))) : null;

  let status: DebtStatus = 'open';
  if (remaining <= 0) status = 'settled';
  else if (daysToDue !== null && daysToDue < 0) status = 'overdue';
  else if (daysToDue !== null && daysToDue <= soonDays) status = 'due-soon';

  return { paid, remaining, ratio, daysToDue, lastPayment, status };
}

/** Totals across debts, split into what you owe and what you are owed. */
export function debtTotals<T extends DebtLike & { id: string }>(debts: T[], paymentsFor: (id: string) => PaymentLike[], today = new Date()) {
  let owe = 0;
  let owed = 0;
  let overdue = 0;
  for (const d of debts) {
    const p = debtProgress(d, paymentsFor(d.id), today);
    if (p.status === 'settled') continue;
    if (d.direction === 'owe') owe += p.remaining;
    else owed += p.remaining;
    if (p.status === 'overdue') overdue++;
  }
  return { owe: round2(owe), owed: round2(owed), net: round2(owed - owe), overdue };
}
