"use client";

import React from "react";
import { History, Calendar, IndianRupee, FileText } from "lucide-react";
import type { ToothRecord } from "./types";

interface TreatmentHistoryTabProps {
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

export function TreatmentHistoryTab({ record }: TreatmentHistoryTabProps) {
  const treatments = record?.treatments || [];

  if (treatments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-[#1b5e20]/5 flex items-center justify-center text-[#1b5e20] mb-4">
          <History className="w-8 h-8" />
        </div>
        <h4 className="text-sm font-bold text-slate-800">No history found</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
          No treatments added for this tooth yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
      {treatments.map((t) => (
        <div
          key={t.id}
          className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm space-y-2 hover:shadow-md transition-shadow duration-150"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-800">{t.treatment}</h4>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#1b5e20]" />
                <span>{t.date}</span>
              </div>
            </div>
            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
              {t.status}
            </span>
          </div>

          {/* Fee & Notes */}
          <div className="pt-2 border-t border-slate-50 flex flex-col gap-1.5 text-xs">
            <div className="flex items-center gap-1 text-[#1b5e20] font-semibold">
              <IndianRupee className="w-3.5 h-3.5" />
              <span>{formatINR(t.fee)}</span>
            </div>
            {t.notes && (
              <div className="flex items-start gap-1.5 text-[11px] text-slate-600 bg-slate-50 rounded-lg p-2 mt-1 leading-relaxed">
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{t.notes}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
