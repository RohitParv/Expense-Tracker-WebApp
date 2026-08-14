"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import type { Expense } from "@/lib/supabase/types";
import {
  CATEGORY_COLOR,
  CATEGORY_ICON,
  CATEGORY_LABEL,
  SPENDING_CATEGORY_LABEL,
  formatCurrency,
} from "@/lib/expense-format";
import DateRangePicker, { type DateRange } from "@/components/DateRangePicker";

export default function ExpenseHistory({
  expenses,
  onDelete,
}: {
  expenses: Expense[];
  onDelete: (id: string) => void;
}) {
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const isFiltering = Boolean(range.from || range.to);

  const filtered = useMemo(() => {
    if (!isFiltering) return [];
    return expenses
      .filter(
        (expense) =>
          (!range.from || expense.date >= range.from) &&
          (!range.to || expense.date <= range.to)
      )
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [expenses, range, isFiltering]);

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {isFiltering ? "Filtered expenses" : "Recent expenses"}
        </h2>
        <DateRangePicker from={range.from} to={range.to} onChange={setRange} />
      </div>

      {isFiltering ? (
        filtered.length === 0 ? (
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
                  <th className="py-2 pr-3 font-medium">Payment Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filtered.map((expense, index) => (
                  <tr key={expense.id} className="text-zinc-900 dark:text-zinc-50">
                    <td className="py-2 pr-3 text-zinc-500 dark:text-zinc-400">{index + 1}</td>
                    <td className="py-2 pr-3 font-medium">{formatCurrency(Number(expense.amount))}</td>
                    <td className="py-2 pr-3 text-zinc-600 dark:text-zinc-300">{expense.date}</td>
                    <td className="py-2 pr-3 text-zinc-600 dark:text-zinc-300">
                      {SPENDING_CATEGORY_LABEL[expense.spending_category]}
                    </td>
                    <td className="py-2 pr-3 text-zinc-600 dark:text-zinc-300">
                      {CATEGORY_LABEL[expense.category]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : expenses.length === 0 ? (
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
                      {expense.description || SPENDING_CATEGORY_LABEL[expense.spending_category]}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {expense.date} &middot; {SPENDING_CATEGORY_LABEL[expense.spending_category]}{" "}
                      &middot; {CATEGORY_LABEL[expense.category]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="shrink-0 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {formatCurrency(Number(expense.amount))}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDelete(expense.id)}
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
  );
}
