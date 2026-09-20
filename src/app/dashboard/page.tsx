'use client';

import { DashboardStatCards } from '@/components/dashboard/dashboard-stat-cards';
import { EarningOverviewChart } from '@/components/dashboard/earning-overview-chart';
import { SpendingBreakdownCard } from '@/components/dashboard/spending-breakdown-card';
import { CashFlowChart } from '@/components/dashboard/cash-flow-chart';
import { UpcomingBillsCard } from '@/components/dashboard/upcoming-bills-card';
import { FinloTransactionsTable } from '@/components/dashboard/finlo-transactions-table';
import { AddTransactionTabs } from '@/components/dashboard/add-transaction-tabs';
import { AiBudgetAssistant } from '@/components/dashboard/ai-budget-assistant';

export default function DashboardPage() {
  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Row 0: Top Summary Stat Cards */}
      <DashboardStatCards />

      {/* Row 1: Earning Overview + Spending Overview */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <EarningOverviewChart />
        </div>
        <div className="lg:col-span-3">
          <SpendingBreakdownCard />
        </div>
      </div>

      {/* Row 2: Cash Flow + Upcoming Bills */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <CashFlowChart />
        </div>
        <div className="lg:col-span-3">
          <UpcomingBillsCard />
        </div>
      </div>

      {/* Row 3: Recent Transactions Table */}
      <div>
        <FinloTransactionsTable />
      </div>

      {/* Row 4: Quick Actions & AI Advisor */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <AddTransactionTabs />
        </div>
        <div className="lg:col-span-3">
          <AiBudgetAssistant />
        </div>
      </div>
    </div>
  );
}
