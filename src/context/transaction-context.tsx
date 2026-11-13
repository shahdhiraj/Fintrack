
import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import type {
  Transaction,
  TransactionFormData,
  RecurringBill,
  RecurringBillFormData,
  Wallet,
  WalletFormData,
  WalletTransfer,
  WalletTransferFormData,
  Feedback,
  FeedbackFormData,
  Preferences,
  Budget,
  SavingsGoal,
  SavingsGoalFormData,
  GoalContribution,
  Debt,
  DebtFormData,
  DebtPayment,
} from '@/lib/types';
import { DEFAULT_PREFERENCES } from '@/lib/types';
import { applyCurrency } from '@/lib/currency';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { useSyncedCollection, useSyncedDoc, type BulkOp } from '@/firebase/use-synced-store';
import { collection, serverTimestamp, Timestamp, doc, FirestoreError } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { nextDueDate, walletBalance } from '@/lib/finance';
import {
  SAMPLE_TRANSACTIONS,
  SAMPLE_BILLS,
  SAMPLE_WALLETS,
  SAMPLE_TRANSFERS,
  SAMPLE_GOALS,
  SAMPLE_DEBTS,
  type SampleWalletKey,
} from '@/lib/sample-data';

const DAY_MS = 24 * 60 * 60 * 1000;

interface TransactionContextType {
  // Transactions
  transactions: Transaction[];
  /** Returns the new transaction's id (null when signed out). */
  addTransaction: (transaction: TransactionFormData) => string | null;
  updateTransaction: (transactionId: string, transaction: TransactionFormData) => void;
  deleteTransaction: (transactionId: string) => void;
  // Budgets
  budgets: Budget[];
  /** Saves a category's monthly limit for `month` (YYYY-MM). It carries forward to later months until changed. */
  setBudgetLimit: (category: string, month: string, limit: number) => void;
  // Recurring bills
  recurringBills: RecurringBill[];
  addRecurringBill: (bill: RecurringBillFormData) => void;
  updateRecurringBill: (billId: string, bill: RecurringBillFormData) => void;
  /** Records the payment as an expense and rolls the bill to its next due date. Returns that date (null for one-time bills). */
  payRecurringBill: (bill: RecurringBill) => Date | null;
  deleteRecurringBill: (billId: string) => void;
  // Wallets
  wallets: Wallet[];
  walletBalances: Record<string, number>;
  addWallet: (wallet: WalletFormData) => string | null;
  updateWallet: (walletId: string, wallet: WalletFormData) => void;
  deleteWallet: (walletId: string) => void;
  transfers: WalletTransfer[];
  addTransfer: (transfer: WalletTransferFormData) => void;
  deleteTransfer: (transferId: string) => void;
  // Savings goals
  goals: SavingsGoal[];
  goalContributions: GoalContribution[];
  addGoal: (goal: SavingsGoalFormData) => void;
  updateGoal: (goalId: string, goal: SavingsGoalFormData) => void;
  /** Deletes the goal and its contributions. */
  deleteGoal: (goalId: string) => void;
  /** Positive to add money to the goal, negative to take it out. */
  addGoalContribution: (goalId: string, amount: number, date: Date, note?: string) => void;
  deleteGoalContribution: (contributionId: string) => void;
  // Debts and loans
  debts: Debt[];
  debtPayments: DebtPayment[];
  addDebt: (debt: DebtFormData) => void;
  updateDebt: (debtId: string, debt: DebtFormData) => void;
  /** Deletes the debt, its payments and any transactions they created. */
  deleteDebt: (debtId: string) => void;
  /** Records a repayment. With `asTransaction`, also adds it to transactions (category Other). */
  addDebtPayment: (debt: Debt, amount: number, date: Date, note?: string, asTransaction?: boolean) => void;
  deleteDebtPayment: (payment: DebtPayment) => void;
  // Feedback
  feedback: Feedback[];
  submitFeedback: (feedback: FeedbackFormData) => Promise<void>;
  // Preferences
  preferences: Preferences;
  updatePreferences: (patch: Partial<Preferences>) => void;
  // Demo + data management
  isDemoActive: boolean;
  loadDemoData: () => Promise<void>;
  clearDemoData: () => Promise<void>;
  deleteAllData: () => Promise<void>;
  /** Features currently saved on this device only because Firestore refused them. */
  localOnly: string[];
  loading: boolean;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

/** Shown for write failures other than permission-denied (which falls back to the device). */
function reportWriteError(error: unknown) {
  const code = (error as FirestoreError)?.code;
  console.error('Firestore write failed', error);
  toast({
    variant: 'destructive',
    title: "Couldn't save your change",
    description:
      code === 'unavailable'
        ? 'You appear to be offline. Try again when you reconnect.'
        : (error as Error)?.message || 'Unknown error.',
  });
}

const millis = (t: Timestamp | undefined | null) => (t && typeof t.toMillis === 'function' ? t.toMillis() : Date.now());

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const firestore = useFirestore();
  const { user } = useUser();
  const uid = user?.uid;

