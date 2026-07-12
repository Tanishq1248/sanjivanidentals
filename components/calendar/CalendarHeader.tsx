"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Calendar, LayoutList, Grid3X3, Grid2X2 } from "lucide-react";
import type { CalendarView } from "../../lib/store/useCalendarStore";
import {
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  getMonthEnd,
} from "../../lib/store/useCalendarStore";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function formatDateRange(view: CalendarView, selectedDate: string): string {
  const d = new Date(selectedDate + "T00:00:00");
  const dayName = DAY_NAMES_SHORT[d.getDay()];
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();

  if (view === "day") {
    return `${dayName}, ${d.getDate()} ${month} ${year}`;
  }
  if (view === "week") {
    const ws = getWeekStart(selectedDate);
    const we = getWeekEnd(selectedDate);
    const [wy, wm, wd] = ws.split("-").map(Number);
    const [ey, em, ed] = we.split("-").map(Number);
    const startStr = `${wd} ${MONTH_NAMES[wm - 1]}`;
    const endStr = `${ed} ${MONTH_NAMES[em - 1]} ${ey}`;
    if (wm === em) return `${wd}–${ed} ${MONTH_NAMES[wm - 1]} ${wy}`;
    return `${startStr} – ${endStr}`;
  }
  // month
  return `${month} ${year}`;
}

interface CalendarHeaderProps {
  view: CalendarView;
  selectedDate: string;
  onViewChange: (v: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

const VIEW_BUTTONS: { key: CalendarView; icon: React.ReactNode; label: string }[] = [
  { key: "day",   icon: <LayoutList className="w-3.5 h-3.5" />, label: "Day" },
  { key: "week",  icon: <Grid3X3 className="w-3.5 h-3.5" />,   label: "Week" },
  { key: "month", icon: <Grid2X2 className="w-3.5 h-3.5" />,   label: "Month" },
];

export function CalendarHeader({
  view,
  selectedDate,
  onViewChange,
  onPrev,
  onNext,
  onToday,
}: CalendarHeaderProps) {
  const label = formatDateRange(view, selectedDate);
  const today = new Date().toISOString().split("T")[0];
  const isToday = view === "day" && selectedDate === today;

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-outline-variant/15 bg-white">
      {/* Left: nav */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/30 hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          aria-label="Previous"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onToday}
          disabled={isToday}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
            isToday
              ? "border-outline-variant/20 text-on-surface-variant/40 bg-surface-container cursor-not-allowed"
              : "border-outline-variant/30 text-on-surface hover:bg-surface-container"
          }`}
        >
          Today
        </button>
        <button
          onClick={onNext}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/30 hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          aria-label="Next"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Center: date label */}
      <div className="flex items-center gap-2 min-w-0">
        <Calendar className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm font-bold text-on-surface truncate">{label}</span>
      </div>

      {/* Right: view toggle */}
      <div className="flex items-center bg-surface-container rounded-lg p-0.5 gap-0.5">
        {VIEW_BUTTONS.map(({ key, icon, label: btnLabel }) => (
          <button
            key={key}
            onClick={() => onViewChange(key)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              view === key
                ? "bg-white text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {icon}
            <span className="hidden sm:inline">{btnLabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
