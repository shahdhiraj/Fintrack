import { useMemo, useState } from 'react';
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRight, ArrowUpRight, LineChart as LineIcon, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTodayKey } from '@/hooks/use-now';
import { formatMoney, formatMoneyCompact } from '@/lib/currency';
import { buildTrends } from '@/lib/trends';
import type { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';

const RANGES = [6, 12] as const;
const COLORS = { income: 'hsl(var(--chart-1))', expense: 'hsl(var(--chart-5))', net: 'hsl(var(--chart-4))' };

function Change({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-muted-foreground">New</span>;
  const flat = Math.abs(value) < 5;
  const Icon = flat ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
        flat ? 'bg-muted text-muted-foreground' : value > 0 ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      )}
      title="Latest month against the average of earlier months"
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {flat ? 'Steady' : `${value > 0 ? '+' : ''}${Math.round(value)}%`}
    </span>
  );
}

/** Spending and income across several months, with each category's direction of travel. */
export function TrendsSection({ transactions }: { transactions: Transaction[] }) {
  const [months, setMonths] = useState<(typeof RANGES)[number]>(6);
  const todayKey = useTodayKey();
  const trends = useMemo(
    () => buildTrends(transactions.map((t) => ({ amount: t.amount, type: t.type, category: t.category, date: t.date.toDate() })), months),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions, months, todayKey],
  );
  const { totals } = trends;

  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <LineIcon className="h-4 w-4 text-primary" aria-hidden="true" /> Trends
          </CardTitle>
          <p className="text-xs text-muted-foreground">How your money moved over the last {months} months.</p>
        </div>
        <div role="radiogroup" aria-label="Period" className="grid w-full grid-cols-2 gap-1 rounded-xl bg-muted p-1 sm:w-auto">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={months === r}
              onClick={() => setMonths(r)}
              className={cn('min-h-9 rounded-lg px-3 text-xs font-semibold transition-colors', months === r ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground')}
            >
              {r} months
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {trends.activeMonths === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No transactions in this period yet. Trends appear once you have a month or two of entries.</p>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: 'Average monthly spending', value: formatMoney(totals.averageExpense), hint: `Across ${trends.activeMonths} active month${trends.activeMonths === 1 ? '' : 's'}` },
                { label: 'Average monthly income', value: formatMoney(totals.averageIncome), hint: `${formatMoney(totals.income)} in total` },
                { label: 'Savings rate', value: totals.savingsRate === null ? 'n/a' : `${Math.round(totals.savingsRate)}%`, hint: `${totals.net < 0 ? '−' : ''}${formatMoney(Math.abs(totals.net))} kept` },
                {
                  label: 'Best month',
                  value: trends.bestMonth?.longLabel ?? 'n/a',
                  hint: trends.highestSpend ? `Highest spending: ${trends.highestSpend.longLabel}` : '',
                },
              ].map((s) => (
                <div key={s.label} className="min-w-0 rounded-xl bg-muted/40 p-3">
                  <dt className="text-xs text-muted-foreground">{s.label}</dt>
                  <dd className="mt-1 break-words text-base font-extrabold tabular-nums">{s.value}</dd>
                  <dd className="mt-0.5 text-[11px] text-muted-foreground">{s.hint}</dd>
                </div>
              ))}
            </dl>

            <figure>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trends.months} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} width={64} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatMoneyCompact(Number(v))} />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const m = trends.months.find((x) => x.label === label);
                        return (
                          <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                            <p className="mb-1 font-semibold">{m?.longLabel ?? label}</p>
                            <p className="tabular-nums" style={{ color: COLORS.income }}>Income {formatMoney(m?.income ?? 0)}</p>
                            <p className="tabular-nums" style={{ color: COLORS.expense }}>Spending {formatMoney(m?.expense ?? 0)}</p>
                            <p className="font-semibold tabular-nums">Kept {formatMoney(m?.net ?? 0)}{m?.savingsRate != null ? ` (${Math.round(m.savingsRate)}%)` : ''}</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="income" fill={COLORS.income} radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="expense" fill={COLORS.expense} radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Line type="monotone" dataKey="net" stroke={COLORS.net} strokeWidth={2.5} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <figcaption className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.income }} />Income</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.expense }} />Spending</span>
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded" style={{ background: COLORS.net }} />Kept (income minus spending)</span>
              </figcaption>
            </figure>

            {trends.categories.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-bold">Spending by category</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <caption className="sr-only">Each category's spending per month, total and recent change</caption>
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground">
                        <th className="pb-2 font-medium">Category</th>
                        <th className="pb-2 font-medium">Per month</th>
                        <th className="pb-2 text-right font-medium">Average</th>
                        <th className="pb-2 text-right font-medium">Total</th>
                        <th className="pb-2 text-right font-medium">Latest</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {trends.categories.slice(0, 8).map((c) => {
                        const max = Math.max(...c.values, 1);
                        return (
                          <tr key={c.category}>
                            <td className="py-2.5 pr-3 font-medium">{c.category}</td>
                            <td className="py-2.5 pr-3">
                              <div className="flex h-7 items-end gap-0.5" aria-label={c.values.map((v, i) => `${trends.months[i].label} ${formatMoney(v)}`).join(', ')}>
                                {c.values.map((v, i) => (
                                  <span
                                    key={i}
                                    title={`${trends.months[i].longLabel}: ${formatMoney(v)}`}
                                    className={cn('w-2.5 rounded-sm', i === c.values.length - 1 ? 'bg-primary' : 'bg-primary/35')}
                                    style={{ height: `${Math.max(v > 0 ? 8 : 2, (v / max) * 100)}%` }}
                                  />
                                ))}
                              </div>
                            </td>
                            <td className="py-2.5 text-right tabular-nums text-muted-foreground">{formatMoney(c.average)}</td>
                            <td className="py-2.5 text-right font-semibold tabular-nums">{formatMoney(c.total)}</td>
                            <td className="py-2.5 pl-3 text-right"><Change value={c.change} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