  const col = (name: string) => (firestore && uid ? collection(firestore, 'users', uid, name) : null);
  const key = (name: string) => (uid ? `fintrack:${uid}:${name}` : null);

  // ---- Stores (Firestore, with on-device fallback) -------------------------
  const transactionsCol = useMemoFirebase(() => col('transactions'), [firestore, uid]);
  const billsCol = useMemoFirebase(() => col('recurringBills'), [firestore, uid]);
  const walletsCol = useMemoFirebase(() => col('wallets'), [firestore, uid]);
  const transfersCol = useMemoFirebase(() => col('walletTransfers'), [firestore, uid]);
  const feedbackCol = useMemoFirebase(() => col('feedback'), [firestore, uid]);
  const budgetsCol = useMemoFirebase(() => col('budgets'), [firestore, uid]);
  const goalsCol = useMemoFirebase(() => col('goals'), [firestore, uid]);
  const contributionsCol = useMemoFirebase(() => col('goalContributions'), [firestore, uid]);
  const debtsCol = useMemoFirebase(() => col('debts'), [firestore, uid]);
  const debtPaymentsCol = useMemoFirebase(() => col('debtPayments'), [firestore, uid]);
  const preferencesRef = useMemoFirebase(
    () => (firestore && uid ? doc(firestore, 'users', uid, 'settings', 'preferences') : null),
    [firestore, uid]
  );

  const txStore = useSyncedCollection<Transaction>(transactionsCol, key('transactions'), reportWriteError);
  const billStore = useSyncedCollection<RecurringBill>(billsCol, key('recurringBills'), reportWriteError);
  const walletStore = useSyncedCollection<Wallet>(walletsCol, key('wallets'), reportWriteError);
  const transferStore = useSyncedCollection<WalletTransfer>(transfersCol, key('walletTransfers'), reportWriteError);
  const feedbackStore = useSyncedCollection<Feedback>(feedbackCol, key('feedback'), reportWriteError);
  const budgetStore = useSyncedCollection<Budget>(budgetsCol, key('budgets'), reportWriteError);
  const goalStore = useSyncedCollection<SavingsGoal>(goalsCol, key('goals'), reportWriteError);
  const contributionStore = useSyncedCollection<GoalContribution>(contributionsCol, key('goalContributions'), reportWriteError);
  const debtStore = useSyncedCollection<Debt>(debtsCol, key('debts'), reportWriteError);
  const debtPaymentStore = useSyncedCollection<DebtPayment>(debtPaymentsCol, key('debtPayments'), reportWriteError);
  const prefsStore = useSyncedDoc<Preferences>(preferencesRef, key('preferences'), reportWriteError);

  const localOnly = useMemo(
    () =>
      [
        txStore.isLocal && 'transactions',
        billStore.isLocal && 'recurring bills',
        walletStore.isLocal && 'wallets',
        transferStore.isLocal && 'wallet transfers',
        feedbackStore.isLocal && 'feedback',
        budgetStore.isLocal && 'budgets',
        goalStore.isLocal && 'goals',
        (contributionStore.isLocal || debtPaymentStore.isLocal) && 'payments',
        debtStore.isLocal && 'debts',
        prefsStore.isLocal && 'preferences',
      ].filter(Boolean) as string[],
    [txStore.isLocal, billStore.isLocal, walletStore.isLocal, transferStore.isLocal, feedbackStore.isLocal, budgetStore.isLocal, goalStore.isLocal, contributionStore.isLocal, debtStore.isLocal, debtPaymentStore.isLocal, prefsStore.isLocal]
  );

