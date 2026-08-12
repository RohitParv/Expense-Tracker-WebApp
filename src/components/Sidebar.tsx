"use client";

import { LayoutDashboard, Receipt } from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "history", label: "Recent Transactions", icon: Receipt },
] as const;

export type SidebarView = (typeof NAV_ITEMS)[number]["id"];

export default function Sidebar({
  active,
  onSelect,
}: {
  active: SidebarView;
  onSelect: (view: SidebarView) => void;
}) {
  return (
    <>
      <aside className="hidden h-fit w-56 shrink-0 flex-col gap-1 rounded-2xl border border-black/5 bg-white p-3 shadow-sm md:flex dark:border-white/10 dark:bg-zinc-900">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-cyan-600 text-white shadow-sm shadow-cyan-600/25"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </aside>

      <div className="flex gap-2 overflow-x-auto md:hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-cyan-600 text-white shadow-sm shadow-cyan-600/25"
                  : "border border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
