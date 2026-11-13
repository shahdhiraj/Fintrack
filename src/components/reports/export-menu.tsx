import { Braces, ChevronDown, Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { download, printReport, reportFileName, reportJson, reportSummaryCsv, transactionsCsv } from '@/lib/export';
import type { Insight, MonthReport } from '@/lib/report-insights';
import type { Transaction, Wallet } from '@/lib/types';

const CSV = 'text/csv;charset=utf-8';

export function ExportMenu({
  report,
  insights,
  transactions,
  wallets,
}: {
  report: MonthReport;
  insights: Insight[];
  transactions: Transaction[];
  wallets: Wallet[];
}) {
  const { toast } = useToast();
  const empty = report.count === 0;

  const done = (title: string, description: string) => toast({ title, description });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg active:scale-[0.98]">
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Export
          <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">This month's report</DropdownMenuLabel>
        <DropdownMenuItem
          disabled={empty}
          onSelect={() => {
            if (!printReport(report, insights, transactions)) {
              toast({ variant: 'destructive', title: 'Pop-up blocked', description: 'Allow pop-ups for this site, then try again.' });
            }
          }}
        >
          <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
          <div>
            <p className="text-sm">PDF or print</p>
            <p className="text-[11px] text-muted-foreground">Choose "Save as PDF" in the print window</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={empty}
          onSelect={() => {
            download(reportFileName(report, 'report', 'csv'), reportSummaryCsv(report, insights), CSV);
            done('Report exported', 'Totals, categories and suggestions saved as CSV.');
          }}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" aria-hidden="true" />
          <div>
            <p className="text-sm">Summary (CSV)</p>
            <p className="text-[11px] text-muted-foreground">Totals, categories, suggestions</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={empty}
          onSelect={() => {
            download(reportFileName(report, 'transactions', 'csv'), transactionsCsv(transactions, wallets), CSV);
            done('Transactions exported', `${transactions.length} transactions saved as CSV.`);
          }}
        >
          <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
          <div>
            <p className="text-sm">Transactions (CSV)</p>
            <p className="text-[11px] text-muted-foreground">Opens in Excel or Google Sheets</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={empty}
          onSelect={() => {
            download(reportFileName(report, 'report', 'json'), reportJson(report, insights, transactions), 'application/json');
            done('Report exported', 'Everything in this report saved as JSON.');
          }}
        >
          <Braces className="mr-2 h-4 w-4" aria-hidden="true" />
          <div>
            <p className="text-sm">Full report (JSON)</p>
            <p className="text-[11px] text-muted-foreground">For other apps or your own records</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
