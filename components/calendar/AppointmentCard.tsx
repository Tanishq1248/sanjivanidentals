"use client";

import React from "react";
import type { Appointment, AppointmentStatus } from "../../lib/types";
import {
  CheckCircle2,
  UserCircle,
  FileText,
  LogIn,
  Stethoscope,
  XCircle,
  Clock,
  Armchair,
} from "lucide-react";

/* ─── Status colour map ─── */
export const STATUS_CONFIG: Record<
  AppointmentStatus,
  { accent: string; badge: string; dot: string; label: string }
> = {
  Confirmed:      { accent: "bg-blue-500",    badge: "bg-blue-50 text-blue-700 border-blue-200",     dot: "bg-blue-500",    label: "Confirmed" },
  "Checked In":   { accent: "bg-teal-500",    badge: "bg-teal-50 text-teal-700 border-teal-200",     dot: "bg-teal-500",    label: "Checked In" },
  "In Progress":  { accent: "bg-purple-500",  badge: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500", label: "In Progress" },
  Completed:      { accent: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Completed" },
  Cancelled:      { accent: "bg-slate-400",   badge: "bg-slate-50 text-slate-600 border-slate-200",  dot: "bg-slate-400",   label: "Cancelled" },
  "No Show":      { accent: "bg-red-500",     badge: "bg-red-50 text-red-700 border-red-200",        dot: "bg-red-500",     label: "No Show" },
  Pending:        { accent: "bg-amber-400",   badge: "bg-amber-50 text-amber-700 border-amber-200",  dot: "bg-amber-400",   label: "Pending" },
};

interface AppointmentCardProps {
  appointment: Appointment;
  compact?: boolean;          // for week view cells
  isNow?: boolean;
  isPast?: boolean;
  onCheckIn?: (id: string) => void;
  onStartTreatment?: (id: string) => void;
  onComplete?: (id: string) => void;
  onOpenPatient?: (patientId: string, phone: string, name: string) => void;
  onOpenEncounter?: (patientId: string) => void;
  onStatusChange?: (id: string, status: AppointmentStatus | "__delete__") => void;
  onClick?: (appointment: Appointment) => void;
}

export function AppointmentCard({
  appointment,
  compact = false,
  isNow = false,
  isPast = false,
  onCheckIn,
  onStartTreatment,
  onComplete,
  onOpenPatient,
  onOpenEncounter,
  onStatusChange,
  onClick,
}: AppointmentCardProps) {
  const cfg = STATUS_CONFIG[appointment.status] ?? STATUS_CONFIG.Pending;

  if (compact) {
    // Compact variant for Week/Month views
    return (
      <div
        onClick={() => onClick?.(appointment)}
        className={`relative rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${
          isPast ? "opacity-60" : ""
        } ${isNow ? "ring-2 ring-primary/40 shadow-md" : ""}`}
      >
        {/* Accent bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.accent}`} />
        <div className="pl-3 pr-2 py-1.5 bg-white border border-outline-variant/15 rounded-lg ml-0">
          <p className="text-[11px] font-bold text-on-surface truncate leading-tight">{appointment.patientName}</p>
          <p className="text-[10px] text-on-surface-variant truncate">{appointment.time} · {appointment.service}</p>
          {appointment.chair && (
            <p className="text-[9px] font-semibold text-on-surface-variant/60 mt-0.5">{appointment.chair}</p>
          )}
          <span className={`inline-flex items-center mt-1 gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${cfg.badge}`}>
            <span className={`w-1 h-1 rounded-full ${cfg.dot} shrink-0`} />
            {cfg.label}
          </span>
        </div>
      </div>
    );
  }

  // Full variant for Day view
  return (
    <div
      className={`flex rounded-xl border overflow-hidden transition-all ${
        isNow
          ? "border-primary/30 shadow-md ring-1 ring-primary/20"
          : isPast
          ? "border-outline-variant/10 opacity-70"
          : "border-outline-variant/15 hover:border-outline-variant/30 hover:shadow-sm"
      }`}
    >
      {/* Status accent bar */}
      <div className={`w-1 shrink-0 ${cfg.accent}`} />

      <div className="flex-1 px-4 py-3 bg-white">
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="flex-1 min-w-0">
            {/* NOW pill */}
            {isNow && (
              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest text-primary bg-primary/8 px-1.5 py-0.5 rounded-full mb-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                </span>
                Now
              </span>
            )}

            {/* Patient name */}
            <button
              onClick={() => onOpenPatient?.(appointment.patientId, appointment.patientPhone, appointment.patientName)}
              className="text-sm font-bold text-on-surface hover:underline text-left block truncate max-w-full cursor-pointer bg-transparent border-none p-0 leading-tight"
            >
              {appointment.patientName}
            </button>

            {/* Service */}
            <p className="text-xs text-on-surface-variant font-medium mt-0.5 truncate">{appointment.service}</p>

            {/* Meta row: phone · chair · duration */}
            <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1">
              <span className="text-[11px] text-on-surface-variant/60 font-mono">{appointment.patientPhone}</span>
              {appointment.chair && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-on-surface-variant/70">
                  <Armchair className="w-3 h-3" />
                  {appointment.chair}
                </span>
              )}
              {appointment.duration && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-on-surface-variant/70">
                  <Clock className="w-3 h-3" />
                  {appointment.duration}m
                </span>
              )}
            </div>

            {/* Doctor (future-ready) */}
            {appointment.doctorName && (
              <p className="text-[10px] text-on-surface-variant/50 mt-1 truncate">Dr. {appointment.doctorName}</p>
            )}
          </div>

          {/* Right side: status + action */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        {!isPast && (
          <div className="flex items-center flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-outline-variant/10">
            {appointment.status === "Confirmed" || appointment.status === "Pending" ? (
              <QuickAction
                icon={<LogIn className="w-3 h-3" />}
                label="Check In"
                colorClass="text-teal-700 hover:bg-teal-50"
                onClick={() => onCheckIn?.(appointment.id)}
              />
            ) : null}
            {appointment.status === "Checked In" ? (
              <QuickAction
                icon={<Stethoscope className="w-3 h-3" />}
                label="Start Treatment"
                colorClass="text-purple-700 hover:bg-purple-50"
                onClick={() => onStartTreatment?.(appointment.id)}
              />
            ) : null}
            {(appointment.status === "In Progress" || appointment.status === "Checked In") ? (
              <QuickAction
                icon={<CheckCircle2 className="w-3 h-3" />}
                label="Complete"
                colorClass="text-emerald-700 hover:bg-emerald-50"
                onClick={() => onComplete?.(appointment.id)}
              />
            ) : null}
            <QuickAction
              icon={<UserCircle className="w-3 h-3" />}
              label="Patient"
              colorClass="text-primary hover:bg-primary/5"
              onClick={() => onOpenPatient?.(appointment.patientId, appointment.patientPhone, appointment.patientName)}
            />
            <QuickAction
              icon={<FileText className="w-3 h-3" />}
              label="Encounter"
              colorClass="text-on-surface-variant hover:bg-surface-container"
              onClick={() => onOpenEncounter?.(appointment.patientId)}
            />
            {onStatusChange && (
              <QuickAction
                icon={<XCircle className="w-3 h-3" />}
                label="Cancel"
                colorClass="text-red-600 hover:bg-red-50"
                onClick={() => onStatusChange(appointment.id, "Cancelled")}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  colorClass,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  colorClass: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md transition-colors cursor-pointer ${colorClass}`}
    >
      {icon}
      {label}
    </button>
  );
}
