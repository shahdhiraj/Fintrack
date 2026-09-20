'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ColumnFiltersState } from '@tanstack/react-table';
import { columns } from '@/components/transactions/columns';
import { DataTable } from '@/components/transactions/data-table';
import { useTransaction } from '@/context/transaction-context';

function TransactionsContent() {
  const { transactions, loading } = useTransaction();
  const searchParams = useSearchParams();

  // Seed the table filter from the global search deep-link (?q= / ?category=).
  const q = searchParams.get('q');
  const category = searchParams.get('category');
  const initialFilters: ColumnFiltersState = [
    ...(q ? [{ id: 'description', value: q }] : []),
    ...(category ? [{ id: 'category', value: category }] : []),
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
      </div>
      <DataTable
        columns={columns}
        data={transactions}
        isLoading={loading}
        initialFilters={initialFilters}
      />
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={null}>
      <TransactionsContent />
    </Suspense>
  );
}
