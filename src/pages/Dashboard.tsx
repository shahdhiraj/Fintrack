import { lazy, Suspense, type ReactNode } from 'react';
import { DashboardStatCards } from '@/components/dashboard/dashboard-stat-cards';
import { EarningOverviewChart } from '@/components/dashboard/earning-overview-chart';
import { SpendingBreakdownCard } from '@/components/dashboard/spending-breakdown-card';
import { UpcomingBillsCard } from '@/components/dashboard/upcoming-bills-card';
import { FinloTransactionsTable } from '@/components/dashboard/finlo-transactions-table';
import { Skeleton } from '@/components/ui/skeleton';

// Below-the-fold widgets load in a separate chunk so the top of the page paints first.
const CashFlowChart = lazy(() => import('@/components/dashboard/cash-flow-chart').then((m) => ({ default: m.CashFlowChart })));
const AddTransactionTabs = lazy(() => import('@/components/dashboard/add-transaction-tabs').then((m) => ({ default: m.AddTransactionTabs })));
const AiBudgetAssistant = lazy(() => import('@/components/dashboard/ai-budget-assistant').then((m) => ({ default: m.AiBudgetAssistant })));

function Deferred({ height, children }: { height: string; children: ReactNode }) {
  return <Suspense fallback={<Skeleton className={`w-full ${height} rounded-2xl`} />}>{children}</Suspense>;
}

export default function DashboardPage() {
  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your month at a glance.</p>
      </div>
      <DashboardStatCards />

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <EarningOverviewChart />
        </div>
        <div className="lg:col-span-3">
          <SpendingBreakdownCard />
        </div>
      </div>

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <Deferred height="h-[360px]">
            <CashFlowChart />
          </Deferred>
        </div>
        <div className="lg:col-span-3">
          <UpcomingBillsCard />
        </div>
      </div>

      <FinloTransactionsTable />

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <Deferred height="h-[480px]">
            <AddTransactionTabs />
          </Deferred>
        </div>
        <div className="lg:col-span-3">
          <Deferred height="h-[480px]">
            <AiBudgetAssistant />
          </Deferred>
        </div>
      </div>
    </div>
  );
}
