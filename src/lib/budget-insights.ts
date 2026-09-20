import type { Transaction, Category } from '@/lib/types';

// Categories a person can realistically cut without hurting essentials.
const DISCRETIONARY: Category[] = [
  'Entertainment',
  'Shopping',
  'Dining Out',
  'Subscriptions',
  'Travel',
  'Gifts',
];

export type SpendingSummary = {
  totalIncome: number;
  totalExpense: number;
  net: number;
  savingsRate: number; // 0..1
  byCategory: { category: Category; amount: number; pct: number }[];
  top?: { category: Category; amount: number; pct: number };
  discretionaryTotal: number;
  discretionaryCats: Category[];
  count: number;
};

const money = (n: number) =>
  n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

export function analyzeSpending(transactions: Transaction[]): SpendingSummary {
  let totalIncome = 0;
  let totalExpense = 0;
  const cat = new Map<Category, number>();

  for (const t of transactions) {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
      cat.set(t.category, (cat.get(t.category) ?? 0) + t.amount);
    }
  }

  const byCategory = [...cat.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      pct: totalExpense ? amount / totalExpense : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const discretionary = byCategory.filter((c) => DISCRETIONARY.includes(c.category));
  const net = totalIncome - totalExpense;

  return {
    totalIncome,
    totalExpense,
    net,
    savingsRate: totalIncome ? net / totalIncome : 0,
    byCategory,
    top: byCategory[0],
    discretionaryTotal: discretionary.reduce((s, c) => s + c.amount, 0),
    discretionaryCats: discretionary.map((c) => c.category),
    count: transactions.length,
  };
}

// A compact, readable brief for the model. Grounds its output in real numbers.
export function summaryForModel(s: SpendingSummary): string {
  if (s.count === 0 || s.totalExpense === 0) {
    return 'The user has no meaningful spending history yet.';
  }
  const lines = [
    `Total income: ${money(s.totalIncome)}`,
    `Total expenses: ${money(s.totalExpense)}`,
    `Net: ${money(s.net)} (savings rate ${Math.round(s.savingsRate * 100)}%)`,
    'Spending by category (highest first):',
    ...s.byCategory
      .slice(0, 8)
      .map((c) => `  - ${c.category}: ${money(c.amount)} (${Math.round(c.pct * 100)}%)`),
  ];
  if (s.discretionaryTotal > 0) {
    lines.push(`Discretionary total (${s.discretionaryCats.join(', ')}): ${money(s.discretionaryTotal)}`);
  }
  return lines.join('\n');
}

// Deterministic, fully-grounded advice. Used when the model is unavailable,
// so the advisor always says something specific to the user's own numbers.
export function buildLocalAdvice(s: SpendingSummary): string[] {
  if (s.count === 0 || s.totalExpense === 0) {
    return [
      'Add a few income and expense transactions to get recommendations tailored to your spending.',
      'Once you have some history, set a limit for each category on the Budgets page to stay on track.',
    ];
  }

  const tips: string[] = [];

  if (s.top) {
    const pct = Math.round(s.top.pct * 100);
    const save = Math.round(s.top.amount * 0.1);
    tips.push(
      `Your largest expense category is ${s.top.category} at ${money(s.top.amount)}, about ${pct}% of your total spending. Trimming it by 10% would free up roughly ${money(save)}.`
    );
  }

  if (s.totalIncome > 0) {
    const rate = Math.round(s.savingsRate * 100);
    if (rate >= 20) {
      tips.push(
        `Nice work. You are saving around ${rate}% of your income. Consider putting the surplus toward an emergency fund or investments.`
      );
    } else if (rate >= 0) {
      const gap = money(Math.max(0, s.totalIncome * 0.2 - s.net));
      tips.push(
        `You are saving around ${rate}% of your income. Reaching a 20% rate would mean setting aside about ${gap} more each period.`
      );
    } else {
      tips.push(
        `You are spending more than you earn this period by ${money(-s.net)}. Capping your top category is the fastest way to close that gap.`
      );
    }
  }

  if (s.discretionaryTotal > 0) {
    tips.push(
      `Discretionary spending (${s.discretionaryCats.join(', ')}) totals ${money(s.discretionaryTotal)}. Setting a firm cap here is an easy win that rarely hurts day to day.`
    );
  }

  tips.push(
    'Set a budget for each of your top categories on the Budgets page, then check back weekly to stay on track.'
  );

  return tips;
}