  // ---- Sorted views ---------------------------------------------------------
  const transactions = useMemo(
    () => txStore.data.filter((t) => t.date).sort((a, b) => b.date.toMillis() - a.date.toMillis()),
    [txStore.data]
  );
  const recurringBills = useMemo(
    () => billStore.data.filter((b) => b.dueDate).sort((a, b) => a.dueDate.toMillis() - b.dueDate.toMillis()),
    [billStore.data]
  );
  const wallets = useMemo(() => [...walletStore.data].sort((a, b) => millis(a.createdAt) - millis(b.createdAt)), [walletStore.data]);
  const transfers = useMemo(
    () => transferStore.data.filter((t) => t.date).sort((a, b) => b.date.toMillis() - a.date.toMillis()),
    [transferStore.data]
  );
  const feedback = useMemo(
    () => [...feedbackStore.data].sort((a, b) => millis(b.createdAt) - millis(a.createdAt)),
    [feedbackStore.data]
  );
  const goals = useMemo(() => [...goalStore.data].sort((a, b) => millis(a.createdAt) - millis(b.createdAt)), [goalStore.data]);
  const goalContributions = useMemo(
    () => contributionStore.data.filter((c) => c.date).sort((a, b) => b.date.toMillis() - a.date.toMillis()),
    [contributionStore.data]
  );
  const debts = useMemo(() => [...debtStore.data].filter((d) => d.startDate).sort((a, b) => millis(a.createdAt) - millis(b.createdAt)), [debtStore.data]);
  const debtPayments = useMemo(
    () => debtPaymentStore.data.filter((p) => p.date).sort((a, b) => b.date.toMillis() - a.date.toMillis()),
    [debtPaymentStore.data]
  );
  const preferences = useMemo<Preferences>(() => ({ ...DEFAULT_PREFERENCES, ...(prefsStore.data ?? {}) }), [prefsStore.data]);
  // Every money formatter reads the active currency; set it before any child renders.
  applyCurrency(preferences.currency);

  const walletBalances = useMemo(() => {
    const txLike = transactions.map((t) => ({ amount: t.amount, type: t.type, walletId: t.walletId, date: t.date.toDate() }));
    const out: Record<string, number> = {};
    for (const w of wallets) out[w.id] = walletBalance(w.id, w.openingBalance ?? 0, txLike, transfers);
    return out;
  }, [transactions, wallets, transfers]);

  const isDemoActive = useMemo(
    () =>
      wallets.some((w) => w.isDemo) ||
      transactions.some((t) => t.isDemo) ||
      recurringBills.some((b) => b.isDemo) ||
      goals.some((g) => g.isDemo) ||
      debts.some((d) => d.isDemo),
    [wallets, transactions, recurringBills, goals, debts]
  );

  const updatePreferences = useCallback((patch: Partial<Preferences>) => void prefsStore.merge(patch), [prefsStore]);

  // ---- Transactions ---------------------------------------------------------
  const resolveWalletId = (walletId?: string | null) => {
    const candidate = walletId ?? preferences.defaultWalletId;
    return candidate && wallets.some((w) => w.id === candidate) ? candidate : undefined;
  };

  const addTransaction = (transaction: TransactionFormData, extra: { isDemo?: boolean } = {}): string | null => {
    if (!uid) return null;
    const walletId = resolveWalletId(transaction.walletId);
    const id = txStore.newId();
    void txStore.set(id, {
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      date: Timestamp.fromDate(transaction.date),
      createdAt: serverTimestamp(),
      ...(walletId ? { walletId } : {}),
      ...(extra.isDemo ? { isDemo: true } : {}),
    });
    return id;
  };

  const updateTransaction = (id: string, transaction: TransactionFormData) => {
    const walletId = transaction.walletId && wallets.some((w) => w.id === transaction.walletId) ? transaction.walletId : null;
    void txStore.update(id, {
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      date: Timestamp.fromDate(transaction.date),
      walletId,
    });
  };

  const deleteTransaction = (id: string) => void txStore.remove(id);

  // ---- Budgets --------------------------------------------------------------
  // One document per category per month, with a deterministic id so repeated
  // saves update the same document instead of creating duplicates.
  const setBudgetLimit = (category: string, month: string, limit: number) => {
    if (!uid) return;
    void budgetStore.set(`${month}_${category}`, { categoryId: category, month, limit });
  };

  // ---- Recurring bills ------------------------------------------------------
  const billFields = (bill: RecurringBillFormData) => ({
    name: bill.name,
    amount: bill.amount,
    category: bill.category,
    dueDate: Timestamp.fromDate(bill.dueDate),
    frequency: bill.frequency ?? 'monthly',
    walletId: bill.walletId ?? null,
    notes: bill.notes ?? '',
    imageUrl: bill.imageUrl ?? null,
  });

