"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CreditCard, Trash2, TrendingUp, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Expense } from "@/lib/supabase/types";
import AddExpenseForm from "@/components/AddExpenseForm";
import ExpenseFilter from "@/components/ExpenseFilter";

const CATEGORY_LABEL: Record<Expense["category"], string> = {
  credit_card: "Credit Card",
  debit_card: "Debit Card",
};

const CATEGORY_COLOR: Record<Expense["category"], string> = {
  credit_card: "#fb923c",
  debit_card: "#38bdf8",
};

const CATEGORY_ICON: Record<Expense["category"], typeof CreditCard> = {
  credit_card: CreditCard,
  debit_card: Wallet,
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
      debit_card: 0,
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
        <div className="animate-fade-in-up relative overflow-hidden rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Total spend
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {formatCurrency(totals.total)}
          </p>
        </div>

        <div className="animate-fade-in-up relative overflow-hidden rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Credit Card
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {formatCurrency(totals.byCategory.credit_card)}
          </p>
        </div>

        <div className="animate-fade-in-up relative overflow-hidden rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Debit Card
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-500 dark:bg-sky-500/10 dark:text-sky-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {formatCurrency(totals.byCategory.debit_card)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AddExpenseForm userId={userId} />

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
                      boxShadow:
                        "0 10px 30px -10px rgba(0,0,0,0.25)",
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
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Recent expenses
        </h2>
        {expenses.length === 0 ? (
          <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No expenses yet. Add your first one above.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
            {expenses.slice(0, 20).map((expense) => {
              const Icon = CATEGORY_ICON[expense.category];
              return (
                <li
                  key={expense.id}
                  className="group flex items-center justify-between gap-3 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: `${CATEGORY_COLOR[expense.category]}1a`,
                        color: CATEGORY_COLOR[expense.category],
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {expense.description || CATEGORY_LABEL[expense.category]}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {expense.date} &middot; {CATEGORY_LABEL[expense.category]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="shrink-0 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {formatCurrency(Number(expense.amount))}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(expense.id)}
                      aria-label="Delete expense"
                      className="shrink-0 rounded-lg p-1.5 text-zinc-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 focus-visible:opacity-100 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ExpenseFilter expenses={expenses} />
    </div>
  );
}
