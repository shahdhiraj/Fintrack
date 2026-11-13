/**
 * Monthly report suggestions. Pure functions (no React or Firebase), computed on the
 * device from the month's transactions, the previous month and the budget limits.
 */
import { getDate, getDaysInMonth } from 'date-fns';
import type { Budget, Category, Transaction } from '@/lib/types';
import { budgetStatus, effectiveLimit, INCOME_CATEGORIES, monthKey } from '@/lib/budgets';
import { formatMoneyRounded } from '@/lib/currency';

export type InsightTone = 'alert' | 'warn' | 'good' | 'tip';

export type Insight = {
  id: string;
  tone: InsightTone;
  title: string;
  detail: string;
  action?: { label: string; href: string };
};

export type CategoryRow = {
  category: Category;
  spent: number;
  limit: number;
  share: number; // 0..1 of the month's spending
  previous: number;
};

export type MonthReport = {
  month: Date;
  isCurrent: boolean;
  income: number;
  expense: number;
  net: number;
  savingsRate: number | null; // 0..100
  previousExpense: number;
  categories: CategoryRow[];
  projectedExpense: number | null;
  largest: Transaction | null;
  count: number;
};

const DISCRETIONARY: Category[] = ['Entertainment', 'Shopping', 'Dining Out', 'Subscriptions', 'Travel', 'Gifts'];
// Usually paid once a month, so they are counted as-is rather than extrapolated by day.
const FIXED: Category[] = ['Housing', 'Utilities', 'Subscriptions', 'Education', 'Investments'];
const TONE_ORDER: Record<InsightTone, number> = { alert: 0, warn: 1, tip: 2, good: 3 };

// Whole units in the user's currency, e.g. "Nrs. 4,412".
const usd = (n: number) => formatMoneyRounded(n);
const pct = (n: number) => `${Math.round(n)}%`;

export function buildMonthReport(input: {
  month: Date;
  today: Date;
  monthTxns: Transaction[];
  previousTxns: Transaction[];
  budgets: Budget[];
}): MonthReport {
  const { month, today, monthTxns, previousTxns, budgets } = input;
  const isCurrent = monthKey(month) === monthKey(today);
  const key = monthKey(month);

  let income = 0;
  let expense = 0;
  let largest: Transaction | null = null;
  const spent = new Map<Category, number>();
  for (const t of monthTxns) {
    if (t.type === 'income') {
      income += t.amount;
      continue;
    }
    expense += t.amount;
    spent.set(t.category, (spent.get(t.category) ?? 0) + t.amount);
    if (!largest || t.amount > largest.amount) largest = t;
  }

  let previousExpense = 0;
  const previous = new Map<Category, number>();
  for (const t of previousTxns) {
    if (t.type !== 'expense') continue;
    previousExpense += t.amount;
    previous.set(t.category, (previous.get(t.category) ?? 0) + t.amount);
  }

  const categories: CategoryRow[] = [...new Set([...spent.keys(), ...previous.keys()])]
    .filter((c) => !(INCOME_CATEGORIES as readonly string[]).includes(c))
    .map((category) => {
      const s = spent.get(category) ?? 0;
      return {
        category,
        spent: s,
        limit: effectiveLimit(category, key, budgets).limit,
        share: expense > 0 ? s / expense : 0,
        previous: previous.get(category) ?? 0,
      };
    })
    .sort((a, b) => b.spent - a.spent || b.previous - a.previous);

  // Projection, once a few days have passed: fixed bills count once, everyday spending is extrapolated.
  const day = getDate(today);
  let fixed = 0;
  for (const [c, amount] of spent) if (FIXED.includes(c)) fixed += amount;
  const projectedExpense = isCurrent && day >= 5 ? fixed + ((expense - fixed) / day) * getDaysInMonth(month) : null;

  return {
    month,
    isCurrent,
    income,
    expense,
    net: income - expense,
    savingsRate: income > 0 ? ((income - expense) / income) * 100 : null,
    previousExpense,
    categories,
    projectedExpense,
    largest,
    count: monthTxns.length,
  };
}

