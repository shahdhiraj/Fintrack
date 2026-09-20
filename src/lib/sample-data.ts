import { Category } from './types';

export type SampleTransaction = {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: Category;
  daysAgo: number;
};

export const SAMPLE_TRANSACTIONS: SampleTransaction[] = [
  {
    description: 'Monthly Tech Salary',
    amount: 5200.00,
    type: 'income',
    category: 'Salary',
    daysAgo: 1,
  },
  {
    description: 'Whole Foods Organic Groceries',
    amount: 142.50,
    type: 'expense',
    category: 'Groceries',
    daysAgo: 2,
  },
  {
    description: 'Modern Apartment Rent',
    amount: 1650.00,
    type: 'expense',
    category: 'Housing',
    daysAgo: 3,
  },
  {
    description: 'Freelance UI/UX Design Client',
    amount: 1400.00,
    type: 'income',
    category: 'Salary',
    daysAgo: 4,
  },
  {
    description: 'Subway & Uber Passes',
    amount: 68.20,
    type: 'expense',
    category: 'Transport',
    daysAgo: 5,
  },
  {
    description: 'Spotify & Netflix Subscriptions',
    amount: 29.99,
    type: 'expense',
    category: 'Entertainment',
    daysAgo: 6,
  },
  {
    description: 'Fitness Gym Membership',
    amount: 55.00,
    type: 'expense',
    category: 'Health',
    daysAgo: 7,
  },
  {
    description: 'Nike Running Shoes & Apparel',
    amount: 124.99,
    type: 'expense',
    category: 'Shopping',
    daysAgo: 9,
  },
  {
    description: 'Electric & Fiber Internet Bill',
    amount: 135.40,
    type: 'expense',
    category: 'Utilities',
    daysAgo: 11,
  },
  {
    description: 'Artisan Coffee & Bakery',
    amount: 18.50,
    type: 'expense',
    category: 'Groceries',
    daysAgo: 12,
  },
  {
    description: 'Stock Investment Dividend',
    amount: 320.00,
    type: 'income',
    category: 'Salary',
    daysAgo: 14,
  },
  {
    description: 'Dinner at Italian Bistro',
    amount: 86.40,
    type: 'expense',
    category: 'Entertainment',
    daysAgo: 16,
  },
  {
    description: 'Pharmacy & Wellness Vitamins',
    amount: 42.10,
    type: 'expense',
    category: 'Health',
    daysAgo: 18,
  },
  {
    description: 'Shell Gas Station Refill',
    amount: 48.00,
    type: 'expense',
    category: 'Transport',
    daysAgo: 21,
  },
];

export type SampleBill = {
  name: string;
  amount: number;
  category: Category;
  dueInDays: number;
};

export const SAMPLE_BILLS: SampleBill[] = [
  { name: 'Netflix Subscription', amount: 15.99, category: 'Subscriptions', dueInDays: 5 },
  { name: 'Spotify Premium', amount: 9.99, category: 'Subscriptions', dueInDays: 9 },
  { name: 'Adobe Creative Cloud', amount: 52.99, category: 'Subscriptions', dueInDays: 14 },
  { name: 'Apartment Rent', amount: 1650.0, category: 'Housing', dueInDays: 21 },
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
