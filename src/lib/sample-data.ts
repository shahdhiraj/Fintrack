import { BillFrequency, Category, WalletColor, WalletType } from './types';

/** Demo wallets are referenced from samples by `key`; real IDs are assigned at load time. */
export type SampleWalletKey = 'bank' | 'card' | 'cash' | 'savings';

export type SampleWallet = {
  key: SampleWalletKey;
  name: string;
  type: WalletType;
  openingBalance: number;
  color: WalletColor;
};

export const SAMPLE_WALLETS: SampleWallet[] = [
  { key: 'bank', name: 'Main Checking', type: 'bank', openingBalance: 2400, color: 'emerald' },
  { key: 'card', name: 'Visa Credit Card', type: 'credit', openingBalance: 0, color: 'violet' },
  { key: 'cash', name: 'Cash Wallet', type: 'cash', openingBalance: 150, color: 'amber' },
  { key: 'savings', name: 'Emergency Savings', type: 'savings', openingBalance: 5000, color: 'sky' },
];

export type SampleTransfer = {
  from: SampleWalletKey;
  to: SampleWalletKey;
  amount: number;
  daysAgo: number;
  note: string;
};

export const SAMPLE_TRANSFERS: SampleTransfer[] = [
  { from: 'bank', to: 'savings', amount: 500, daysAgo: 1, note: 'Monthly savings' },
  { from: 'bank', to: 'cash', amount: 100, daysAgo: 8, note: 'ATM withdrawal' },
];

export type SampleTransaction = {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: Category;
  daysAgo: number;
  wallet: SampleWalletKey;
};

export const SAMPLE_TRANSACTIONS: SampleTransaction[] = [
  { description: 'Monthly Tech Salary', amount: 5200.0, type: 'income', category: 'Salary', daysAgo: 1, wallet: 'bank' },
  { description: 'Whole Foods Organic Groceries', amount: 142.5, type: 'expense', category: 'Groceries', daysAgo: 2, wallet: 'card' },
  { description: 'Modern Apartment Rent', amount: 1650.0, type: 'expense', category: 'Housing', daysAgo: 3, wallet: 'bank' },
  { description: 'Freelance UI/UX Design Client', amount: 1400.0, type: 'income', category: 'Freelance', daysAgo: 4, wallet: 'bank' },
  { description: 'Subway & Uber Passes', amount: 68.2, type: 'expense', category: 'Transport', daysAgo: 5, wallet: 'card' },
  { description: 'Spotify & Netflix Subscriptions', amount: 29.99, type: 'expense', category: 'Subscriptions', daysAgo: 6, wallet: 'card' },
  { description: 'Fitness Gym Membership', amount: 55.0, type: 'expense', category: 'Health', daysAgo: 7, wallet: 'card' },
  { description: 'Nike Running Shoes & Apparel', amount: 124.99, type: 'expense', category: 'Shopping', daysAgo: 9, wallet: 'card' },
  { description: 'Electric & Fiber Internet Bill', amount: 135.4, type: 'expense', category: 'Utilities', daysAgo: 11, wallet: 'bank' },
  { description: 'Artisan Coffee & Bakery', amount: 18.5, type: 'expense', category: 'Dining Out', daysAgo: 12, wallet: 'cash' },
  { description: 'Stock Investment Dividend', amount: 320.0, type: 'income', category: 'Investments', daysAgo: 14, wallet: 'savings' },
  { description: 'Dinner at Italian Bistro', amount: 86.4, type: 'expense', category: 'Dining Out', daysAgo: 16, wallet: 'card' },
  { description: 'Pharmacy & Wellness Vitamins', amount: 42.1, type: 'expense', category: 'Health', daysAgo: 18, wallet: 'cash' },
  { description: 'Shell Gas Station Refill', amount: 48.0, type: 'expense', category: 'Transport', daysAgo: 21, wallet: 'card' },
  // Previous months, so trends and the 6-month chart have history.
  { description: 'Monthly Tech Salary', amount: 5200.0, type: 'income', category: 'Salary', daysAgo: 32, wallet: 'bank' },
  { description: 'Modern Apartment Rent', amount: 1650.0, type: 'expense', category: 'Housing', daysAgo: 34, wallet: 'bank' },
  { description: 'Weekly Groceries', amount: 210.35, type: 'expense', category: 'Groceries', daysAgo: 38, wallet: 'card' },
  { description: 'Weekend Trip Train Tickets', amount: 184.0, type: 'expense', category: 'Travel', daysAgo: 45, wallet: 'card' },
  { description: 'Monthly Tech Salary', amount: 5000.0, type: 'income', category: 'Salary', daysAgo: 62, wallet: 'bank' },
  { description: 'Modern Apartment Rent', amount: 1650.0, type: 'expense', category: 'Housing', daysAgo: 64, wallet: 'bank' },
  { description: 'Online Course Subscription', amount: 49.0, type: 'expense', category: 'Education', daysAgo: 70, wallet: 'card' },
  { description: 'Monthly Tech Salary', amount: 5000.0, type: 'income', category: 'Salary', daysAgo: 92, wallet: 'bank' },
  { description: 'Modern Apartment Rent', amount: 1650.0, type: 'expense', category: 'Housing', daysAgo: 94, wallet: 'bank' },
];