  const addRecurringBill = (bill: RecurringBillFormData) => {
    if (!uid) return;
    void billStore.set(billStore.newId(), { ...billFields(bill), status: 'Scheduled', createdAt: serverTimestamp() });
  };

  const updateRecurringBill = (billId: string, bill: RecurringBillFormData) =>
    void billStore.update(billId, { ...billFields(bill), status: 'Scheduled' });

  const payRecurringBill = (bill: RecurringBill): Date | null => {
    addTransaction(
      { description: bill.name, amount: bill.amount, type: 'expense', category: bill.category, date: new Date(), walletId: bill.walletId ?? undefined },
      { isDemo: bill.isDemo }
    );
    const next = nextDueDate(bill.dueDate.toDate(), bill.frequency ?? 'monthly');
    void billStore.update(
      bill.id,
      next
        ? { dueDate: Timestamp.fromDate(next), lastPaidAt: serverTimestamp(), status: 'Scheduled' }
        : { lastPaidAt: serverTimestamp(), status: 'Paid' }
    );
    return next;
  };

  const deleteRecurringBill = (id: string) => void billStore.remove(id);

  // ---- Wallets --------------------------------------------------------------
  const addWallet = (wallet: WalletFormData): string | null => {
    if (!uid) return null;
    const id = walletStore.newId();
    void walletStore.set(id, { ...wallet, createdAt: serverTimestamp() });
    // The first wallet becomes the default so new transactions land somewhere.
    if (wallets.length === 0 && !preferences.defaultWalletId) updatePreferences({ defaultWalletId: id });
    return id;
  };

  const updateWallet = (walletId: string, wallet: WalletFormData) => void walletStore.update(walletId, { ...wallet });

  const deleteWallet = (walletId: string) => {
    // Transactions keep their walletId and simply show as "unassigned"; no data is lost.
    void walletStore.remove(walletId);
    if (preferences.defaultWalletId === walletId) updatePreferences({ defaultWalletId: '' });
  };

  const addTransfer = (t: WalletTransferFormData) => {
    if (!uid) return;
    void transferStore.set(transferStore.newId(), {
      fromWalletId: t.fromWalletId,
      toWalletId: t.toWalletId,
      amount: t.amount,
      date: Timestamp.fromDate(t.date),
      note: t.note ?? '',
      createdAt: serverTimestamp(),
    });
  };

  const deleteTransfer = (id: string) => void transferStore.remove(id);

  // ---- Savings goals --------------------------------------------------------
  const goalFields = (g: SavingsGoalFormData) => ({
    name: g.name,
    targetAmount: g.targetAmount,
    targetDate: g.targetDate ? Timestamp.fromDate(g.targetDate) : null,
    emoji: g.emoji ?? '🎯',
  });
  const addGoal = (g: SavingsGoalFormData) => {
    if (!uid) return;
    void goalStore.set(goalStore.newId(), { ...goalFields(g), createdAt: serverTimestamp() });
  };
  const updateGoal = (id: string, g: SavingsGoalFormData) => void goalStore.update(id, goalFields(g));
  const deleteGoal = (id: string) => {
    void contributionStore.bulk(goalContributions.filter((c) => c.goalId === id).map((c) => ({ id: c.id, data: null })));
    void goalStore.remove(id);
  };
  const addGoalContribution = (goalId: string, amount: number, date: Date, note = '') => {
    if (!uid || !amount) return;
    const goal = goals.find((g) => g.id === goalId);
    void contributionStore.set(contributionStore.newId(), {
      goalId,
      amount,
      date: Timestamp.fromDate(date),
      note,
      createdAt: serverTimestamp(),
      ...(goal?.isDemo ? { isDemo: true } : {}),
    });
  };
  const deleteGoalContribution = (id: string) => void contributionStore.remove(id);

