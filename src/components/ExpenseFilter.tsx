"use client";

import { useMemo, useState } from "react";
import type { Expense } from "@/lib/supabase/types";

const CATEGORY_LABEL: Record<Expense["category"], string> = {
  credit_card: "Credit Card",
  debit_card: "Debit Card",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default function ExpenseFilter({ expenses }: { expenses: Expense[] }) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filtered = useMemo(() => {
    return expenses
      .filter(
        (expense) =>
          (!fromDate || expense.date >= fromDate) &&
          (!toDate || expense.date <= toDate)
      )
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [expenses, fromDate, toDate]);

  const hasRange = Boolean(fromDate || toDate);

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Filter expenses by date
      </h2>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="fromDate"
            className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
          >
            From
          </label>
          <input
            id="fromDate"
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="toDate"
            className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
          >
            To
          </label>
          <input
            id="toDate"
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>

        {hasRange && (
          <button
            type="button"
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
            className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Clear
          </button>
        )}
      </div>

      {!hasRange ? (
        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Select a from and/or to date to see matching expenses.
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No expenses found in this range.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <th className="py-2 pr-3 font-medium">S.No</th>
                <th className="py-2 pr-3 font-medium">Amount</th>
                <th className="py-2 pr-3 font-medium">Date</th>
                <th className="py-2 pr-3 font-medium">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map((expense, index) => (
                <tr key={expense.id} className="text-zinc-900 dark:text-zinc-50">
                  <td className="py-2 pr-3 text-zinc-500 dark:text-zinc-400">
                    {index + 1}
                  </td>
                  <td className="py-2 pr-3 font-medium">
                    {formatCurrency(Number(expense.amount))}
                  </td>
                  <td className="py-2 pr-3 text-zinc-600 dark:text-zinc-300">
                    {expense.date}
                  </td>
                  <td className="py-2 pr-3 text-zinc-600 dark:text-zinc-300">
                    {CATEGORY_LABEL[expense.category]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
