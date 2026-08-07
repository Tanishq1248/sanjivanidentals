"use client";

import React from "react";
import type { ToothTreatmentEntry } from "../../../lib/types";
import { getTreatmentStatus } from "../../../lib/types";

interface TreatmentItemProps {
  index: number;
  treatment: ToothTreatmentEntry | { id: string; treatmentName: string; status?: string; fee?: number; toothNumber?: number };
  encounterStatus?: string;
  isBillingSelected?: boolean;
  onToggleBilling?: () => void;
  onStatusChange?: (newStatus: "Planned" | "In Progress" | "Completed") => void;
  formatINR: (val: number) => string;
}

export function TreatmentItem({
  index,
  treatment,
  encounterStatus,
  isBillingSelected,
  onToggleBilling,
  onStatusChange,
  formatINR,
}: TreatmentItemProps) {
  const treatmentStatus = getTreatmentStatus(treatment, encounterStatus);
  const billingStatus =
    ("billingStatus" in treatment && treatment.billingStatus) || "Unbilled";
  const fee = treatment.fee || 0;
  const toothNum = treatment.toothNumber;

  const isCompleted = treatmentStatus === "Completed";
  const isBilled = billingStatus === "Billed";

  const getClinicalBadge = (s: string) => {
    switch (s) {
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            🟢 Completed
          </span>
        );
      case "In Progress":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            🟡 In Progress
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
            🔴 Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            🔵 Planned
          </span>
        );
    }
  };

  const getBillingBadge = (b: string) => {
    if (b === "Billed") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          ✓ Billed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
        Unbilled
      </span>
    );
  };

  const surfaces =
    "surfaces" in treatment && Array.isArray(treatment.surfaces) && treatment.surfaces.length > 0
      ? treatment.surfaces
      : undefined;

  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/15 space-y-3 font-sans shadow-xs">
      <div className="flex items-center justify-between gap-2 border-b border-outline-variant/10 pb-2.5 flex-wrap">
        <span className="text-xs font-extrabold uppercase tracking-wider text-primary flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[11px]">
            #{index + 1}
          </span>
          Treatment Details
        </span>
        <div className="flex items-center gap-2">
          {onStatusChange ? (
            <select
              value={treatmentStatus}
              onChange={(ev) =>
                onStatusChange(ev.target.value as "Planned" | "In Progress" | "Completed")
              }
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer focus:outline-none ${
                treatmentStatus === "Completed"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : treatmentStatus === "In Progress"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          ) : (
            getClinicalBadge(treatmentStatus)
          )}
          {getBillingBadge(billingStatus)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-on-surface-variant/70 font-semibold block text-[10px] uppercase">
            🦷 Tooth
          </span>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <span className="font-bold text-on-surface text-sm">
              {toothNum ? `Tooth ${toothNum}` : "General"}
            </span>
            {surfaces && surfaces.length > 0 && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-mono font-bold"
                title={`Surfaces: ${surfaces.join(", ")}`}
              >
                Surfaces: {surfaces.join(" • ")}
              </span>
            )}
          </div>
        </div>

        <div>
          <span className="text-on-surface-variant/70 font-semibold block text-[10px] uppercase">
            Procedure
          </span>
          <span
            className="font-bold text-on-surface text-sm truncate block mt-0.5"
            title={treatment.treatmentName}
          >
            {treatment.treatmentName}
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-outline-variant/10 flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-on-surface-variant/70 font-semibold block text-[10px] uppercase">
            Fee
          </span>
          <span className="font-extrabold text-on-surface text-sm">
            ₹{formatINR(fee)}
          </span>
        </div>

        {onToggleBilling && (
          <div className="flex items-center gap-2">
            {!isCompleted ? (
              <span className="text-[10px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-semibold">
                Must complete treatment to bill
              </span>
            ) : isBilled ? (
              <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 font-bold">
                ✓ Included in Invoice
              </span>
            ) : (
              <label
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer min-h-[44px] select-none transition-colors ${
                  isBillingSelected
                    ? "bg-primary/10 border-primary text-primary"
                    : "border-outline-variant/30 text-secondary hover:bg-surface-container-low"
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!isBillingSelected}
                  onChange={onToggleBilling}
                  className="w-4 h-4 rounded text-primary border-outline-variant/40 cursor-pointer"
                />
                <span>Add to Bill</span>
              </label>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
