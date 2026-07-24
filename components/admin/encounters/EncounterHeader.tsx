"use client";

import React from "react";
import { Calendar, User, ChevronDown, ChevronUp, Stethoscope } from "lucide-react";
import type { PatientEncounter, EncounterStatus } from "../../../lib/types";

interface EncounterHeaderProps {
  encounter: PatientEncounter;
  isExpanded: boolean;
  totalFees: number;
  teethNums: number[];
  treatmentCount: number;
  isAllBillingSelected?: boolean;
  onToggleAllBilling?: () => void;
  onToggleExpand: () => void;
  formatVisitDate: (dateStr: string) => string;
  formatINR: (val: number) => string;
}

export function EncounterHeader({
  encounter,
  isExpanded,
  totalFees,
  teethNums,
  treatmentCount,
  isAllBillingSelected,
  onToggleAllBilling,
  onToggleExpand,
  formatVisitDate,
  formatINR,
}: EncounterHeaderProps) {
  const isCompleted = encounter.status === "Completed";
  const isInProgress = encounter.status === "In Progress";
  const isCancelled = encounter.status === "Cancelled";

  const getStatusBadge = (s: EncounterStatus) => {
    switch (s) {
      case "Completed":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">🟢 Completed</span>;
      case "In Progress":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">🟡 In Progress</span>;
      case "Cancelled":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">🔴 Cancelled</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">🔵 Planned</span>;
    }
  };

  const treatments = encounter.treatments || [];
  const previewText = treatments.slice(0, 2).join(" • ");
  const remainingCount = treatments.length > 2 ? treatments.length - 2 : 0;

  return (
    <div className="p-4 space-y-3 font-sans">
      {/* Top Bar: Date, Billing Checkbox, Status */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {onToggleAllBilling && (
            <label
              className="min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer text-primary"
              title="Select all items for billing"
            >
              <input
                type="checkbox"
                checked={!!isAllBillingSelected}
                onChange={onToggleAllBilling}
                className="w-4 h-4 rounded border-outline-variant/30 text-primary cursor-pointer"
              />
            </label>
          )}

          <div className="flex items-center gap-1.5 text-on-surface font-extrabold text-sm sm:text-base">
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">{formatVisitDate(encounter.visitDate)}</span>
          </div>
        </div>

        <div className="shrink-0">{getStatusBadge(encounter.status)}</div>
      </div>

      {/* Grid Summary Info Card for Mobile & Tablet */}
      <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/15 text-xs">
        {/* Doctor */}
        <div>
          <span className="text-on-surface-variant/70 font-semibold block text-[10px] uppercase flex items-center gap-1">
            👨‍⚕️ Doctor
          </span>
          <span className="font-bold text-on-surface truncate block" title={encounter.doctorName}>
            {encounter.doctorName || "Dr. Moore"}
          </span>
        </div>

        {/* Total Fee */}
        <div>
          <span className="text-on-surface-variant/70 font-semibold block text-[10px] uppercase flex items-center gap-1">
            💰 Total Fee
          </span>
          <span className="font-extrabold text-primary">
            {totalFees > 0 ? `₹${formatINR(totalFees)}` : "₹0"}
          </span>
        </div>

        {/* Teeth Involved */}
        <div>
          <span className="text-on-surface-variant/70 font-semibold block text-[10px] uppercase flex items-center gap-1">
            🦷 Teeth
          </span>
          <span className="font-bold text-on-surface truncate block">
            {teethNums.length > 0 ? teethNums.join(", ") : "None"}
          </span>
        </div>

        {/* Treatments Count */}
        <div>
          <span className="text-on-surface-variant/70 font-semibold block text-[10px] uppercase flex items-center gap-1">
            📝 Treatments
          </span>
          <span className="font-bold text-on-surface">
            {treatmentCount} {treatmentCount === 1 ? "Treatment" : "Treatments"}
          </span>
        </div>
      </div>

      {/* Treatments Preview line if collapsed */}
      {!isExpanded && previewText && (
        <div className="text-xs text-on-surface-variant/80 font-medium flex items-center justify-between gap-2 pt-1">
          <span className="truncate text-[11px]" title={treatments.join(", ")}>
            {previewText}
          </span>
          {remainingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary shrink-0">
              +{remainingCount} More Treatments
            </span>
          )}
        </div>
      )}

      {/* Expand / Collapse Button */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full min-h-[44px] py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest hover:bg-surface-container-low text-primary font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
      >
        <span>{isExpanded ? "Hide Details" : "View Details"}</span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
    </div>
  );
}
