"use client";

import React from "react";
import type { Appointment, AppointmentStatus } from "../../lib/types";
import { AppointmentCard } from "./AppointmentCard";
import { getWeekStart, shiftDate } from "../../lib/store/useCalendarStore";
import { parseTimeTo24h } from "./DayView";
import { Plus } from "lucide-react";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

interface WeekViewProps {
  selectedDate: string;      // any date in the target week
  appointments: Appointment[];
  isLoading?: boolean;
  onCheckIn: (id: string) => void;
  onStartTreatment: (id: string) => void;
  onComplete: (id: string) => void;
  onOpenPatient: (patientId: string, phone: string, name: string) => void;
  onOpenEncounter: (patientId: string) => void;
  onStatusChange: (id: string, status: AppointmentStatus | "__delete__") => void;
  onNewAppointment: (date: string, time: string) => void;
  onDayClick: (date: string) => void;
}

export function WeekView({
  selectedDate,
  appointments,
  isLoading = false,
  onCheckIn,
  onStartTreatment,
  onComplete,
  onOpenPatient,
  onOpenEncounter,
  onStatusChange,
  onNewAppointment,
  onDayClick,
}: WeekViewProps) {
  const weekStart = getWeekStart(selectedDate);

  /* Build 7 day columns */
  const days = Array.from({ length: 7 }, (_, i) => {
    const dateStr = shiftDate(weekStart, i);
    const d = new Date(dateStr + "T00:00:00");
    return {
      dateStr,
      dayName: DAY_NAMES[i],
      dayNum: d.getDate(),
      monthName: MONTH_NAMES[d.getMonth()],
    };
  });

  /* Today string */
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  /* Group appointments by date */
  const byDate = new Map<string, Appointment[]>();
  appointments.forEach((apt) => {
    if (!byDate.has(apt.date)) byDate.set(apt.date, []);
    byDate.get(apt.date)!.push(apt);
  });
  // Sort each day's appointments by time
  byDate.forEach((apts) => {
    apts.sort((a, b) => parseTimeTo24h(a.time) - parseTimeTo24h(b.time));
  });

  if (isLoading) {
    return (
      <div className="flex-1 overflow-x-auto p-4">
        <div className="grid grid-cols-7 gap-2 min-w-[700px]">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-10 bg-surface-container rounded-xl animate-pulse" />
              <div className="h-24 bg-surface-container rounded-xl animate-pulse" />
              <div className="h-16 bg-surface-container rounded-xl animate-pulse opacity-60" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-w-[700px] h-full flex flex-col">
        {/* Day column headers */}
        <div className="grid grid-cols-7 border-b border-outline-variant/15 bg-surface-container/40">
          {days.map(({ dateStr, dayName, dayNum, monthName }) => {
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const dayApts = byDate.get(dateStr) ?? [];
            return (
              <button
                key={dateStr}
                onClick={() => onDayClick(dateStr)}
                className={`flex flex-col items-center py-3 px-2 transition-colors cursor-pointer border-r border-outline-variant/10 last:border-r-0 hover:bg-white/60 ${
                  isSelected ? "bg-white" : ""
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  isToday ? "text-primary" : "text-on-surface-variant/60"
                }`}>
                  {dayName}
                </span>
                <span className={`text-lg font-extrabold mt-0.5 leading-none ${
                  isToday
                    ? "w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center"
                    : "text-on-surface"
                }`}>
                  {dayNum}
                </span>
                <span className="text-[9px] text-on-surface-variant/40 mt-0.5">{monthName}</span>
                {dayApts.length > 0 && (
                  <span className={`mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    isToday
                      ? "bg-primary/10 text-primary"
                      : "bg-surface-container text-on-surface-variant"
                  }`}>
                    {dayApts.length} appt{dayApts.length !== 1 ? "s" : ""}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Day columns with appointments */}
        <div className="flex-1 grid grid-cols-7 overflow-y-auto divide-x divide-outline-variant/10">
          {days.map(({ dateStr, dayName }) => {
            const isToday = dateStr === todayStr;
            const dayApts = (byDate.get(dateStr) ?? []);
            return (
              <div
                key={dateStr}
                className={`flex flex-col min-h-[400px] p-2 gap-1.5 ${isToday ? "bg-primary/[0.015]" : ""}`}
              >
                {dayApts.length === 0 ? (
                  <button
                    onClick={() => onNewAppointment(dateStr, "09:00 AM")}
                    className="flex-1 flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-outline-variant/20 text-on-surface-variant/30 hover:border-primary/30 hover:text-primary/40 hover:bg-primary/[0.02] transition-all cursor-pointer group text-[10px] font-medium"
                  >
                    <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">Add</span>
                  </button>
                ) : (
                  <>
                    {dayApts.map((apt) => {
                      const aptDecimal = parseTimeTo24h(apt.time);
                      const nowDecimal = now.getHours() + now.getMinutes() / 60;
                      const isPast = isToday && aptDecimal + (apt.duration ?? 30) / 60 < nowDecimal;
                      return (
                        <AppointmentCard
                          key={apt.id}
                          appointment={apt}
                          compact={true}
                          isPast={isPast || apt.status === "Completed" || apt.status === "Cancelled"}
                          onCheckIn={onCheckIn}
                          onStartTreatment={onStartTreatment}
                          onComplete={onComplete}
                          onOpenPatient={onOpenPatient}
                          onOpenEncounter={onOpenEncounter}
                          onStatusChange={onStatusChange}
                          onClick={() => onDayClick(dateStr)}
                        />
                      );
                    })}
                    <button
                      onClick={() => onNewAppointment(dateStr, "09:00 AM")}
                      className="w-full flex items-center justify-center gap-1 text-[10px] font-medium text-on-surface-variant/30 hover:text-primary/50 py-1.5 rounded-lg hover:bg-primary/[0.03] transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
