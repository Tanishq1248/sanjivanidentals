"use client";

import React from "react";
import { CalendarCheck2, Plus, Calendar, IndianRupee, FileText } from "lucide-react";
import { useDentalChartStore } from "../../lib/store/useDentalChartStore";
import type { ToothRecord } from "./types";

interface TreatmentPlanTabProps {
  record?: ToothRecord;
}

function formatINR(amount: any): string {
  const val = Number(amount || 0);
  const hasPaise = val % 1 !== 0;
  return val.toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

export function TreatmentPlanTab({ record }: TreatmentPlanTabProps) {
  const { setActiveTab } = useDentalChartStore();
  const plans = record?.plans || [];

  const handleAddPlanClick = () => {
    setActiveTab("add");
  };

  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-white rounded-xl border border-slate-100 shadow-sm space-y-4">
        <div>
          <h4 className="text-sm font-bold text-slate-800">No planned treatments</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
            No treatment plans added for this tooth yet.
          </p>
        </div>
        
        <button
          onClick={handleAddPlanClick}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1b5e20] hover:bg-[#123f15] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Add Plan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Planned Procedures</h3>
        <button
          type="button"
          onClick={handleAddPlanClick}
          className="text-xs font-bold text-[#1b5e20] hover:underline cursor-pointer flex items-center gap-0.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add Plan
        </button>
      </div>

      {plans.map((p) => (
        <div
          key={p.id}
          className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm space-y-2 hover:shadow-md transition-shadow duration-150"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-800">{p.treatment}</h4>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#1b5e20]" />
                <span>{p.date}</span>
              </div>
            </div>
            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Planned
            </span>
          </div>

          {/* Fee & Notes */}
          <div className="pt-2 border-t border-slate-50 flex flex-col gap-1.5 text-xs">
            <div className="flex items-center gap-1 text-[#1b5e20] font-semibold">
              <IndianRupee className="w-3.5 h-3.5" />
              <span>{formatINR(p.fee)}</span>
            </div>
            {p.notes && (
              <div className="flex items-start gap-1.5 text-[11px] text-slate-600 bg-slate-50 rounded-lg p-2 mt-1 leading-relaxed">
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{p.notes}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
