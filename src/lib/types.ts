import { Timestamp } from 'firebase/firestore';

export type Transaction = {
  id: string;
  date: Timestamp;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: Category;
};

export type TransactionFormData = {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: Category;
  date: Date;
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

export type RecurringBill = {
  id: string;
  name: string;
  amount: number;
  dueDate: Timestamp;
  category: Category;
  status: 'Scheduled' | 'Paid';
};

export type RecurringBillFormData = {
  name: string;
  amount: number;
  dueDate: Date;
  category: Category;
};
