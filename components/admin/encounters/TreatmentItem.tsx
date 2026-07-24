"use client";

import React from "react";
import type { ToothTreatmentEntry } from "../../../lib/types";

interface TreatmentItemProps {
  index: number;
  treatment: ToothTreatmentEntry | { id: string; treatmentName: string; status?: string; fee?: number; toothNumber?: number };
  isBillingSelected?: boolean;
  onToggleBilling?: () => void;
  formatINR: (val: number) => string;
}

export function TreatmentItem({
  index,
  treatment,
  isBillingSelected,
  onToggleBilling,
  formatINR,
}: TreatmentItemProps) {
  const status = treatment.status || "Planned";
  const fee = treatment.fee || 0;
  const toothNum = treatment.toothNumber;

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "Completed":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">🟢 Completed</span>;
      case "In Progress":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">🟡 In Progress</span>;
      case "Cancelled":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">🔴 Cancelled</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">🔵 Planned</span>;
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/15 space-y-3 font-sans shadow-xs">
      <div className="flex items-center justify-between gap-2 border-b border-outline-variant/10 pb-2.5">
        <span className="text-xs font-extrabold uppercase tracking-wider text-primary flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[11px]">#{index + 1}</span>
          Treatment Details
        </span>
        {getStatusBadge(status)}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-on-surface-variant/70 font-semibold block text-[10px] uppercase">🦷 Tooth</span>
          <span className="font-bold text-on-surface text-sm">{toothNum ? `Tooth ${toothNum}` : "General"}</span>
        </div>

        <div>
          <span className="text-on-surface-variant/70 font-semibold block text-[10px] uppercase">Procedure</span>
          <span className="font-bold text-on-surface text-sm truncate block" title={treatment.treatmentName}>
            {treatment.treatmentName}
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-outline-variant/10 flex items-center justify-between">
        <div>
          <span className="text-on-surface-variant/70 font-semibold block text-[10px] uppercase">Fee</span>
          <span className="font-extrabold text-on-surface text-sm">₹{formatINR(fee)}</span>
        </div>

        {onToggleBilling && (
          <label
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer min-h-[44px] select-none transition-colors ${
              status !== "Completed"
                ? "opacity-40 cursor-not-allowed border-outline-variant/20 bg-surface-container-low"
                : isBillingSelected
                ? "bg-primary/10 border-primary text-primary"
                : "border-outline-variant/30 text-secondary hover:bg-surface-container-low"
            }`}
          >
            <input
              type="checkbox"
              disabled={status !== "Completed"}
              checked={!!isBillingSelected}
              onChange={onToggleBilling}
              className="w-4 h-4 rounded text-primary border-outline-variant/40 cursor-pointer disabled:cursor-not-allowed"
            />
            <span>Bill Item</span>
          </label>
        )}
      </div>
    </div>
  );
}
