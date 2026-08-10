"use client";

import { useState, type FormEvent } from "react";
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
  const [category, setCategory] = useState<ExpenseCategory>("regular");
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
    setCategory("regular");
    setDate(todayLocalISODate());
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900"
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
            className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:text-zinc-50"
          />
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
            className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:text-zinc-50"
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
            onClick={() => setCategory("regular")}
            className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
              category === "regular"
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            Regular
          </button>
          <button
            type="button"
            onClick={() => setCategory("credit_card")}
            className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
              category === "credit_card"
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
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
          className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:text-zinc-50"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Expense added.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? "Saving..." : "Add expense"}
      </button>
    </form>
  );
}