export type SampleBill = {
  name: string;
  amount: number;
  category: Category;
  /** Negative = already overdue, to demo overdue alerts. */
  dueInDays: number;
  frequency: BillFrequency;
  wallet: SampleWalletKey;
};

export const SAMPLE_BILLS: SampleBill[] = [
  { name: 'Car Insurance', amount: 96.0, category: 'Transport', dueInDays: -2, frequency: 'monthly', wallet: 'bank' },
  { name: 'Netflix Subscription', amount: 15.99, category: 'Subscriptions', dueInDays: 2, frequency: 'monthly', wallet: 'card' },
  { name: 'Spotify Premium', amount: 9.99, category: 'Subscriptions', dueInDays: 9, frequency: 'monthly', wallet: 'card' },
  { name: 'Adobe Creative Cloud', amount: 599.88, category: 'Subscriptions', dueInDays: 14, frequency: 'yearly', wallet: 'card' },
  { name: 'Apartment Rent', amount: 1650.0, category: 'Housing', dueInDays: 21, frequency: 'monthly', wallet: 'bank' },
];

export const CATEGORY_ICONS: Record<Category, string> = {
  Salary: '💰',
  Freelance: '💻',
  Investments: '📈',
  Business: '🏢',
  Groceries: '🛒',
  Housing: '🏠',
  Transport: '🚗',
  Entertainment: '🎬',
  Health: '🏥',
  Shopping: '🛍️',
  Utilities: '⚡',
  'Dining Out': '🍽️',
  Education: '🎓',
  Travel: '✈️',
  Subscriptions: '💳',
  Pets: '🐾',
  Gifts: '🎁',
  Other: '📦',
};

export const CATEGORY_COLORS: Record<Category, { bg: string; text: string; border: string }> = {
  Salary: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30' },
  Freelance: { bg: 'bg-teal-500/10 dark:bg-teal-500/20', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-500/30' },
  Investments: { bg: 'bg-emerald-600/10 dark:bg-emerald-600/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-600/30' },
  Business: { bg: 'bg-cyan-500/10 dark:bg-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/30' },
  Groceries: { bg: 'bg-green-500/10 dark:bg-green-500/20', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/30' },
  Housing: { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30' },
  Transport: { bg: 'bg-sky-500/10 dark:bg-sky-500/20', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-500/30' },
  Entertainment: { bg: 'bg-purple-500/10 dark:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30' },
  Health: { bg: 'bg-rose-500/10 dark:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30' },
  Shopping: { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30' },
  Utilities: { bg: 'bg-orange-500/10 dark:bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30' },
  'Dining Out': { bg: 'bg-yellow-500/10 dark:bg-yellow-500/20', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500/30' },
  Education: { bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/30' },
  Travel: { bg: 'bg-teal-500/10 dark:bg-teal-500/20', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-500/30' },
  Subscriptions: { bg: 'bg-violet-500/10 dark:bg-violet-500/20', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500/30' },
  Pets: { bg: 'bg-pink-500/10 dark:bg-pink-500/20', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-500/30' },
  Gifts: { bg: 'bg-red-500/10 dark:bg-red-500/20', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/30' },
  Other: { bg: 'bg-slate-500/10 dark:bg-slate-500/20', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/30' },
};

/** Demo savings goals; contributions are dated relative to today. */
export const SAMPLE_GOALS: { name: string; emoji: string; target: number; targetInDays: number | null; contributions: { amount: number; daysAgo: number }[] }[] = [
  { name: 'New laptop', emoji: '💻', target: 1500, targetInDays: 140, contributions: [{ amount: 200, daysAgo: 70 }, { amount: 200, daysAgo: 40 }, { amount: 150, daysAgo: 8 }] },
  { name: 'Emergency fund', emoji: '🛟', target: 6000, targetInDays: null, contributions: [{ amount: 1000, daysAgo: 90 }, { amount: 800, daysAgo: 30 }] },
  { name: 'Pokhara trip', emoji: '✈️', target: 600, targetInDays: 30, contributions: [{ amount: 150, daysAgo: 12 }] },
];

/** Demo debts and loans. */
export const SAMPLE_DEBTS: { name: string; direction: 'owe' | 'lent'; amount: number; startDaysAgo: number; dueInDays: number | null; notes: string; payments: { amount: number; daysAgo: number }[] }[] = [
  { name: 'Scooter loan', direction: 'owe', amount: 2400, startDaysAgo: 120, dueInDays: 240, notes: 'Monthly instalments', payments: [{ amount: 200, daysAgo: 90 }, { amount: 200, daysAgo: 60 }, { amount: 200, daysAgo: 30 }] },
  { name: 'Lent to Sita', direction: 'lent', amount: 300, startDaysAgo: 25, dueInDays: 5, notes: 'For the concert tickets', payments: [{ amount: 100, daysAgo: 10 }] },
];
