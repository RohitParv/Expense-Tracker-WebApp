"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function toISODate(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildMonthGrid(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstOfMonth = new Date(year, monthIndex, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells: { date: Date; inMonth: boolean }[] = [];

  for (let i = 0; i < startWeekday; i++) {
    cells.push({
      date: new Date(year, monthIndex, i - startWeekday + 1),
      inMonth: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, monthIndex, d), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    cells.push({
      date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
      inMonth: false,
    });
  }
  return cells;
}

export default function Calendar({
  month,
  onMonthChange,
  from,
  to,
  hoverDate,
  onHoverDate,
  onSelectDate,
  maxDate,
}: {
  month: Date;
  onMonthChange: (month: Date) => void;
  from: string | null;
  to: string | null;
  hoverDate: string | null;
  onHoverDate: (date: string | null) => void;
  onSelectDate: (date: string) => void;
  maxDate?: string;
}) {
  const cells = buildMonthGrid(month);
  const today = new Date();
  const previewTo = to ?? hoverDate;

  return (
    <div className="w-72 select-none">
      <div className="flex items-center justify-between px-1 pb-2">
        <button
          type="button"
          onClick={() =>
            onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))
          }
          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
        <button
          type="button"
          onClick={() =>
            onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))
          }
          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 px-1">
        {WEEKDAYS.map((day, i) => (
          <div
            key={i}
            className="flex h-7 items-center justify-center text-[11px] font-medium text-zinc-400 dark:text-zinc-500"
          >
            {day}
          </div>
        ))}

        {cells.map(({ date, inMonth }, i) => {
          const iso = toISODate(date);
          const disabled = !inMonth || (maxDate ? iso > maxDate : false);
          const isFrom = from === iso;
          const isTo = to === iso;
          const rangeStart = from && previewTo ? (from < previewTo ? from : previewTo) : null;
          const rangeEnd = from && previewTo ? (from < previewTo ? previewTo : from) : null;
          const inRange = rangeStart && rangeEnd && iso > rangeStart && iso < rangeEnd;
          const isEndpoint = isFrom || isTo;
          const isToday = isSameDay(date, today);

          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              tabIndex={disabled ? -1 : 0}
              onMouseEnter={() => !disabled && onHoverDate(iso)}
              onClick={() => !disabled && onSelectDate(iso)}
              className={`relative h-8 w-8 justify-self-center rounded-full text-xs font-medium transition-colors ${
                disabled
                  ? "cursor-default text-zinc-300 dark:text-zinc-700"
                  : isEndpoint
                    ? "bg-cyan-600 text-white shadow-sm shadow-cyan-600/30"
                    : inRange
                      ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              } ${isToday && !isEndpoint ? "ring-1 ring-inset ring-cyan-400" : ""}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
