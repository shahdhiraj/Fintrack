/** File export helpers shared by Settings and Reports. Browser-only. */
import { endOfMonth, format, startOfMonth } from 'date-fns';
import type { Transaction, Wallet } from '@/lib/types';
import type { Insight, MonthReport } from '@/lib/report-insights';
import { toCsv } from '@/lib/finance';
import { activeCurrency, formatMoney } from '@/lib/currency';

export function download(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const money = (n: number) => formatMoney(n);
const fixed = (n: number) => n.toFixed(2);

/**
 * File name built from dates. Current month: the export date, e.g. fintrack-report-2026-11-13.csv.
 * Past month: the dates it covers, e.g. fintrack-report-2026-10-01-to-2026-10-31.csv.
 */
export function reportFileName(r: MonthReport, kind: string, ext = '') {
  const day = 'yyyy-MM-dd';
  const dates = r.isCurrent
    ? format(new Date(), day)
    : `${format(startOfMonth(r.month), day)}-to-${format(endOfMonth(r.month), day)}`;
  return `fintrack-${kind}-${dates}${ext ? `.${ext}` : ''}`;
}

/** Totals plus one row per category: spent, limit, share and the change from last month. */
export function reportSummaryCsv(r: MonthReport, insights: Insight[]): string {
  const rows: unknown[][] = [
    ['FinTrack report', format(r.month, 'MMMM yyyy')],
    ['Currency', `${activeCurrency().name} (${activeCurrency().symbol})`],
    [],
    ['Metric', 'Value'],
    ['Income', fixed(r.income)],
    ['Expenses', fixed(r.expense)],
    ['Net', fixed(r.net)],
    ['Savings rate (%)', r.savingsRate === null ? '' : r.savingsRate.toFixed(1)],
    ['Previous month expenses', fixed(r.previousExpense)],
    ['Projected month-end expenses', r.projectedExpense === null ? '' : fixed(r.projectedExpense)],
    ['Transactions', r.count],
    [],
    ['Category', 'Spent', 'Limit', 'Remaining', 'Share of spending (%)', 'Previous month', 'Change'],
    ...r.categories.map((c) => [
      c.category,
      fixed(c.spent),
      fixed(c.limit),
      fixed(c.limit - c.spent),
      (c.share * 100).toFixed(1),
      fixed(c.previous),
      fixed(c.spent - c.previous),
    ]),
    [],
    ['Suggestion', 'Details'],
    ...insights.map((i) => [i.title, i.detail]),
  ];
  return toCsv(rows);
}

export function transactionsCsv(txns: Transaction[], wallets: Wallet[]): string {
  const walletName = (id?: string) => wallets.find((w) => w.id === id)?.name ?? '';
  return toCsv([
    ['Date', 'Description', 'Type', 'Category', 'Amount', 'Wallet'],
    ...[...txns]
      .sort((a, b) => a.date.toMillis() - b.date.toMillis())
      .map((t) => [
        format(t.date.toDate(), 'yyyy-MM-dd'),
        t.description,
        t.type,
        t.category,
        fixed(t.type === 'expense' ? -t.amount : t.amount),
        walletName(t.walletId),
      ]),
  ]);
}

export function reportJson(r: MonthReport, insights: Insight[], txns: Transaction[]): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      month: format(r.month, 'yyyy-MM'),
      totals: {
        income: r.income,
        expense: r.expense,
        net: r.net,
        savingsRate: r.savingsRate,
        previousExpense: r.previousExpense,
        projectedExpense: r.projectedExpense,
      },
      categories: r.categories,
      suggestions: insights.map(({ tone, title, detail }) => ({ tone, title, detail })),
      transactions: txns.map((t) => ({ ...t, date: t.date.toDate().toISOString() })),
    },
    null,
    2,
  );
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/**
 * Opens a print-ready report in a new tab and starts printing, so the browser's
 * "Save as PDF" produces the file. Returns false when a pop-up blocker stops it.
 */
export function printReport(r: MonthReport, insights: Insight[], txns: Transaction[]): boolean {
  const win = window.open('', '_blank');
  if (!win) return false;

  const heading = `FinTrack report, ${format(r.month, 'MMMM yyyy')}`;
  // The browser uses the page title as the default "Save as PDF" file name.
  const title = reportFileName(r, 'report');
  const toneLabel = { alert: 'Act now', warn: 'Watch', tip: 'Idea', good: 'Going well' } as const;
  const stat = (label: string, value: string) => `<div class="stat"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font: 13px/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif; color: #14201a; margin: 32px; }
  h1 { font-size: 22px; margin: 0; }
  h2 { font-size: 15px; margin: 28px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #0d8a5f; }
  .muted { color: #5b6b63; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 18px; }
  .stat { border: 1px solid #d6e2dc; border-radius: 10px; padding: 10px 12px; }
  .stat span { display: block; font-size: 11px; color: #5b6b63; }
  .stat strong { font-size: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e3ebe7; }
  th { font-size: 11px; color: #5b6b63; font-weight: 600; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  .over { color: #c0392b; font-weight: 600; }
  .tip { border-left: 3px solid #0d8a5f; padding: 4px 0 4px 10px; margin-bottom: 10px; }
  .tip.alert { border-color: #c0392b; } .tip.warn { border-color: #d68910; }
  .tip b { display: block; } .tag { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #5b6b63; }
  footer { margin-top: 28px; font-size: 11px; color: #5b6b63; }
  @media print { body { margin: 0; } h2 { break-after: avoid; } tr { break-inside: avoid; } }
</style></head><body>
<h1>${esc(heading)}</h1>
<p class="muted">${r.count} transactions. Generated ${esc(format(new Date(), 'd MMM yyyy, HH:mm'))}.</p>
<div class="stats">
  ${stat('Income', money(r.income))}
  ${stat('Expenses', money(r.expense))}
  ${stat('Net', money(r.net))}
  ${stat('Savings rate', r.savingsRate === null ? 'n/a' : `${r.savingsRate.toFixed(0)}%`)}
</div>

<h2>Suggestions</h2>
${insights.map((i) => `<div class="tip ${i.tone}"><span class="tag">${toneLabel[i.tone]}</span><b>${esc(i.title)}</b>${esc(i.detail)}</div>`).join('')}

<h2>Spending by category</h2>
<table><thead><tr><th>Category</th><th class="num">Spent</th><th class="num">Limit</th><th class="num">Share</th><th class="num">Last month</th></tr></thead><tbody>
${r.categories
  .map(
    (c) =>
      `<tr><td>${esc(c.category)}</td><td class="num${c.spent > c.limit ? ' over' : ''}">${money(c.spent)}</td><td class="num">${money(c.limit)}</td><td class="num">${(c.share * 100).toFixed(0)}%</td><td class="num">${money(c.previous)}</td></tr>`,
  )
  .join('')}
</tbody></table>

<h2>Transactions</h2>
<table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th class="num">Amount</th></tr></thead><tbody>
${[...txns]
  .sort((a, b) => a.date.toMillis() - b.date.toMillis())
  .map(
    (t) =>
      `<tr><td>${esc(format(t.date.toDate(), 'd MMM'))}</td><td>${esc(t.description)}</td><td>${esc(t.category)}</td><td class="num">${t.type === 'expense' ? '-' : '+'}${money(t.amount)}</td></tr>`,
  )
  .join('')}
</tbody></table>
<footer>Suggestions are calculated on your device from your own transactions and budget limits.</footer>
<script>window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 150); });</script>
</body></html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}
