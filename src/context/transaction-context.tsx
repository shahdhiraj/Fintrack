'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import type {
  Transaction,
  TransactionFormData,
  RecurringBill,
  RecurringBillFormData,
} from '@/lib/types';
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';
import { collection, serverTimestamp, Timestamp, doc } from 'firebase/firestore';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: TransactionFormData) => void;
  deleteTransaction: (transactionId: string) => void;
  recurringBills: RecurringBill[];
  addRecurringBill: (bill: RecurringBillFormData) => void;
  deleteRecurringBill: (billId: string) => void;
  loadDemoData: () => void;
  clearDemoData: () => void;
  loading: boolean;
}

const TransactionContext = createContext<TransactionContextType | undefined>(
  undefined
);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const firestore = useFirestore();
  const { user } = useUser();
  const [localDemoTransactions, setLocalDemoTransactions] = useState<Transaction[]>([]);

  const transactionsCol = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'transactions');
  }, [firestore, user]);

  const { data: firestoreTransactions, isLoading } = useCollection<Omit<Transaction, 'id'>>(transactionsCol);

  const [localDemoBills, setLocalDemoBills] = useState<RecurringBill[]>([]);

  const recurringBillsCol = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'recurringBills');
  }, [firestore, user]);

  const { data: firestoreBills } = useCollection<Omit<RecurringBill, 'id'>>(recurringBillsCol, { suppressErrorEmit: true });

  const addTransaction = (transaction: TransactionFormData) => {
    const newDate = Timestamp.fromDate(transaction.date);
    if (!transactionsCol) {
      const newTx: Transaction = {
        id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ...transaction,
        date: newDate,
      };
      setLocalDemoTransactions(prev => [newTx, ...prev]);
      return;
    }
    
    const newDocRef = doc(transactionsCol);
    const newTransaction = {
      ...transaction,
      id: newDocRef.id,
      date: newDate,
      createdAt: serverTimestamp(),
    };

    setDocumentNonBlocking(newDocRef, newTransaction, {});
  };

  const deleteTransaction = (transactionId: string) => {
    if (transactionId.startsWith('local-')) {
      setLocalDemoTransactions(prev => prev.filter(t => t.id !== transactionId));
      return;
    }
    if (!firestore || !user) return;
    const docRef = doc(firestore, 'users', user.uid, 'transactions', transactionId);
    deleteDocumentNonBlocking(docRef);
  };

  const addRecurringBill = (bill: RecurringBillFormData) => {
    const dueDate = Timestamp.fromDate(bill.dueDate);
    if (!recurringBillsCol) {
      const newBill: RecurringBill = {
        id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: bill.name,
        amount: bill.amount,
        category: bill.category,
        dueDate,
        status: 'Scheduled',
      };
      setLocalDemoBills((prev) => [newBill, ...prev]);
      return;
    }

    const newDocRef = doc(recurringBillsCol);
    const newBill = {
      id: newDocRef.id,
      name: bill.name,
      amount: bill.amount,
      category: bill.category,
      dueDate,
      status: 'Scheduled' as const,
      createdAt: serverTimestamp(),
    };
    setDocumentNonBlocking(newDocRef, newBill, {});
  };

  const deleteRecurringBill = (billId: string) => {
    if (billId.startsWith('local-')) {
      setLocalDemoBills((prev) => prev.filter((b) => b.id !== billId));
      return;
    }
    if (!firestore || !user) return;
    const docRef = doc(firestore, 'users', user.uid, 'recurringBills', billId);
    deleteDocumentNonBlocking(docRef);
  };

  const loadDemoData = () => {
    const { SAMPLE_TRANSACTIONS, SAMPLE_BILLS } = require('@/lib/sample-data');
    const now = new Date();

    SAMPLE_TRANSACTIONS.forEach((sample: any) => {
      const txDate = new Date(now.getTime() - sample.daysAgo * 24 * 60 * 60 * 1000);
      addTransaction({
        description: sample.description,
        amount: sample.amount,
        type: sample.type,
        category: sample.category,
        date: txDate,
      });
    });

    SAMPLE_BILLS.forEach((bill: any) => {
      const dueDate = new Date(now.getTime() + bill.dueInDays * 24 * 60 * 60 * 1000);
      addRecurringBill({
        name: bill.name,
        amount: bill.amount,
        category: bill.category,
        dueDate,
      });
    });
  };

  const clearDemoData = () => {
    if (firestoreTransactions && firestoreTransactions.length > 0) {
      firestoreTransactions.forEach(t => deleteTransaction(t.id));
    }
    if (firestoreBills && firestoreBills.length > 0) {
      firestoreBills.forEach(b => deleteRecurringBill(b.id));
    }
    setLocalDemoTransactions([]);
    setLocalDemoBills([]);
  };

  const combinedTransactions = useMemo(() => {
    const dbTx = firestoreTransactions || [];
    const all = [...dbTx, ...localDemoTransactions];
    return all.sort((a, b) => b.date.toMillis() - a.date.toMillis());
  }, [firestoreTransactions, localDemoTransactions]);

  const combinedBills = useMemo(() => {
    const dbBills = firestoreBills || [];
    const all = [...dbBills, ...localDemoBills];
    return all.sort((a, b) => a.dueDate.toMillis() - b.dueDate.toMillis());
  }, [firestoreBills, localDemoBills]);

  return (
    <TransactionContext.Provider
      value={{
        transactions: combinedTransactions,
        addTransaction,
        deleteTransaction,
        recurringBills: combinedBills,
        addRecurringBill,
        deleteRecurringBill,
        loadDemoData,
        clearDemoData,
        loading: isLoading,
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
