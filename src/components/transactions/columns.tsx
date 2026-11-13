
import type { Column, ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Transaction, Wallet } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTransaction } from '@/context/transaction-context';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { AddTransactionDialog } from './add-transaction-dialog';
import { CATEGORY_ICONS } from '@/lib/sample-data';
import { formatMoney } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

function SortHeader<T>({ column, label, align = 'left' }: { column: Column<T, unknown>; label: string; align?: 'left' | 'right' }) {
  const dir = column.getIsSorted();
  const Icon = dir === 'asc' ? ArrowUp : dir === 'desc' ? ArrowDown : ArrowUpDown;
  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      <Button variant="ghost" size="sm" className="-mx-2 h-8 text-xs font-bold gap-1" onClick={() => column.toggleSorting(dir === 'asc')}>
        {label} <Icon className="w-3 h-3" />
      </Button>
    </div>
  );
}

const ActionCell = ({ transaction }: { transaction: Transaction }) => {
  const { deleteTransaction } = useTransaction();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" aria-label={`Actions for ${transaction.description}`}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <AddTransactionDialog
          transaction={transaction}
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-xs gap-2">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </DropdownMenuItem>
          }
        />
        <DropdownMenuSeparator />
        <ConfirmDialog
          title="Delete this transaction?"
          description={
            <p>
              {transaction.description}: {formatMoney(transaction.amount)} on {format(transaction.date.toDate(), 'MMM d, yyyy')}. This cannot be undone.
            </p>
          }
          onConfirm={() => {
            deleteTransaction(transaction.id);
            toast({ title: 'Transaction deleted', description: transaction.description });
          }}
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-xs gap-2 text-rose-600 focus:text-rose-600">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export function buildColumns(wallets: Wallet[]): ColumnDef<Transaction>[] {
  const walletName = new Map(wallets.map((w) => [w.id, w.name]));
  return [
    {
      id: 'date',
      accessorFn: (t) => t.date.toMillis(),
      header: ({ column }) => <SortHeader column={column} label="Date" />,
      cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{format(row.original.date.toDate(), 'MMM d, yyyy')}</span>,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="font-medium flex items-center gap-2">
          <span aria-hidden>{CATEGORY_ICONS[row.original.category] ?? '📦'}</span>
          {row.original.description}
          {row.original.isDemo && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Demo</Badge>}
        </span>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      filterFn: 'equalsString',
      cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge>,
    },
    {
      id: 'wallet',
      accessorFn: (t) => (t.walletId && walletName.get(t.walletId)) || '',
      header: 'Wallet',
      filterFn: 'equalsString',
      cell: ({ getValue }) => <span className="text-muted-foreground">{(getValue() as string) || '—'}</span>,
    },
    {
      accessorKey: 'type',
      filterFn: 'equalsString',
      enableHiding: true,
    },
    {
      id: 'amount',
      accessorFn: (t) => (t.type === 'income' ? t.amount : -t.amount),
      header: ({ column }) => <SortHeader column={column} label="Amount" align="right" />,
      cell: ({ row }) => {
        const income = row.original.type === 'income';
        return (
          <div className={`text-right font-semibold tabular-nums ${income ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
            {income ? '+' : '−'}
            {formatMoney(row.original.amount)}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => <ActionCell transaction={row.original} />,
    },
  ];
}
