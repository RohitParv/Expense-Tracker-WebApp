"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import type { Expense } from "@/lib/supabase/types";
import AddExpenseForm from "@/components/AddExpenseForm";

const CATEGORY_LABEL: Record<Expense["category"], string> = {
  credit_card: "Credit Card",
  regular: "Regular",
};

const CATEGORY_COLOR: Record<Expense["category"], string> = {
  credit_card: "#f97316",
  regular: "#3b82f6",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function sortExpenses(expenses: Expense[]) {
  return [...expenses].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.created_at < b.created_at ? 1 : -1;
  });
}

export default function Dashboard({
  userId,
  initialExpenses,
}: {
  userId: string;
  initialExpenses: Expense[];
}) {
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    sortExpenses(initialExpenses)
  );

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`expenses-changes-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setExpenses((current) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as Expense;
              if (current.some((e) => e.id === row.id)) return current;
              return sortExpenses([...current, row]);
            }
            if (payload.eventType === "UPDATE") {
              const row = payload.new as Expense;
              return sortExpenses(
                current.map((e) => (e.id === row.id ? row : e))
              );
            }
            if (payload.eventType === "DELETE") {
              const oldRow = payload.old as Partial<Expense>;
              return current.filter((e) => e.id !== oldRow.id);
            }
            return current;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const totals = useMemo(() => {
    const byCategory: Record<Expense["category"], number> = {
      credit_card: 0,
      regular: 0,
    };
    let total = 0;
    for (const expense of expenses) {
      byCategory[expense.category] += Number(expense.amount);
      total += Number(expense.amount);
    }
    return { total, byCategory };
  }, [expenses]);

  const chartData = useMemo(
    () =>
      (Object.keys(totals.byCategory) as Expense["category"][])
        .filter((category) => totals.byCategory[category] > 0)
        .map((category) => ({
          category,
          name: CATEGORY_LABEL[category],
          value: totals.byCategory[category],
        })),
    [totals]
  );

  async function handleDelete(id: string) {
    const supabase = createClient();
    setExpenses((current) => current.filter((e) => e.id !== id));
    await supabase.from("expenses").delete().eq("id", id);
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Total spend
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {formatCurrency(totals.total)}
          </p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Credit Card
          </p>
          <p className="mt-1 text-2xl font-semibold text-orange-500">
            {formatCurrency(totals.byCategory.credit_card)}
          </p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Regular
          </p>
          <p className="mt-1 text-2xl font-semibold text-blue-500">
            {formatCurrency(totals.byCategory.regular)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AddExpenseForm userId={userId} />

        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Spend by category
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
                    paddingAngle={2}
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.category}
                        fill={CATEGORY_COLOR[entry.category]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
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
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Recent expenses
        </h2>
        {expenses.length === 0 ? (
          <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No expenses yet. Add your first one above.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
            {expenses.slice(0, 20).map((expense) => (
              <li
                key={expense.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: CATEGORY_COLOR[expense.category],
                      }}
                    />
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {expense.description || CATEGORY_LABEL[expense.category]}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {expense.date} &middot; {CATEGORY_LABEL[expense.category]}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="shrink-0 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {formatCurrency(Number(expense.amount))}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(expense.id)}
                    aria-label="Delete expense"
                    className="shrink-0 text-xs text-zinc-400 hover:text-red-500"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
