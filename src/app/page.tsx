import { redirect } from "next/navigation";
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
      <header className="border-b border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between p-4 sm:px-6">
          <div>
            <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Expense Tracker
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {user.email}
            </p>
          </div>
          <LogoutButton />
        </div>
      </header>

      <Dashboard userId={user.id} initialExpenses={expenses ?? []} />
    </div>
  );
}
