/** Pure budget helpers (no React/Firebase) so they can be unit-tested. */

/** Categories that represent money coming in; they never get a spending budget. */
export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business'] as const;

export const DEFAULT_LIMITS: Record<string, number> = {
  Housing: 1800,
  Groceries: 500,
  Transport: 300,
  Utilities: 250,
  'Dining Out': 250,
  Entertainment: 200,
  Shopping: 300,
  Health: 150,
  Education: 300,
  Travel: 400,
  Subscriptions: 100,
  Pets: 150,
  Gifts: 150,
  Investments: 500,
  Other: 200,
};

/** "YYYY-MM" in the user's local time zone (toISOString would use UTC). */
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export type BudgetLike = { categoryId: string; month: string; limit: number };

export type EffectiveLimit = { limit: number; source: 'this-month' | 'carried' | 'default'; fromMonth?: string };

/**
 * Limit in force for a category in `month`: that month's saved limit, else the
 * most recent earlier month's (limits carry forward), else the default.
 */
export function effectiveLimit(category: string, month: string, budgets: BudgetLike[]): EffectiveLimit {
  let best: BudgetLike | undefined;
  for (const b of budgets) {
    if (b.categoryId !== category || b.month > month || !(b.limit >= 0)) continue;
    if (!best || b.month > best.month) best = b;
  }
  if (!best) return { limit: DEFAULT_LIMITS[category] ?? 300, source: 'default' };
  return { limit: best.limit, source: best.month === month ? 'this-month' : 'carried', fromMonth: best.month };
}

export type BudgetStatus = 'over' | 'near' | 'ok';

export function budgetStatus(spent: number, limit: number): BudgetStatus {
  if (limit <= 0) return spent > 0 ? 'over' : 'ok';
  if (spent > limit) return 'over';
  if (spent / limit >= 0.8) return 'near';
  return 'ok';
}
