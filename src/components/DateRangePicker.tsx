"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import Calendar, { toISODate } from "@/components/Calendar";

export type DateRange = { from: string | null; to: string | null };

const PRESETS = [
  { label: "Today", days: 0 },
  { label: "Last 7 days", days: 6 },
  { label: "Last 30 days", days: 29 },
  { label: "This month", days: -1 },
] as const;

function formatDisplay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function DateRangePicker({
  from,
  to,
  onChange,
}: {
  from: string | null;
  to: string | null;
  onChange: (range: DateRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date());
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const todayIso = toISODate(new Date());

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleSelectDate(iso: string) {
    if (!from || (from && to)) {
      onChange({ from: iso, to: null });
      setHoverDate(null);
      return;
    }
    if (iso < from) {
      onChange({ from: iso, to: from });
    } else {
      onChange({ from, to: iso });
    }
    setHoverDate(null);
  }

  function applyPreset(days: number, isThisMonth: boolean) {
    const now = new Date();
    if (isThisMonth) {
      onChange({ from: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)), to: todayIso });
    } else {
      const start = new Date(now);
      start.setDate(start.getDate() - days);
      onChange({ from: toISODate(start), to: todayIso });
    }
    setOpen(false);
  }

  const label =
    from && to
      ? `${formatDisplay(from)} – ${formatDisplay(to)}`
      : from
        ? `${formatDisplay(from)} – ...`
        : "Filter by date";

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium shadow-sm transition-colors ${
            from
              ? "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300"
              : "border-zinc-200 bg-white text-zinc-600 hover:border-violet-300 hover:text-violet-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-violet-300"
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          {label}
        </button>

        {from && (
          <button
            type="button"
            onClick={() => onChange({ from: null, to: null })}
            aria-label="Clear date range"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="animate-fade-in-up absolute right-0 z-20 mt-2 flex gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-zinc-900">
          <div className="flex flex-col gap-1 border-r border-zinc-100 pr-3 dark:border-zinc-800">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset.days, preset.label === "This month")}
                className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-zinc-600 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-300 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                onChange({ from: null, to: null });
                setOpen(false);
              }}
              className="mt-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-zinc-400 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-800"
            >
              All time
            </button>
          </div>

          <div onMouseLeave={() => setHoverDate(null)}>
            <Calendar
              month={month}
              onMonthChange={setMonth}
              from={from}
              to={to}
              hoverDate={hoverDate}
              onHoverDate={setHoverDate}
              onSelectDate={handleSelectDate}
              maxDate={todayIso}
            />
          </div>
        </div>
      )}
    </div>
  );
}
