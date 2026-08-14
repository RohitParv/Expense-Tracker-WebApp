"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Expense } from "@/lib/supabase/types";
import { CATEGORY_COLOR, CATEGORY_LABEL, formatCurrency } from "@/lib/expense-format";

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

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Credit vs. Debit
        </h2>
        {chartData.length === 0 ? (
          <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No expenses yet.
          </p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
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
            <div className="mt-2 flex justify-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
              {chartData.map((entry) => (
                <span key={entry.category} className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLOR[entry.category] }}
                  />
                  {entry.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
        More analytics coming soon.
      </p>
    </div>
  );
}