export function buildInsights(r: MonthReport, today: Date): Insight[] {
  if (r.count === 0) {
    return [
      {
        id: 'empty',
        tone: 'tip',
        title: 'No transactions this month yet',
        detail: 'Add your income and expenses for this month, and suggestions based on them will appear here.',
        action: { label: 'Add a transaction', href: '/transactions' },
      },
    ];
  }

  const out: Insight[] = [];
  const budgetLink = { label: 'Review budgets', href: '/budgets' };
  const spending = r.categories.filter((c) => c.spent > 0);

  // 1. Over and near limits.
  const over = spending.filter((c) => budgetStatus(c.spent, c.limit) === 'over').sort((a, b) => b.spent - b.limit - (a.spent - a.limit));
  for (const c of over.slice(0, 3)) {
    out.push({
      id: `over-${c.category}`,
      tone: 'alert',
      title: `${c.category} is ${usd(c.spent - c.limit)} over its limit`,
      detail: `You spent ${usd(c.spent)} against a ${usd(c.limit)} limit. Pause spending here, or raise the limit if it was set too low.`,
      action: budgetLink,
    });
  }
  if (r.isCurrent) {
    const daysLeft = getDaysInMonth(r.month) - getDate(today);
    const near = spending.filter((c) => budgetStatus(c.spent, c.limit) === 'near').sort((a, b) => b.spent / b.limit - a.spent / a.limit)[0];
    if (near && daysLeft > 0) {
      out.push({
        id: `near-${near.category}`,
        tone: 'warn',
        title: `${near.category} has ${usd(near.limit - near.spent)} left`,
        detail: `${pct((near.spent / near.limit) * 100)} of the limit is used with ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} to go. That is about ${usd((near.limit - near.spent) / daysLeft)} a day.`,
        action: budgetLink,
      });
    }
  }

  // 2. Month-end projection.
  if (r.projectedExpense !== null) {
    if (r.income > 0 && r.projectedExpense > r.income) {
      out.push({
        id: 'projection',
        tone: 'warn',
        title: `On pace to spend ${usd(r.projectedExpense)} this month`,
        detail: `That is ${usd(r.projectedExpense - r.income)} more than your ${usd(r.income)} income so far. Slowing everyday spending is the quickest fix.`,
      });
    } else if (r.previousExpense > 0) {
      const diff = r.projectedExpense - r.previousExpense;
      out.push({
        id: 'projection',
        tone: diff > 0 ? 'tip' : 'good',
        title: `On pace to spend ${usd(r.projectedExpense)} this month`,
        detail:
          diff > 0
            ? `About ${usd(diff)} more than last month's ${usd(r.previousExpense)}, if you keep spending at today's rate.`
            : `About ${usd(-diff)} less than last month's ${usd(r.previousExpense)}, if you keep spending at today's rate.`,
      });
    }
  }

  // 3. Biggest moves against last month (skipped for the current month until the projection is meaningful).
  const compare = !r.isCurrent || r.projectedExpense !== null;
  if (compare && r.previousExpense > 0) {
    const grew = [...r.categories]
      .filter((c) => c.previous > 0 && c.spent - c.previous >= 50 && c.spent / c.previous >= 1.25)
      .sort((a, b) => b.spent - b.previous - (a.spent - a.previous))[0];
    if (grew && !over.some((o) => o.category === grew.category)) {
      out.push({
        id: `grew-${grew.category}`,
        tone: 'warn',
        title: `${grew.category} is up ${usd(grew.spent - grew.previous)} on last month`,
        detail: `${usd(grew.spent)} this month against ${usd(grew.previous)} last month. Check whether this was a one-off.`,
      });
    }
    if (!r.isCurrent) {
      const fell = [...r.categories]
        .filter((c) => c.previous - c.spent >= 50)
        .sort((a, b) => b.previous - b.spent - (a.previous - a.spent))[0];
      if (fell) {
        out.push({
          id: `fell-${fell.category}`,
          tone: 'good',
          title: `You spent ${usd(fell.previous - fell.spent)} less on ${fell.category}`,
          detail: `${usd(fell.spent)} this month, down from ${usd(fell.previous)} the month before.`,
        });
      }
    }
  }

  // 4. Savings rate.
  if (r.savingsRate !== null) {
    if (r.savingsRate < 0) {
      out.push({
        id: 'savings',
        tone: 'alert',
        title: `Spending is ${usd(-r.net)} more than income`,
        detail: 'Cover the gap from savings this month, and set tighter limits on your largest categories for next month.',
        action: budgetLink,
      });
    } else if (r.savingsRate < 20) {
      out.push({
        id: 'savings',
        tone: 'tip',
        title: `You kept ${pct(r.savingsRate)} of your income`,
        detail: `A common target is 20%. Reaching it would mean keeping about ${usd(r.income * 0.2 - r.net)} more this month.`,
      });
    } else {
      out.push({
        id: 'savings',
        tone: 'good',
        title: `You kept ${pct(r.savingsRate)} of your income`,
        detail: `That is ${usd(r.net)} kept. Moving part of it to a savings wallet keeps it out of everyday spending.`,
        action: { label: 'Open wallets', href: '/wallets' },
      });
    }
  }

  // 5. Discretionary share.
  const discretionary = spending.filter((c) => DISCRETIONARY.includes(c.category));
  const discretionaryTotal = discretionary.reduce((s, c) => s + c.spent, 0);
  if (r.expense > 0 && discretionaryTotal / r.expense >= 0.3) {
    out.push({
      id: 'discretionary',
      tone: 'tip',
      title: `${pct((discretionaryTotal / r.expense) * 100)} of spending was optional`,
      detail: `${discretionary.map((c) => c.category).join(', ')} came to ${usd(discretionaryTotal)}. Cutting these by a tenth saves about ${usd(discretionaryTotal * 0.1)}.`,
    });
  }

  // 6. One large purchase.
  if (r.largest && r.expense > 0 && r.largest.amount / r.expense >= 0.25 && r.largest.category !== 'Housing') {
    out.push({
      id: 'largest',
      tone: 'tip',
      title: `One purchase made up ${pct((r.largest.amount / r.expense) * 100)} of spending`,
      detail: `"${r.largest.description}" (${r.largest.category}) was ${usd(r.largest.amount)}. If it happens yearly, a monthly set-aside spreads the cost.`,
    });
  }

  return out.sort((a, b) => TONE_ORDER[a.tone] - TONE_ORDER[b.tone]).slice(0, 6);
}

/** One plain sentence that sums the month up, shown above the suggestions. */
export function headline(r: MonthReport): string {
  if (r.count === 0) return 'Nothing recorded for this month yet.';
  const over = r.categories.filter((c) => c.spent > c.limit && c.spent > 0).length;
  const parts = [`You spent ${usd(r.expense)}${r.income > 0 ? ` of ${usd(r.income)} income` : ''}.`];
  if (over > 0) parts.push(`${over} ${over === 1 ? 'category is' : 'categories are'} over the limit.`);
  else if (r.expense > 0) parts.push('Every category is within its limit.');
  return parts.join(' ');
}
