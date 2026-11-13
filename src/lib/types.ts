import { DEFAULT_CURRENCY, type CurrencyPref } from './currency';
import { Timestamp } from 'firebase/firestore';

export type Transaction = {
  id: string;
  date: Timestamp;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: Category;
  walletId?: string;
  isDemo?: boolean;
};

export type TransactionFormData = {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: Category;
  date: Date;
  walletId?: string;
};


export type Category =
  | 'Salary'
  | 'Freelance'
  | 'Investments'
  | 'Business'
  | 'Groceries'
  | 'Housing'
  | 'Transport'
  | 'Entertainment'
  | 'Health'
  | 'Shopping'
  | 'Utilities'
  | 'Dining Out'
  | 'Education'
  | 'Travel'
  | 'Subscriptions'
  | 'Pets'
  | 'Gifts'
  | 'Other';

export const categories: Category[] = [
  'Salary',
  'Freelance',
  'Investments',
  'Business',
  'Groceries',
  'Housing',
  'Transport',
  'Entertainment',
  'Health',
  'Shopping',
  'Utilities',
  'Dining Out',
  'Education',
  'Travel',
  'Subscriptions',
  'Pets',
  'Gifts',
  'Other',
];

export type Budget = {
    id: string;
    categoryId: string;
    month: string; // e.g., "2024-07"
    limit: number;
};

export type BillFrequency = 'once' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export const BILL_FREQUENCIES: { value: BillFrequency; label: string }[] = [
  { value: 'once', label: 'One-time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export type RecurringBill = {
  id: string;
  name: string;
  amount: number;
  dueDate: Timestamp;
  category: Category;
  status: 'Scheduled' | 'Paid';
  /** Older documents have no frequency; they are treated as monthly. */
  frequency?: BillFrequency;
  walletId?: string;
  lastPaidAt?: Timestamp;
  notes?: string;
  /** Uploaded thumbnail (data URL) or https image link. */
  imageUrl?: string | null;
  isDemo?: boolean;
};

export type RecurringBillFormData = {
  name: string;
  amount: number;
  dueDate: Date;
  category: Category;
  frequency?: BillFrequency;
  walletId?: string;
  notes?: string;
  imageUrl?: string;
};

export type WalletType = 'bank' | 'cash' | 'credit' | 'savings' | 'ewallet' | 'investment';

export const WALLET_TYPES: { value: WalletType; label: string; emoji: string }[] = [
  { value: 'bank', label: 'Bank Account', emoji: '🏦' },
  { value: 'cash', label: 'Cash', emoji: '💵' },
  { value: 'credit', label: 'Credit Card', emoji: '💳' },
  { value: 'savings', label: 'Savings', emoji: '🐖' },
  { value: 'ewallet', label: 'E-Wallet', emoji: '📱' },
  { value: 'investment', label: 'Investment', emoji: '📈' },
];

export const WALLET_COLORS = ['emerald', 'sky', 'violet', 'amber', 'rose', 'slate'] as const;
export type WalletColor = (typeof WALLET_COLORS)[number];

export type Wallet = {
  id: string;
  name: string;
  type: WalletType;
  openingBalance: number;
  color: WalletColor;
  createdAt?: Timestamp;
  isDemo?: boolean;
};

export type WalletFormData = {
  name: string;
  type: WalletType;
  openingBalance: number;
  color: WalletColor;
};

export type WalletTransfer = {
  id: string;
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  date: Timestamp;
  note?: string;
  isDemo?: boolean;
};

export type WalletTransferFormData = {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  date: Date;
  note?: string;
};

export type FeedbackType = 'bug' | 'feature' | 'general' | 'support';

export type Feedback = {
  id: string;
  type: FeedbackType;
  subject: string;
  message: string;
  rating?: number;
  status: 'Submitted' | 'In Review' | 'Resolved';
  createdAt: Timestamp;
};

export type FeedbackFormData = {
  type: FeedbackType;
  subject: string;
  message: string;
  rating?: number;
};

export type Preferences = {
  defaultWalletId?: string;
  /** Display currency. Amounts are stored as plain numbers; changing this does not convert them. */
  currency?: CurrencyPref;
  /** How many days ahead a bill appears in the notification bell. */
  reminderDays: number;
  billReminders: boolean;
  overdueAlerts: boolean;
  showClock: boolean;
};

export const DEFAULT_PREFERENCES: Preferences = {
  currency: DEFAULT_CURRENCY,
  reminderDays: 3,
  billReminders: true,
  overdueAlerts: true,
  showClock: true,
};

// ---- Savings goals ---------------------------------------------------------

export type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  /** Optional date to reach the target by. */
  targetDate?: Timestamp | null;
  emoji?: string;
  createdAt?: Timestamp;
  isDemo?: boolean;
};

export type SavingsGoalFormData = { name: string; targetAmount: number; targetDate?: Date | null; emoji?: string };

/** Money put towards (positive) or taken out of (negative) a goal. Tracking only: no wallet moves. */
export type GoalContribution = {
  id: string;
  goalId: string;
  amount: number;
  date: Timestamp;
  note?: string;
  createdAt?: Timestamp;
  isDemo?: boolean;
};

export const GOAL_EMOJIS = ['🎯', '💻', '🏠', '✈️', '🚗', '🎓', '💍', '🛟', '📱', '🏍️', '🎁', '🏥'] as const;

// ---- Debts and loans -------------------------------------------------------

/** "owe": you borrowed and pay back. "lent": someone owes you. */
export type DebtDirection = 'owe' | 'lent';

export type Debt = {
  id: string;
  /** The person or lender, e.g. "Bank loan" or "Sita". */
  name: string;
  direction: DebtDirection;
  amount: number;
  startDate: Timestamp;
  dueDate?: Timestamp | null;
  notes?: string;
  walletId?: string | null;
  createdAt?: Timestamp;
  isDemo?: boolean;
};

export type DebtFormData = {
  name: string;
  direction: DebtDirection;
  amount: number;
  startDate: Date;
  dueDate?: Date | null;
  notes?: string;
  walletId?: string | null;
};

export type DebtPayment = {
  id: string;
  debtId: string;
  amount: number;
  date: Timestamp;
  note?: string;
  /** Set when the payment was also recorded as a transaction (deleted together). */
  transactionId?: string | null;
  createdAt?: Timestamp;
  isDemo?: boolean;
};
