"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, TrendingUp, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Expense } from "@/lib/supabase/types";
import { formatCurrency } from "@/lib/expense-format";
import AddExpenseForm from "@/components/AddExpenseForm";
import ExpenseHistory from "@/components/ExpenseHistory";
import AnalyticsView from "@/components/AnalyticsView";
import AssistantWidget from "@/components/AssistantWidget";
import Sidebar, { type SidebarView } from "@/components/Sidebar";

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
  const [view, setView] = useState<SidebarView>("dashboard");

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

  async function handleDelete(id: string) {
    const supabase = createClient();
    setExpenses((current) => current.filter((e) => e.id !== id));
    await supabase.from("expenses").delete().eq("id", id);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 sm:p-6 md:flex-row">
      <Sidebar active={view} onSelect={setView} />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {view === "dashboard" ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="animate-fade-in-up relative overflow-hidden rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Total spend
                  </p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400">
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

            <div className="max-w-xl">
              <AddExpenseForm userId={userId} />
            </div>
          </>
        ) : view === "history" ? (
          <ExpenseHistory expenses={expenses} onDelete={handleDelete} />
        ) : (
          <AnalyticsView expenses={expenses} />
        )}
      </div>

      <AssistantWidget userId={userId} expenses={expenses} />
    </div>
  );
}
