
import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table';
import { Search, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '../ui/skeleton';
import { Card } from '../ui/card';
import { buildColumns } from './columns';
import { useTransaction } from '@/context/transaction-context';
import { categories, type Transaction } from '@/lib/types';
import { formatMoney } from '@/lib/utils';
import { format } from 'date-fns';

const ALL = '__all__';

export function DataTable({
  data,
  isLoading,
  initialFilters,
}: {
  data: Transaction[];
  isLoading: boolean;
  initialFilters?: ColumnFiltersState;
}) {
  const { wallets } = useTransaction();
  const columns = React.useMemo(() => buildColumns(wallets), [wallets]);
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'date', desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(initialFilters ?? []);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 15 });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
    state: { sorting, columnFilters, pagination, columnVisibility: { type: false } },
  });

  // Back to page 1 whenever the filters change.
  React.useEffect(() => setPagination((p) => ({ ...p, pageIndex: 0 })), [columnFilters]);

  const filterValue = (id: string) => (table.getColumn(id)?.getFilterValue() as string) ?? '';
  const setFilter = (id: string, v: string) => table.getColumn(id)?.setFilterValue(v === ALL || v === '' ? undefined : v);

  const filtered = table.getFilteredRowModel().rows.map((r) => r.original);
  const income = filtered.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expense = filtered.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const visibleColumns = table.getVisibleLeafColumns().length;
  const { pageIndex, pageSize } = table.getState().pagination;
  const total = filtered.length;

  return (
    <Card className="rounded-2xl">
      <div className="grid grid-cols-2 gap-2 p-4 lg:flex lg:flex-row">
        <div className="relative col-span-2 flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search descriptions…"
            value={filterValue('description')}
            onChange={(e) => setFilter('description', e.target.value)}
            className="pl-8 h-11 md:h-9 rounded-xl"
            aria-label="Search descriptions"
          />
        </div>
        <Select value={filterValue('type') || ALL} onValueChange={(v) => setFilter('type', v)}>
          <SelectTrigger className="h-11 md:h-9 rounded-xl lg:w-36 text-sm md:text-xs" aria-label="Filter by type"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL} className="text-xs">All types</SelectItem>
            <SelectItem value="income" className="text-xs">Income</SelectItem>
            <SelectItem value="expense" className="text-xs">Expense</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterValue('category') || ALL} onValueChange={(v) => setFilter('category', v)}>
          <SelectTrigger className="h-11 md:h-9 rounded-xl lg:w-40 text-sm md:text-xs" aria-label="Filter by category"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL} className="text-xs">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {wallets.length > 0 && (
          <Select value={filterValue('wallet') || ALL} onValueChange={(v) => setFilter('wallet', v)}>
            <SelectTrigger className="h-11 md:h-9 rounded-xl lg:w-40 text-sm md:text-xs" aria-label="Filter by wallet"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className="text-xs">All wallets</SelectItem>
              {wallets.map((w) => (
                <SelectItem key={w.id} value={w.name} className="text-xs">{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {columnFilters.length > 0 && (
          <Button variant="ghost" size="sm" className="h-11 md:h-9 text-xs gap-1" onClick={() => setColumnFilters([])}>
            <X className="w-3.5 h-3.5" /> Clear
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 px-4 pb-3 text-xs">
        <div className="rounded-xl bg-muted/40 p-2.5">
          <p className="text-muted-foreground">Income</p>
          <p className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatMoney(income)}</p>
        </div>
        <div className="rounded-xl bg-muted/40 p-2.5">
          <p className="text-muted-foreground">Expenses</p>
          <p className="font-bold tabular-nums">{formatMoney(expense)}</p>
        </div>
        <div className="rounded-xl bg-muted/40 p-2.5">
          <p className="text-muted-foreground">Net</p>
          <p className={`font-bold tabular-nums ${income - expense < 0 ? 'text-rose-600' : ''}`}>{formatMoney(income - expense)}</p>
        </div>
      </div>

      {/* Phones: one card per transaction, same data and actions as the table. */}
      <ul className="divide-y border-t md:hidden" aria-label="Transactions">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <li key={i} className="p-4">
              <Skeleton className="h-12" />
            </li>
          ))
        ) : table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => {
            const t = row.original;
            const income = t.type === 'income';
            const actions = row.getAllCells().find((c) => c.column.id === 'actions');
            const wallet = row.getValue('wallet') as string;
            return (
              <li key={row.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{t.description}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {t.category}
                    {wallet ? ` · ${wallet}` : ''} · {format(t.date.toDate(), 'MMM d')}
                    {t.isDemo ? ' · Demo' : ''}
                  </p>
                </div>
                <p className={`shrink-0 text-sm font-bold tabular-nums ${income ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                  {income ? '+' : '−'}
                  {formatMoney(t.amount)}
                </p>
                {actions && <div className="shrink-0">{flexRender(actions.column.columnDef.cell, actions.getContext())}</div>}
              </li>
            );
          })
        ) : (
          <li className="px-4 py-10 text-center text-sm text-muted-foreground">
            {data.length === 0 ? 'No transactions yet. Tap + to add your first one.' : 'No transactions match these filters.'}
          </li>
        )}
      </ul>

      <div className="hidden border-t overflow-x-auto md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={visibleColumns} className="h-12">
                    <Skeleton className="h-6" />
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-sm py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={visibleColumns} className="h-24 text-center text-muted-foreground">
                  {data.length === 0 ? 'No transactions yet. Use "Add Transaction" to record your first one.' : 'No transactions match these filters.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-2 p-4 text-xs text-muted-foreground">
        <span>
          {total === 0 ? '0 results' : `${pageIndex * pageSize + 1}–${Math.min((pageIndex + 1) * pageSize, total)} of ${total}`}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-11 md:h-9" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" className="h-11 md:h-9" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}
