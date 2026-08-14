"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Budget, Expense } from "@/lib/supabase/types";
import { CATEGORY_LABEL, formatCurrency } from "@/lib/expense-format";

type ChatMessage = { role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  "Summarize my spending this month",
  "Where can I cut back?",
  "Set my credit card budget to $500",
];

function monthToDateTotals(expenses: Expense[]) {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const totals: Record<string, number> = { credit_card: 0, debit_card: 0, overall: 0 };
  for (const expense of expenses) {
    if (expense.date < monthStart) continue;
    const amount = Number(expense.amount);
    totals[expense.category] += amount;
    totals.overall += amount;
  }
  return totals;
}

export default function AssistantChat({
  userId,
  expenses,
}: {
  userId: string;
  expenses: Expense[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hi! I can summarize your spending, help set budgets, and suggest ways to save. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const spent = useMemo(() => monthToDateTotals(expenses), [expenses]);

  async function loadBudgets() {
    const supabase = createClient();
    const { data } = await supabase
      .from("budgets")
      .select("*")
      .order("category");
    setBudgets(data ?? []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial async data fetch
    void loadBudgets();
  }, [userId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const history = messages.slice(1); // drop the static greeting
    setMessages((current) => [...current, { role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }
      setMessages((current) => [...current, { role: "assistant", text: data.reply }]);
      loadBudgets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {budgets.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-1 pt-1">
          {budgets.map((budget) => {
            const current = spent[budget.category] ?? 0;
            const pct = Math.min(100, (current / Number(budget.monthly_limit)) * 100);
            const over = current > Number(budget.monthly_limit);
            return (
              <div
                key={budget.id}
                className="w-40 shrink-0 rounded-xl border border-black/5 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-zinc-900"
              >
                <p className="truncate text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  {budget.category === "overall" ? "Overall budget" : CATEGORY_LABEL[budget.category]}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatCurrency(current)}{" "}
                  <span className="font-normal text-zinc-400">
                    / {formatCurrency(Number(budget.monthly_limit))}
                  </span>
                </p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className={`h-full rounded-full ${over ? "bg-red-500" : "bg-cyan-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900">
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <p
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user"
                    ? "bg-cyan-600 text-white"
                    : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                }`}
              >
                {m.text}
              </p>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <p className="rounded-2xl bg-zinc-100 px-4 py-2.5 text-sm text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                Thinking…
              </p>
            </div>
          )}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 px-4 pb-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => sendMessage(s)}
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-cyan-300 hover:text-cyan-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-cyan-300"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-zinc-100 p-4 dark:border-zinc-800"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your spending or budgets…"
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-600/25 transition-transform hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 disabled:hover:scale-100"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
