"use client";

import { useState, type FormEvent } from "react";
import { CreditCard, Plus, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ExpenseCategory } from "@/lib/supabase/types";

function todayLocalISODate() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export default function AddExpenseForm({ userId }: { userId: string }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayLocalISODate());
  const [category, setCategory] = useState<ExpenseCategory>("debit_card");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter a valid amount greater than 0.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("expenses").insert({
      user_id: userId,
      amount: numericAmount,
      category,
      description: description.trim() || null,
      date,
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setAmount("");
    setDescription("");
    setCategory("debit_card");
    setDate(todayLocalISODate());
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900"
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Add expense
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="amount"
            className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
          >
            Amount
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-zinc-400">
              $
            </span>
            <input
              id="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-6 pr-3 text-sm text-zinc-900 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="date"
            className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
          >
            Date
          </label>
          <input
            id="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Category
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setCategory("debit_card")}
            className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
              category === "debit_card"
                ? "border-sky-500 bg-sky-500 text-white shadow-sm shadow-sky-500/25"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            <Wallet className="h-4 w-4" />
            Debit Card
          </button>
          <button
            type="button"
            onClick={() => setCategory("credit_card")}
            className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
              category === "credit_card"
                ? "border-orange-500 bg-orange-500 text-white shadow-sm shadow-orange-500/25"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Credit Card
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="description"
          className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
        >
          Notes (optional)
        </label>
        <input
          id="description"
          type="text"
          maxLength={200}
          placeholder="e.g. Groceries"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          Expense added.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/25 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
      >
        <Plus className="h-4 w-4" />
        {loading ? "Saving..." : "Add expense"}
      </button>
    </form>
  );
}
