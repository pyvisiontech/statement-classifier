'use client';

import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ScrollArea } from '@/components/ui/scroll-area';

type CategoryGroup = { name: string; value: number; percentage: number };

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

const CHART_COLORS = [
  '#FF6B6B',
  '#F7B801',
  '#845EC2',
  '#2C73D2',
  '#00C9A7',
  '#FF9671',
  '#008F7A',
  '#C34A36',
  '#4D8076',
];

type PieChartViewProps = {
  expenseSummary: { total: number; groups: CategoryGroup[] };
  incomeSummary: { total: number; groups: CategoryGroup[] };
  transactionsByAmount: Array<{
    id: string;
    tx_amount: number | null;
    currentEditName: string;
  }>;
  unifiedCategorySummary: { total: number; groups: CategoryGroup[] };
  loading: boolean;
  hasError: boolean;
  hasChartData: boolean;
  errorMessage?: string;
};

export default function PieChartView({
  expenseSummary,
  incomeSummary,
  transactionsByAmount,
  unifiedCategorySummary,
  loading,
  hasError,
  hasChartData,
  errorMessage,
}: PieChartViewProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        Preparing chart…
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="p-6 text-center text-sm text-red-600">
        {errorMessage || 'Something went wrong.'}
      </div>
    );
  }

  if (!hasChartData) {
    return (
      <div className="flex h-full items-center justify-center rounded-md border border-dashed p-6 text-center text-sm text-slate-500">
        Not enough categorized transactions to render a chart yet.
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col gap-6 overflow-y-auto pb-4 lg:flex-row lg:gap-4 lg:overflow-hidden lg:pb-0">
       {/* Mobile: All sections stack vertically. Desktop: Charts side by side, Transaction categories on right  */}
      <div className="flex min-h-0 flex-col gap-6 overflow-visible lg:flex-row lg:flex-1 lg:gap-4 lg:overflow-hidden lg:pr-80">
      
         {/* Expense Chart with Categories */}
        <div className="flex w-full flex-shrink-0 flex-col gap-3 overflow-visible rounded-lg border bg-slate-50 p-3 lg:flex-1 lg:border-0 lg:bg-transparent lg:p-0 lg:gap-4">
          <h3 className="flex-shrink-0 text-center text-sm font-semibold text-slate-700 lg:text-base">
            Expense Overview
          </h3>
          {expenseSummary.groups.length > 0 ? (
            <>
              <div className="h-[180px] flex-shrink-0 lg:flex-1 lg:min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseSummary.groups}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={isMobile ? 35 : 80}
                      outerRadius={isMobile ? 55 : 120}
                      paddingAngle={2}
                    >
                      {expenseSummary.groups.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name) => [
                        currencyFormatter.format(Number(value)),
                        name,
                      ]}
                    />
                    <text
                      x="50%"
                      y="50%"
                      
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-slate-700 text-sm font-semibold lg:text-xl"
                    >
                      Expenses
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex w-full flex-shrink-0 flex-col space-y-2 rounded-md border bg-white p-2.5 lg:p-3">
                <p className="flex-shrink-0 text-xs font-bold text-slate-600">
                  Expense categories
                </p>
                <div className="w-full flex-shrink-0">
                  <ScrollArea className="h-36 w-full lg:h-20">
                    <div className="space-y-1.5 pr-2">
                      {[...expenseSummary.groups]
                        .sort((a, b) => b.value - a.value)
                        .map((group, sortedIdx) => {
                          const originalIdx = expenseSummary.groups.findIndex(
                            (g) => g.name === group.name
                          );
                          return (
                            <div
                              key={group.name}
                              className="flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                                  style={{
                                    backgroundColor:
                                      CHART_COLORS[originalIdx % CHART_COLORS.length],
                                  }}
                                />
                                <span className="truncate">{group.name}</span>
                              </div>
                              <span className="font-medium whitespace-nowrap ml-2 text-red-600">
                                {currencyFormatter.format(group.value)} (
                                {group.percentage.toFixed(1)}%)
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-md border border-dashed p-4 text-center text-xs text-slate-500">
              No expense transactions
            </div>
          )}
        </div>

         {/* Income Chart with Categories */}
        <div className="flex w-full flex-shrink-0 flex-col gap-3 rounded-lg border bg-slate-50 p-3 lg:flex-1 lg:border-0 lg:bg-transparent lg:p-0 lg:gap-4">
          <h3 className="text-center text-sm font-semibold text-slate-700 lg:text-base">
            Income Overview
          </h3>
          {incomeSummary.groups.length > 0 ? (
            <>
              <div className="h-[180px] flex-shrink-0 lg:flex-1 lg:min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeSummary.groups}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={isMobile ? 35 : 80}
                      outerRadius={isMobile ? 55 : 120}
                      paddingAngle={2}
                    >
                      {incomeSummary.groups.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name) => [
                        currencyFormatter.format(Number(value)),
                        name,
                      ]}
                    />
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-slate-700 text-sm font-semibold lg:text-xl"
                    >
                      Income
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex w-full flex-shrink-0 flex-col space-y-2 rounded-md border bg-white p-2.5 lg:p-3">
                <p className="flex-shrink-0 text-xs font-bold text-slate-600">
                  Income categories
                </p>
                <div className="w-full flex-shrink-0">
                  <ScrollArea className="h-36 w-full lg:h-20">
                    <div className="space-y-1.5 pr-2">
                      {[...incomeSummary.groups]
                        .sort((a, b) => b.value - a.value)
                        .map((group, sortedIdx) => {
                          const originalIdx = incomeSummary.groups.findIndex(
                            (g) => g.name === group.name
                          );
                          return (
                            <div
                              key={group.name}
                              className="flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                                  style={{
                                    backgroundColor:
                                      CHART_COLORS[originalIdx % CHART_COLORS.length],
                                  }}
                                />
                                <span className="truncate">{group.name}</span>
                              </div>
                              <span className="font-medium whitespace-nowrap ml-2 text-emerald-600">
                                {currencyFormatter.format(group.value)} (
                                {group.percentage.toFixed(1)}%)
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-md border border-dashed p-4 text-center text-xs text-slate-500">
              No income transactions
            </div>
          )}
        </div>
      </div>

        {/* Transaction Categories - Mobile: at bottom after all charts, Desktop: on right. */}
      <div className="order-last flex w-full flex-shrink-0 flex-col rounded-lg border bg-slate-50 p-3 lg:order-none lg:absolute lg:right-0 lg:top-0 lg:h-full lg:w-80 lg:border-0 lg:bg-transparent lg:p-0">
        <div className="mb-3 flex-shrink-0 lg:mb-2">
          <p className="text-sm font-semibold text-slate-700">
            Transaction categories
          </p>
        </div>
        <ScrollArea className="h-64 rounded-md border bg-white lg:flex-1 lg:min-h-0">
          <div className="divide-y p-2">
            {transactionsByAmount.length > 0 ? (
              transactionsByAmount.map((txn) => {
                const amount = Number(txn.tx_amount) || 0;
                const isExpense = amount < 0;
                const absAmount = Math.abs(amount);
                const categoryName = txn.currentEditName || 'Uncategorized';
                // Find color for this category
                const categoryIndex = unifiedCategorySummary.groups.findIndex(
                  (g) => g.name === categoryName
                );
                const categoryColor =
                
                  categoryIndex >= 0
                    ? CHART_COLORS[categoryIndex % CHART_COLORS.length]
                    : CHART_COLORS[0];

                return (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                      
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: categoryColor,
                        }}
                      />
                      <span className="truncate text-xs font-medium text-slate-800">
                        {categoryName}
                      </span>
                    </div>
                    <span
                      className={`ml-2 whitespace-nowrap text-xs font-semibold ${
                        isExpense ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {isExpense ? '-' : '+'}
                      {currencyFormatter.format(absAmount)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">
                No transactions to display
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