  // ---- Debts and loans --------------------------------------------------------
  const debtFields = (d: DebtFormData) => ({
    name: d.name,
    direction: d.direction,
    amount: d.amount,
    startDate: Timestamp.fromDate(d.startDate),
    dueDate: d.dueDate ? Timestamp.fromDate(d.dueDate) : null,
    notes: d.notes ?? '',
    walletId: d.walletId ?? null,
  });
  const addDebt = (d: DebtFormData) => {
    if (!uid) return;
    void debtStore.set(debtStore.newId(), { ...debtFields(d), createdAt: serverTimestamp() });
  };
  const updateDebt = (id: string, d: DebtFormData) => void debtStore.update(id, debtFields(d));
  const deleteDebt = (id: string) => {
    const payments = debtPayments.filter((p) => p.debtId === id);
    void txStore.bulk(payments.filter((p) => p.transactionId).map((p) => ({ id: p.transactionId as string, data: null })));
    void debtPaymentStore.bulk(payments.map((p) => ({ id: p.id, data: null })));
    void debtStore.remove(id);
  };
  const addDebtPayment = (debt: Debt, amount: number, date: Date, note = '', asTransaction = false) => {
    if (!uid || !(amount > 0)) return;
    // Paying back a loan is money out; being repaid is money in. Category "Other" keeps it findable.
    const transactionId = asTransaction
      ? addTransaction(
          {
            description: debt.direction === 'owe' ? `Repayment: ${debt.name}` : `Repaid by ${debt.name}`,
            amount,
            type: debt.direction === 'owe' ? 'expense' : 'income',
            category: 'Other',
            date,
            walletId: debt.walletId ?? undefined,
          },
          { isDemo: debt.isDemo }
        )
      : null;
    void debtPaymentStore.set(debtPaymentStore.newId(), {
      debtId: debt.id,
      amount,
      date: Timestamp.fromDate(date),
      note,
      transactionId,
      createdAt: serverTimestamp(),
      ...(debt.isDemo ? { isDemo: true } : {}),
    });
  };
  const deleteDebtPayment = (p: DebtPayment) => {
    if (p.transactionId) void txStore.remove(p.transactionId);
    void debtPaymentStore.remove(p.id);
  };

