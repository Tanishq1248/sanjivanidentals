"use client";

import React from "react";
import type { Appointment } from "../../lib/types";
import { getMonthStart, getMonthEnd, shiftDate } from "../../lib/store/useCalendarStore";
import { STATUS_CONFIG } from "./AppointmentCard";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_HEADERS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

interface MonthViewProps {
  selectedDate: string;
  appointments: Appointment[];
  isLoading?: boolean;
  onDayClick: (date: string) => void;
}

export function MonthView({ selectedDate, appointments, isLoading = false, onDayClick }: MonthViewProps) {
  const [year, month] = selectedDate.split("-").map(Number);

  /* First day of month */
  const firstDay = new Date(year, month - 1, 1);
  const lastDayDate = new Date(year, month, 0);
  const daysInMonth = lastDayDate.getDate();

  /* Compute starting offset (Monday-based: Mon=0, Sun=6) */
  const rawDow = firstDay.getDay(); // 0=Sun
  const startOffset = rawDow === 0 ? 6 : rawDow - 1; // Mon-based

  /* Today */
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  /* Group appointments by date */
  const byDate = new Map<string, Appointment[]>();
  appointments.forEach((apt) => {
    if (!byDate.has(apt.date)) byDate.set(apt.date, []);
    byDate.get(apt.date)!.push(apt);
  });

  /* Build grid cells: prev month padding + current month days */
  const cells: Array<{ dateStr: string; isCurrentMonth: boolean }> = [];

  // Prev month days (padding)
  const firstDayStr = getMonthStart(selectedDate);
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ dateStr: shiftDate(firstDayStr, -i - 1), isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ dateStr, isCurrentMonth: true });
  }

  // Next month padding to complete last row
  while (cells.length % 7 !== 0) {
    cells.push({ dateStr: shiftDate(`${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`, cells.length - startOffset - daysInMonth + 1), isCurrentMonth: false });
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-4">
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface-container rounded-xl animate-pulse opacity-60" style={{ animationDelay: `${i * 20}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-3">
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/50 py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ dateStr, isCurrentMonth }, idx) => {
          const isToday = dateStr === todayStr;
          const dayNum = parseInt(dateStr.split("-")[2], 10);
          const dayApts = byDate.get(dateStr) ?? [];
          const hasApts = dayApts.length > 0;

          /* Take top 3 status dots */
          const visibleApts = dayApts.slice(0, 3);
          const overflow = dayApts.length - 3;

          return (
            <button
              key={idx}
              onClick={() => isCurrentMonth ? onDayClick(dateStr) : undefined}
              disabled={!isCurrentMonth}
              className={`relative flex flex-col min-h-[88px] rounded-xl p-1.5 transition-all text-left group ${
                !isCurrentMonth
                  ? "opacity-25 cursor-default"
                  : isToday
                  ? "bg-primary/8 border border-primary/30 hover:bg-primary/12"
                  : "hover:bg-white hover:shadow-sm border border-transparent hover:border-outline-variant/15 cursor-pointer"
              }`}
            >
              {/* Day number */}
              <span className={`text-xs font-extrabold leading-none mb-1.5 ${
                isToday
                  ? "w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center"
                  : isCurrentMonth
                  ? "text-on-surface"
                  : "text-on-surface-variant"
              }`}>
                {dayNum}
              </span>

              {/* Appointment pills */}
              {hasApts && (
                <div className="space-y-0.5 flex-1 overflow-hidden">
                  {visibleApts.map((apt) => {
                    const cfg = STATUS_CONFIG[apt.status] ?? STATUS_CONFIG.Pending;
                    return (
                      <div
                        key={apt.id}
                        className={`w-full rounded px-1 py-0.5 text-[9px] font-bold leading-tight truncate ${cfg.badge} border`}
                        title={`${apt.time} · ${apt.patientName} · ${apt.service}`}
                      >
                        {apt.time.replace(":00", "").replace(" AM", "a").replace(" PM", "p")} {apt.patientName.split(" ")[0]}
                      </div>
                    );
                  })}
                  {overflow > 0 && (
                    <div className="text-[9px] font-bold text-on-surface-variant/60 px-1">
                      +{overflow} more
                    </div>
                  )}
                </div>
              )}

              {/* Hover: appointment count badge */}
              {!hasApts && isCurrentMonth && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] font-medium text-on-surface-variant/30">+ New</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
