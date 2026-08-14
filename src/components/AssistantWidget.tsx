"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import type { Expense } from "@/lib/supabase/types";
import AssistantChat from "@/components/AssistantChat";

export default function AssistantWidget({
  userId,
  expenses,
}: {
  userId: string;
  expenses: Expense[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close assistant"
          onClick={() => setOpen(false)}
          className="animate-fade-in-up fixed inset-0 z-40 cursor-default bg-black/20 backdrop-blur-[2px]"
        />
      )}

      {open && (
        <div className="animate-fade-in-up fixed bottom-24 right-4 z-50 flex h-[min(34rem,calc(100vh-8rem))] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-2xl shadow-black/30 dark:border-white/10 dark:bg-zinc-900 sm:right-6">
          <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-3.5">
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="h-4 w-4" />
              <h2 className="text-sm font-semibold">AI Assistant</h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="rounded-lg p-1 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col p-3">
            <AssistantChat userId={userId} expenses={expenses} />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className="fixed bottom-5 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-600/30 transition-transform hover:scale-105 active:scale-95 sm:right-6"
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>
    </>
  );
}
