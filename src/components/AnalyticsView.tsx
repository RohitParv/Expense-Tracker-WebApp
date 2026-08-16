"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Expense } from "@/lib/supabase/types";
import {
  CATEGORY_COLOR,
  CATEGORY_LABEL,
  SPENDING_CATEGORY_COLOR,
  SPENDING_CATEGORY_LABEL,
  SPENDING_CHART_INDIVIDUAL_CATEGORIES,
  SPENDING_CHART_OTHER_CATEGORIES,
  formatCurrency,
} from "@/lib/expense-format";

export default function AnalyticsView({ expenses }: { expenses: Expense[] }) {
  const chartData = useMemo(() => {
    const byCategory: Record<Expense["category"], number> = {
      credit_card: 0,
      debit_card: 0,
    };
    for (const expense of expenses) {
      byCategory[expense.category] += Number(expense.amount);
    }
    return (Object.keys(byCategory) as Expense["category"][])
      .filter((category) => byCategory[category] > 0)
      .map((category) => ({
        category,
        name: CATEGORY_LABEL[category],
        value: byCategory[category],
      }));
  }, [expenses]);

  const spendingChartData = useMemo(() => {
    const totals: Partial<Record<Expense["spending_category"], number>> = {};
    for (const expense of expenses) {
      totals[expense.spending_category] = (totals[expense.spending_category] ?? 0) + Number(expense.amount);
    }
    const data = SPENDING_CHART_INDIVIDUAL_CATEGORIES.filter((category) => (totals[category] ?? 0) > 0).map(
      (category) => ({
        key: category as string,
        name: SPENDING_CATEGORY_LABEL[category],
        value: totals[category]!,
        color: SPENDING_CATEGORY_COLOR[category],
      })
    );
    const otherTotal = SPENDING_CHART_OTHER_CATEGORIES.reduce((sum, category) => sum + (totals[category] ?? 0), 0);
    if (otherTotal > 0) {
      data.push({ key: "other", name: "Other", value: otherTotal, color: SPENDING_CATEGORY_COLOR.other });
    }
    return data;
  }, [expenses]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Credit vs. Debit
          </h2>
          {chartData.length === 0 ? (
            <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No expenses yet.
            </p>
          ) : (
            <div>
              <div className="mx-auto h-64 max-w-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      cornerRadius={6}
                    >
                      {chartData.map((entry) => (
                        <Cell
                          key={entry.category}
                          fill={CATEGORY_COLOR[entry.category]}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        borderRadius: 12,
                        border: "none",
                        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.25)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                {chartData.map((entry) => (
                  <span key={entry.category} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLOR[entry.category] }}
                    />
                    {entry.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Spending by Category
          </h2>
          {spendingChartData.length === 0 ? (
            <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No expenses yet.
            </p>
          ) : (
            <div>
              <div className="mx-auto h-64 max-w-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      cornerRadius={6}
                    >
                      {spendingChartData.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        borderRadius: 12,
                        border: "none",
                        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.25)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                {spendingChartData.map((entry) => (
                  <span key={entry.key} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    {entry.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
        More analytics coming soon.
      </p>
    </div>
  );
}