  // ---- Feedback -------------------------------------------------------------
  const submitFeedback = async (fb: FeedbackFormData) => {
    if (!uid) throw new Error('You must be signed in to send feedback.');
    await feedbackStore.set(feedbackStore.newId(), {
      type: fb.type,
      subject: fb.subject,
      message: fb.message,
      ...(fb.rating ? { rating: fb.rating } : {}),
      status: 'Submitted',
      createdAt: serverTimestamp(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    });
  };

  // ---- Demo data & bulk operations -----------------------------------------
  const loadDemoData = async () => {
    if (!uid || isDemoActive) return;
    const now = Date.now();
    const walletIds = {} as Record<SampleWalletKey, string>;

    const walletOps: BulkOp[] = SAMPLE_WALLETS.map((w, i) => {
      const id = walletStore.newId();
      walletIds[w.key] = id;
      const { key: _key, ...rest } = w;
      // Stagger createdAt so wallets keep a stable display order.
      return { id, data: { ...rest, isDemo: true, createdAt: Timestamp.fromMillis(now - (SAMPLE_WALLETS.length - i) * 1000) } };
    });

    const txOps: BulkOp[] = SAMPLE_TRANSACTIONS.map((s) => ({
      id: txStore.newId(),
      data: {
        description: s.description,
        amount: s.amount,
        type: s.type,
        category: s.category,
        date: Timestamp.fromMillis(now - s.daysAgo * DAY_MS),
        walletId: walletIds[s.wallet],
        isDemo: true,
        createdAt: serverTimestamp(),
      },
    }));

    const billOps: BulkOp[] = SAMPLE_BILLS.map((s) => ({
      id: billStore.newId(),
      data: {
        name: s.name,
        amount: s.amount,
        category: s.category,
        frequency: s.frequency,
        walletId: walletIds[s.wallet],
        dueDate: Timestamp.fromMillis(now + s.dueInDays * DAY_MS),
        status: 'Scheduled',
        notes: '',
        isDemo: true,
        createdAt: serverTimestamp(),
      },
    }));

    const transferOps: BulkOp[] = SAMPLE_TRANSFERS.map((s) => ({
      id: transferStore.newId(),
      data: {
        fromWalletId: walletIds[s.from],
        toWalletId: walletIds[s.to],
        amount: s.amount,
        note: s.note,
        date: Timestamp.fromMillis(now - s.daysAgo * DAY_MS),
        isDemo: true,
        createdAt: serverTimestamp(),
      },
    }));

    const goalOps: BulkOp[] = [];
    const contributionOps: BulkOp[] = [];
    SAMPLE_GOALS.forEach((g, i) => {
      const id = goalStore.newId();
      goalOps.push({
        id,
        data: {
          name: g.name,
          emoji: g.emoji,
          targetAmount: g.target,
          targetDate: g.targetInDays === null ? null : Timestamp.fromMillis(now + g.targetInDays * DAY_MS),
          isDemo: true,
          createdAt: Timestamp.fromMillis(now - (SAMPLE_GOALS.length - i) * 1000),
        },
      });
      for (const c of g.contributions) {
        contributionOps.push({ id: contributionStore.newId(), data: { goalId: id, amount: c.amount, date: Timestamp.fromMillis(now - c.daysAgo * DAY_MS), note: '', isDemo: true, createdAt: serverTimestamp() } });
      }
    });

    const debtOps: BulkOp[] = [];
    const paymentOps: BulkOp[] = [];
    SAMPLE_DEBTS.forEach((d, i) => {
      const id = debtStore.newId();
      debtOps.push({
        id,
        data: {
          name: d.name,
          direction: d.direction,
          amount: d.amount,
          startDate: Timestamp.fromMillis(now - d.startDaysAgo * DAY_MS),
          dueDate: d.dueInDays === null ? null : Timestamp.fromMillis(now + d.dueInDays * DAY_MS),
          notes: d.notes,
          walletId: walletIds.bank,
          isDemo: true,
          createdAt: Timestamp.fromMillis(now - (SAMPLE_DEBTS.length - i) * 1000),
        },
      });
      for (const p of d.payments) {
        paymentOps.push({ id: debtPaymentStore.newId(), data: { debtId: id, amount: p.amount, date: Timestamp.fromMillis(now - p.daysAgo * DAY_MS), note: '', transactionId: null, isDemo: true, createdAt: serverTimestamp() } });
      }
    });

    await Promise.all([
      walletStore.bulk(walletOps),
      txStore.bulk(txOps),
      billStore.bulk(billOps),
      transferStore.bulk(transferOps),
      goalStore.bulk(goalOps),
      contributionStore.bulk(contributionOps),
      debtStore.bulk(debtOps),
      debtPaymentStore.bulk(paymentOps),
    ]);
  };

  const deletions = <T extends { id: string; isDemo?: boolean }>(items: T[], onlyDemo: boolean): BulkOp[] =>
    items.filter((i) => !onlyDemo || i.isDemo).map((i) => ({ id: i.id, data: null }));

  const removeAll = (onlyDemo: boolean) =>
    Promise.all([
      txStore.bulk(deletions(transactions, onlyDemo)),
      billStore.bulk(deletions(recurringBills, onlyDemo)),
      walletStore.bulk(deletions(wallets, onlyDemo)),
      transferStore.bulk(deletions(transfers, onlyDemo)),
      goalStore.bulk(deletions(goals, onlyDemo)),
      contributionStore.bulk(deletions(goalContributions, onlyDemo)),
      debtStore.bulk(deletions(debts, onlyDemo)),
      debtPaymentStore.bulk(deletions(debtPayments, onlyDemo)),
    ]);

  /** Removes only records created by Demo Mode — the user's own data is untouched. */
  const clearDemoData = async () => {
    const defaultIsDemo = wallets.find((w) => w.id === preferences.defaultWalletId)?.isDemo;
    await removeAll(true);
    if (defaultIsDemo) updatePreferences({ defaultWalletId: '' });
  };

  /** Irreversible: removes every transaction, bill, wallet, transfer, goal and debt. */
  const deleteAllData = async () => {
    await removeAll(false);
    updatePreferences({ defaultWalletId: '' });
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        addTransaction: (t) => addTransaction(t),
        updateTransaction,
        deleteTransaction,
        budgets: budgetStore.data,
        setBudgetLimit,
        recurringBills,
        addRecurringBill,
        updateRecurringBill,
        payRecurringBill,
        deleteRecurringBill,
        wallets,
        walletBalances,
        addWallet,
        updateWallet,
        deleteWallet,
        transfers,
        addTransfer,
        deleteTransfer,
        goals,
        goalContributions,
        addGoal,
        updateGoal,
        deleteGoal,
        addGoalContribution,
        deleteGoalContribution,
        debts,
        debtPayments,
        addDebt,
        updateDebt,
        deleteDebt,
        addDebtPayment,
        deleteDebtPayment,
        feedback,
        submitFeedback,
        preferences,
        updatePreferences,
        isDemoActive,
        loadDemoData,
        clearDemoData,
        deleteAllData,
        localOnly,
        loading: txStore.isLoading,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransaction = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransaction must be used within a TransactionProvider');
  }
  return context;
};
