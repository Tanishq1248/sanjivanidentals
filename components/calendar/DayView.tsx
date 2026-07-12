"use client";

import React, { useRef, useEffect } from "react";
import type { Appointment, AppointmentStatus } from "../../lib/types";
import { AppointmentCard } from "./AppointmentCard";
import { Plus } from "lucide-react";

/* ─── Constants ─── */
const HOUR_START = 8;   // 8 AM
const HOUR_END   = 20;  // 8 PM
const SLOT_HEIGHT = 64; // px per 30-min slot → 128px per hour

/** Parse time string "09:30 AM" → decimal hours (9.5) */
export function parseTimeTo24h(t: string): number {
  const clean = t.trim().toUpperCase();
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!match) return HOUR_START;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const period = match[3];
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h + m / 60;
}

/** Format decimal hours → "9:30 AM" */
function decimalToLabel(decimal: number): string {
  const h = Math.floor(decimal);
  const m = Math.round((decimal - h) * 60);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

interface DayViewProps {
  date: string;          // YYYY-MM-DD
  appointments: Appointment[];
  isLoading?: boolean;
  onCheckIn: (id: string) => void;
  onStartTreatment: (id: string) => void;
  onComplete: (id: string) => void;
  onOpenPatient: (patientId: string, phone: string, name: string) => void;
  onOpenEncounter: (patientId: string) => void;
  onStatusChange: (id: string, status: AppointmentStatus | "__delete__") => void;
  onNewAppointment: (date: string, time: string) => void;
}

export function DayView({
  date,
  appointments,
  isLoading = false,
  onCheckIn,
  onStartTreatment,
  onComplete,
  onOpenPatient,
  onOpenEncounter,
  onStatusChange,
  onNewAppointment,
}: DayViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  /* Auto-scroll to current hour on mount */
  useEffect(() => {
    const now = new Date();
    const currentDecimal = now.getHours() + now.getMinutes() / 60;
    const clampedDecimal = Math.min(Math.max(currentDecimal, HOUR_START), HOUR_END);
    const scrollY = (clampedDecimal - HOUR_START) * SLOT_HEIGHT * 2 - 60;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, scrollY);
    }
  }, []);

  /* Build slot map */
  const totalSlots = (HOUR_END - HOUR_START) * 2; // 30-min increments
  const slots: number[] = Array.from({ length: totalSlots }, (_, i) => HOUR_START + i * 0.5);

  /* Current time */
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const isToday = date === todayStr;
  const nowDecimal = now.getHours() + now.getMinutes() / 60;
  const nowTopPx = (nowDecimal - HOUR_START) * SLOT_HEIGHT * 2;

  /* Map appointments to their grid positions */
  const appointmentMap = new Map<string, Appointment[]>();
  appointments.forEach((apt) => {
    const slotDecimal = parseTimeTo24h(apt.time);
    // Round to nearest 30-min slot
    const slotIndex = Math.round((slotDecimal - HOUR_START) * 2) / 2;
    const key = (HOUR_START + slotIndex).toFixed(1);
    if (!appointmentMap.has(key)) appointmentMap.set(key, []);
    appointmentMap.get(key)!.push(apt);
  });

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="w-14 h-4 bg-surface-container rounded animate-pulse shrink-0" />
            <div className="flex-1 h-20 bg-surface-container rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto relative" style={{ scrollBehavior: "smooth" }}>
      {/* Current time indicator */}
      {isToday && nowDecimal >= HOUR_START && nowDecimal <= HOUR_END && (
        <div
          className="absolute left-0 right-0 z-10 pointer-events-none"
          style={{ top: `${nowTopPx}px` }}
        >
          <div className="flex items-center ml-14">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 shrink-0 shadow-sm" />
            <div className="flex-1 h-px bg-red-500 opacity-70" />
          </div>
        </div>
      )}

      {/* Timeline grid */}
      <div className="relative">
        {slots.map((slotDecimal, idx) => {
          const isHour = slotDecimal % 1 === 0;
          const key = slotDecimal.toFixed(1);
          const aptsInSlot = appointmentMap.get(key) ?? [];
          const hasAppointments = aptsInSlot.length > 0;

          return (
            <div
              key={idx}
              className="flex gap-0 border-b border-outline-variant/10"
              style={{ minHeight: `${SLOT_HEIGHT}px` }}
            >
              {/* Time label column */}
              <div className="w-16 shrink-0 flex flex-col items-end pr-3 pt-1.5">
                {isHour && (
                  <span className={`text-[10px] font-bold tabular-nums whitespace-nowrap ${
                    isToday && Math.abs(slotDecimal - Math.floor(nowDecimal)) < 0.5
                      ? "text-primary"
                      : "text-on-surface-variant/50"
                  }`}>
                    {decimalToLabel(slotDecimal)}
                  </span>
                )}
              </div>

              {/* Slot body */}
              <div className="flex-1 py-1 pr-3 pl-1 min-w-0">
                {hasAppointments ? (
                  <div className="space-y-1">
                    {aptsInSlot.map((apt) => {
                      const aptDecimal = parseTimeTo24h(apt.time);
                      const isNow = isToday && aptDecimal <= nowDecimal && nowDecimal < aptDecimal + (apt.duration ?? 30) / 60;
                      const isPast = isToday && aptDecimal + (apt.duration ?? 30) / 60 < nowDecimal;
                      return (
                        <AppointmentCard
                          key={apt.id}
                          appointment={apt}
                          isNow={isNow}
                          isPast={isPast || apt.status === "Completed" || apt.status === "Cancelled"}
                          onCheckIn={onCheckIn}
                          onStartTreatment={onStartTreatment}
                          onComplete={onComplete}
                          onOpenPatient={onOpenPatient}
                          onOpenEncounter={onOpenEncounter}
                          onStatusChange={onStatusChange}
                        />
                      );
                    })}
                  </div>
                ) : (
                  /* Empty slot — clickable to create new appointment */
                  <button
                    onClick={() => onNewAppointment(date, decimalToLabel(slotDecimal))}
                    className={`w-full h-full rounded-lg flex items-center gap-1.5 px-3 text-[10px] font-medium transition-all cursor-pointer group ${
                      isHour
                        ? "hover:bg-primary/5 hover:border hover:border-primary/20 text-on-surface-variant/30 hover:text-primary/60"
                        : "text-transparent hover:bg-surface-container/50 hover:text-on-surface-variant/30"
                    }`}
                  >
                    <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {decimalToLabel(slotDecimal)} — Available
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
