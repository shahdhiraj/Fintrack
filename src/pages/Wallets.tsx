
import { useMemo, useState } from 'react';
import Link from '@/components/link';
import { format } from 'date-fns';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Star,
  Trash2,
  Wallet as WalletIcon,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTransaction } from '@/context/transaction-context';
import { useDemoMode } from '@/hooks/use-demo-mode';
import { useTodayKey } from '@/hooks/use-now';
import { useToast } from '@/hooks/use-toast';
import { WalletDialog, TransferDialog, WALLET_GRADIENTS } from '@/components/wallets/wallet-dialogs';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { WALLET_TYPES, type Wallet } from '@/lib/types';
import { cn, formatMoney } from '@/lib/utils';

type Activity = {
  id: string;
  date: Date;
  label: string;
  sub: string;
  amount: number; // signed, from the selected wallet's point of view
  kind: 'income' | 'expense' | 'transfer';
  transferId?: string;
};

export default function WalletsPage() {
  const { wallets, walletBalances, transactions, transfers, preferences, updatePreferences, deleteWallet, deleteTransfer } = useTransaction();
  const demo = useDemoMode();
  const { toast } = useToast();
  const todayKey = useTodayKey();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const walletIds = useMemo(() => new Set(wallets.map((w) => w.id)), [wallets]);
  const selected = wallets.find((w) => w.id === selectedId) ?? wallets[0] ?? null;

  const summary = useMemo(() => {
    let assets = 0;
    let liabilities = 0;
    for (const w of wallets) {
      const b = walletBalances[w.id] ?? 0;
      if (b >= 0) assets += b;
      else liabilities += b;
    }
    const unassigned = transactions.filter((t) => !t.walletId || !walletIds.has(t.walletId)).length;
    return { assets, liabilities, net: assets + liabilities, unassigned };
  }, [wallets, walletBalances, transactions, walletIds]);

  // Money in/out per wallet for the current calendar month.
  const monthFlow = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const flow: Record<string, { in: number; out: number }> = {};
    for (const w of wallets) flow[w.id] = { in: 0, out: 0 };
    for (const t of transactions) {
      if (!t.walletId || !flow[t.walletId] || t.date.toDate() < start) continue;
      if (t.type === 'income') flow[t.walletId].in += t.amount;
      else flow[t.walletId].out += t.amount;
    }
    for (const tr of transfers) {
      if (tr.date.toDate() < start) continue;
      if (flow[tr.toWalletId]) flow[tr.toWalletId].in += tr.amount;
      if (flow[tr.fromWalletId]) flow[tr.fromWalletId].out += tr.amount;
    }
    return flow;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallets, transactions, transfers, todayKey]);

  const activity = useMemo<Activity[]>(() => {
    if (!selected) return [];
    const nameOf = (id: string) => wallets.find((w) => w.id === id)?.name ?? 'Deleted wallet';
    const rows: Activity[] = [];
    for (const t of transactions) {
      if (t.walletId !== selected.id) continue;
      rows.push({
        id: `tx-${t.id}`,
        date: t.date.toDate(),
        label: t.description,
        sub: t.category,
        amount: t.type === 'income' ? t.amount : -t.amount,
        kind: t.type,
      });
    }
    for (const tr of transfers) {
      if (tr.fromWalletId !== selected.id && tr.toWalletId !== selected.id) continue;
      const outgoing = tr.fromWalletId === selected.id;
      rows.push({
        id: `tr-${tr.id}`,
        date: tr.date.toDate(),
        label: outgoing ? `Transfer to ${nameOf(tr.toWalletId)}` : `Transfer from ${nameOf(tr.fromWalletId)}`,
        sub: tr.note || 'Transfer',
        amount: outgoing ? -tr.amount : tr.amount,
        kind: 'transfer',
        transferId: tr.id,
      });
    }
    return rows.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 25);
  }, [selected, transactions, transfers, wallets]);

  const setDefault = (w: Wallet) => {
    updatePreferences({ defaultWalletId: w.id });
    toast({ title: 'Default wallet set', description: `New transactions will go to ${w.name}.` });
  };

  const removeWallet = (w: Wallet) => {
    deleteWallet(w.id);
    if (selectedId === w.id) setSelectedId(null);
    toast({ title: 'Wallet deleted', description: `${w.name} was removed. Its transactions were kept as unassigned.` });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Wallets</h1>
          <p className="text-sm text-muted-foreground">Track every account, card and cash pocket, and move money between them.</p>
        </div>
        <div className="flex gap-2">
          <TransferDialog
            defaultFromId={selected?.id}
            trigger={
              <Button variant="outline" className="rounded-xl text-xs font-bold gap-1.5" disabled={wallets.length < 2}>
                <ArrowLeftRight className="w-4 h-4" /> Transfer
              </Button>
            }
          />
          <WalletDialog
            trigger={
              <Button className="rounded-xl chrome-green chrome-sheen text-white text-xs font-bold gap-1.5">
                <Plus className="w-4 h-4" /> Add Wallet
              </Button>
            }
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Net worth', value: formatMoney(summary.net), tone: summary.net < 0 ? 'text-rose-600' : 'text-foreground' },
          { label: 'Assets', value: formatMoney(summary.assets), tone: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Liabilities', value: formatMoney(summary.liabilities), tone: 'text-rose-600 dark:text-rose-400' },
          { label: 'Unassigned transactions', value: String(summary.unassigned), tone: 'text-foreground' },
        ].map((s) => (
          <Card key={s.label} className="rounded-2xl border-border/50">
            <CardContent className="p-4">
              <p className="text-xs font-bold text-muted-foreground">{s.label}</p>
              <p className={cn('mt-2 text-xl font-extrabold tracking-tight tabular-nums', s.tone)}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {wallets.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="py-14 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <WalletIcon className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold">No wallets yet</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Add your bank account, credit card or cash to see a live balance for each one.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <WalletDialog
                trigger={<Button className="rounded-xl chrome-green chrome-sheen text-white text-xs font-bold">Create your first wallet</Button>}
              />
              {!demo.isDemoActive && (
                <Button variant="outline" className="rounded-xl text-xs font-bold gap-1.5" onClick={demo.enable} disabled={demo.busy}>
                  <Sparkles className="w-4 h-4 text-emerald-600" /> Try demo data
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Wallet cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {wallets.map((w) => {
              const type = WALLET_TYPES.find((t) => t.value === w.type);
              const isDefault = preferences.defaultWalletId === w.id;
              const isSelected = selected?.id === w.id;
              const flow = monthFlow[w.id] ?? { in: 0, out: 0 };
              return (
                <div
                  key={w.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedId(w.id)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSelectedId(w.id))}
                  className={cn(
                    'relative rounded-2xl p-5 text-white bg-gradient-to-br shadow-sm cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500',
                    WALLET_GRADIENTS[w.color] ?? WALLET_GRADIENTS.emerald,
                    isSelected ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground/70 shadow-lg' : 'hover:shadow-md hover:-translate-y-0.5'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl" aria-hidden>{type?.emoji ?? '👛'}</span>
                      <div>
                        <p className="font-bold leading-tight">{w.name}</p>
                        <p className="text-[11px] text-white/80">{type?.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {isDefault && <Badge className="bg-white/20 hover:bg-white/20 text-white border-0 text-[10px]">Default</Badge>}
                      {w.isDemo && <Badge className="bg-white/20 hover:bg-white/20 text-white border-0 text-[10px]">Demo</Badge>}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-white hover:bg-white/20 hover:text-white"
                            aria-label={`Actions for ${w.name}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <WalletDialog
                            wallet={w}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-xs gap-2">
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </DropdownMenuItem>
                            }
                          />
                          <DropdownMenuItem disabled={isDefault} onSelect={() => setDefault(w)} className="text-xs gap-2">
                            <Star className="w-3.5 h-3.5" /> Set as default
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <ConfirmDialog
                            title={`Delete ${w.name}?`}
                            description={
                              <p>
                                The wallet is removed. Its transactions stay in your history as unassigned, so your income
                                and spending totals do not change.
                              </p>
                            }
                            onConfirm={() => removeWallet(w)}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-xs gap-2 text-rose-600 focus:text-rose-600">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </DropdownMenuItem>
                            }
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <p className="mt-6 text-[11px] uppercase tracking-wider text-white/75 font-semibold">Balance</p>
                  <p className="text-3xl font-extrabold tracking-tight tabular-nums">{formatMoney(walletBalances[w.id] ?? 0)}</p>

                  <div className="mt-4 flex gap-4 text-[11px] text-white/90">
                    <span className="flex items-center gap-1"><ArrowDownLeft className="w-3.5 h-3.5" /> In {formatMoney(flow.in)}</span>
                    <span className="flex items-center gap-1"><ArrowUpRight className="w-3.5 h-3.5" /> Out {formatMoney(flow.out)}</span>
                    <span className="ml-auto text-white/70">this month</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected wallet activity */}
          {selected && (
            <Card className="rounded-2xl border-border/50">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{selected.name} activity</CardTitle>
                  <CardDescription className="text-xs">
                    Starting balance {formatMoney(selected.openingBalance ?? 0)} · current {formatMoney(walletBalances[selected.id] ?? 0)}
                  </CardDescription>
                </div>
                <Button asChild variant="outline" size="sm" className="rounded-xl text-xs">
                  <Link href="/transactions">All transactions</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {activity.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No activity yet. Pick this wallet when adding a transaction, or make it your default.
                  </p>
                ) : (
                  <ul className="divide-y divide-border/50">
                    {activity.map((a) => (
                      <li key={a.id} className="flex items-center gap-3 py-2.5">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                            a.kind === 'transfer' ? 'bg-sky-500/10 text-sky-600' : a.amount >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                          )}
                        >
                          {a.kind === 'transfer' ? <ArrowLeftRight className="w-4 h-4" /> : a.amount >= 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{a.label}</p>
                          <p className="text-xs text-muted-foreground">{a.sub} · {format(a.date, 'MMM d, yyyy')}</p>
                        </div>
                        <p className={cn('text-sm font-bold tabular-nums', a.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground')}>
                          {a.amount >= 0 ? '+' : '−'}{formatMoney(Math.abs(a.amount))}
                        </p>
                        {a.transferId && (
                          <ConfirmDialog
                            title="Delete this transfer?"
                            description={<p>Both wallet balances will be recalculated without it.</p>}
                            onConfirm={() => {
                              deleteTransfer(a.transferId!);
                              toast({ title: 'Transfer deleted' });
                            }}
                            trigger={
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-rose-600" aria-label="Delete transfer">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            }
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
