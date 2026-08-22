"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  IndianRupee,
  Activity,
  User,
  Stethoscope,
} from "lucide-react";
import type { PatientEncounter, ToothTreatmentEntry, SurfaceType } from "../../../../lib/types";
import { getTreatmentStatus } from "../../../../lib/types";

interface TreatmentPlanTabProps {
  encounters: PatientEncounter[];
  onOpenDentalChart: () => void;
}

interface ProcessedTreatmentItem {
  id: string;
  toothNumber?: number;
  surfaces?: SurfaceType[];
  procedure: string;
  assignedDoctor: string;
  estimatedCost: number;
  date: string;
  status: "Planned" | "In Progress" | "Completed";
  billingStatus: "Billed" | "Unbilled";
  notes?: string;
}

function formatINR(amount: number): string {
  const val = Number(amount || 0);
  const hasPaise = val % 1 !== 0;
  return val.toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

function formatVisitDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export const TreatmentPlanTab: React.FC<TreatmentPlanTabProps> = ({
  encounters,
  onOpenDentalChart,
}) => {
  const [activeStatusFilter, setActiveStatusFilter] = useState<
    "all" | "Planned" | "In Progress" | "Completed" | "Billed"
  >("all");

  // Extract all treatment items from encounters
  const treatmentItems: ProcessedTreatmentItem[] = [];

  encounters.forEach((enc) => {
    if (enc.toothTreatments && enc.toothTreatments.length > 0) {
      enc.toothTreatments.forEach((tt) => {
        const clinicalStatus = getTreatmentStatus(tt, enc.status);

        const billingStatus: "Billed" | "Unbilled" =
          tt.billingStatus === "Billed" ? "Billed" : "Unbilled";

        treatmentItems.push({
          id: tt.id || `${enc.id}-${tt.toothNumber}`,
          toothNumber: tt.toothNumber,
          surfaces: tt.surfaces,
          procedure: tt.treatmentName,
          assignedDoctor: enc.doctorName || "Dr. Rajesh Sharma",
          estimatedCost: tt.fee || 0,
          date: tt.date || enc.visitDate,
          status: clinicalStatus,
          billingStatus,
          notes: tt.notes,
        });
      });
    } else if (enc.treatments && enc.treatments.length > 0) {
      enc.treatments.forEach((tName, idx) => {
        const clinicalStatus: "Planned" | "In Progress" | "Completed" =
          enc.status === "In Progress"
            ? "In Progress"
            : enc.status === "Pending"
            ? "Planned"
            : "Completed";

        treatmentItems.push({
          id: `${enc.id}-t-${idx}`,
          procedure: tName,
          assignedDoctor: enc.doctorName || "Dr. Rajesh Sharma",
          estimatedCost: 0,
          date: enc.visitDate,
          status: clinicalStatus,
          billingStatus: "Unbilled",
          notes: enc.notes,
        });
      });
    }
  });

  // Group treatments by status
  const plannedList = treatmentItems.filter((t) => t.status === "Planned");
  const inProgressList = treatmentItems.filter((t) => t.status === "In Progress");
  const completedList = treatmentItems.filter((t) => t.status === "Completed");
  const billedList = treatmentItems.filter((t) => t.billingStatus === "Billed");

  const getFilteredItems = () => {
    switch (activeStatusFilter) {
      case "Planned":
        return plannedList;
      case "In Progress":
        return inProgressList;
      case "Completed":
        return completedList;
      case "Billed":
        return billedList;
      default:
        return treatmentItems;
    }
  };

  const filteredItems = getFilteredItems();
  const totalPlanCost = treatmentItems.reduce((sum, item) => sum + item.estimatedCost, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-outline-variant/15 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-on-surface flex items-center gap-2 font-sans">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Comprehensive Dental Treatment Plan
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Track diagnostic procedures, tooth restorations, costs, and progress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold">
            Total Estimated: <span className="text-primary font-bold font-mono">₹{formatINR(totalPlanCost)}</span>
          </div>

          <button
            onClick={onOpenDentalChart}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Treatment
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveStatusFilter("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeStatusFilter === "all"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          All ({treatmentItems.length})
        </button>

        <button
          onClick={() => setActiveStatusFilter("Planned")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeStatusFilter === "Planned"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
          }`}
        >
          Planned ({plannedList.length})
        </button>

        <button
          onClick={() => setActiveStatusFilter("In Progress")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeStatusFilter === "In Progress"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100"
          }`}
        >
          In Progress ({inProgressList.length})
        </button>

        <button
          onClick={() => setActiveStatusFilter("Completed")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeStatusFilter === "Completed"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100"
          }`}
        >
          Completed ({completedList.length})
        </button>

        <button
          onClick={() => setActiveStatusFilter("Billed")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeStatusFilter === "Billed"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100"
          }`}
        >
          Billed ({billedList.length})
        </button>
      </div>

      {/* Treatments List Table / Cards */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-outline-variant/15 p-12 text-center space-y-3">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No treatments found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Log treatments via the Dental Chart or Patient Encounters to populate this plan.
          </p>
          <button
            onClick={onOpenDentalChart}
            className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Open Dental Chart
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                  <th className="p-3.5 w-20 text-center">Tooth #</th>
                  <th className="p-3.5">Procedure & Treatment</th>
                  <th className="p-3.5">Assigned Doctor</th>
                  <th className="p-3.5 text-right">Fee / Cost</th>
                  <th className="p-3.5 text-center">Date</th>
                  <th className="p-3.5 text-center">Treatment Status</th>
                  <th className="p-3.5 text-center">Billing Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 text-center whitespace-nowrap">
                      {item.toothNumber ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md font-bold font-mono">
                          <span>#{item.toothNumber}</span>
                          {item.surfaces && item.surfaces.length > 0 && (
                            <span
                              className="text-primary font-bold text-[11px]"
                              title={`Surfaces: ${item.surfaces.join(", ")}`}
                            >
                              ({item.surfaces.join(",")})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">—</span>
                      )}
                    </td>

                    <td className="p-3.5 font-bold text-slate-900">
                      <div>{item.procedure}</div>
                      {item.notes && (
                        <div className="text-[11px] font-normal text-slate-500 italic mt-0.5">
                          {item.notes}
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 text-slate-700">
                      {item.assignedDoctor}
                    </td>

                    <td className="p-3.5 text-right font-extrabold text-slate-900 font-mono">
                      ₹{formatINR(item.estimatedCost)}
                    </td>

                    <td className="p-3.5 text-center text-slate-600">
                      {formatVisitDate(item.date)}
                    </td>

                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.status === "Completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : item.status === "In Progress"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.billingStatus === "Billed"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {item.billingStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
