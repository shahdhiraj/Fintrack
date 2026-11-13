/**
 * Month-by-month trends. Pure functions (no React or Firebase).
 */
import { addMonths, format, startOfMonth } from 'date-fns';
import { INCOME_CATEGORIES } from '@/lib/budgets';

export type TxLike = { amount: number; type: 'income' | 'expense'; category: string; date: Date };

export type MonthPoint = {
  key: string; // yyyy-MM
  label: string; // "Nov"
  longLabel: string; // "November 2026"
  income: number;
  expense: number;
  net: number;
  /** 0..100, null without income. */
  savingsRate: number | null;
};

export type CategoryTrend = {
  category: string;
  values: number[]; // one per month, oldest first
  total: number;
  average: number;
  /** Latest month against the average of the earlier months, in percent. Null without history. */
  change: number | null;
};

export type Trends = {
  months: MonthPoint[];
  categories: CategoryTrend[];
  totals: { income: number; expense: number; net: number; averageExpense: number; averageIncome: number; savingsRate: number | null };
  /** Month with the highest net (most kept), and with the highest spending. */
  bestMonth: MonthPoint | null;
  highestSpend: MonthPoint | null;
  /** Months with at least one transaction. */
  activeMonths: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function buildTrends(transactions: TxLike[], monthsBack: number, today = new Date()): Trends {
  const first = startOfMonth(addMonths(today, -(monthsBack - 1)));
  const months: MonthPoint[] = Array.from({ length: monthsBack }, (_, i) => {
    const d = addMonths(first, i);
    return { key: format(d, 'yyyy-MM'), label: format(d, 'MMM'), longLabel: format(d, 'MMMM yyyy'), income: 0, expense: 0, net: 0, savingsRate: null };
  });
  const index = new Map(months.map((m, i) => [m.key, i]));
  const byCategory = new Map<string, number[]>();
  const active = new Set<string>();

  for (const t of transactions) {
    const i = index.get(format(t.date, 'yyyy-MM'));
    if (i === undefined) continue;
    active.add(months[i].key);
    if (t.type === 'income') months[i].income += t.amount;
    else {
      months[i].expense += t.amount;
      if ((INCOME_CATEGORIES as readonly string[]).includes(t.category)) continue;
      const row = byCategory.get(t.category) ?? new Array(monthsBack).fill(0);
      row[i] += t.amount;
      byCategory.set(t.category, row);
    }
  }

  for (const m of months) {
    m.income = round2(m.income);
    m.expense = round2(m.expense);
    m.net = round2(m.income - m.expense);
    m.savingsRate = m.income > 0 ? round2((m.net / m.income) * 100) : null;
  }

  const categories: CategoryTrend[] = [...byCategory.entries()]
    .map(([category, values]) => {
      const rounded = values.map(round2);
      const total = round2(rounded.reduce((s, v) => s + v, 0));
      const earlier = rounded.slice(0, -1);
      const earlierActive = earlier.filter((v) => v > 0);
      const prevAvg = earlierActive.length ? earlierActive.reduce((s, v) => s + v, 0) / earlierActive.length : 0;
      const last = rounded[rounded.length - 1];
      return {
        category,
        values: rounded,
        total,
        average: round2(total / monthsBack),
        change: prevAvg > 0 ? round2(((last - prevAvg) / prevAvg) * 100) : null,
      };
    })
    .sort((a, b) => b.total - a.total);

  const income = round2(months.reduce((s, m) => s + m.income, 0));
  const expense = round2(months.reduce((s, m) => s + m.expense, 0));
  const withData = months.filter((m) => active.has(m.key));
  const bestMonth = withData.length ? withData.reduce((a, b) => (b.net > a.net ? b : a)) : null;
  const highestSpend = withData.length ? withData.reduce((a, b) => (b.expense > a.expense ? b : a)) : null;
  const divisor = Math.max(1, withData.length);

  return {
    months,
    categories,
    totals: {
      income,
      expense,
      net: round2(income - expense),
      averageExpense: round2(expense / divisor),
      averageIncome: round2(income / divisor),
      savingsRate: income > 0 ? round2(((income - expense) / income) * 100) : null,
    },
    bestMonth,
    highestSpend,
    activeMonths: withData.length,
  };
}
