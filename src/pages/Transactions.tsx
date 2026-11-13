
import { Suspense } from 'react';
import { useSearchParams } from '@/lib/navigation';
import { Plus } from 'lucide-react';
import type { ColumnFiltersState } from '@tanstack/react-table';
import { DataTable } from '@/components/transactions/data-table';
import { AddTransactionDialog } from '@/components/transactions/add-transaction-dialog';
import { Button } from '@/components/ui/button';
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
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">{transactions.length} recorded. Search, filter, edit or delete any of them.</p>
        </div>
        <AddTransactionDialog
          trigger={
            <Button className="chrome-green chrome-sheen rounded-xl text-white text-xs font-bold gap-1.5">
              <Plus className="w-4 h-4" /> Add Transaction
            </Button>
          }
        />
      </div>
      {/* Re-mount when the deep-link changes so a new search from the palette applies. */}
      <DataTable key={`${q ?? ''}|${category ?? ''}`} data={transactions} isLoading={loading} initialFilters={initialFilters} />
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
