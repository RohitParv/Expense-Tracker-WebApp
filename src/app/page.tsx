import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Dashboard from "@/components/Dashboard";
import LogoutButton from "@/components/LogoutButton";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-black/70">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between p-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-600/25">
              <Wallet className="h-4.5 w-4.5" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Expense Tracker
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {user.email}
              </p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      <Dashboard userId={user.id} initialExpenses={expenses ?? []} />
    </div>
  );
}
