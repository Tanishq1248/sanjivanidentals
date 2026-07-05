"use client";

import React from "react";
import { X } from "lucide-react";
import { useDentalChartStore } from "../../lib/store/useDentalChartStore";
import { TreatmentHistoryTab } from "./TreatmentHistoryTab";
import { AddTreatmentTab } from "./AddTreatmentTab";
import { TreatmentPlanTab } from "./TreatmentPlanTab";

interface ToothDetailPanelProps {
  onSaveTreatment: (
    toothNumber: number,
    treatmentData: {
      treatmentName: string;
      status: string;
      fee: number;
      notes?: string;
    }
  ) => Promise<void>;
  isSaving: boolean;
}

export function ToothDetailPanel({ onSaveTreatment, isSaving }: ToothDetailPanelProps) {
  const { selectedTooth, activeTab, closeTooth, setActiveTab } = useDentalChartStore();

  if (!selectedTooth) return null;

  return (
    <div className="w-full lg:w-96 flex flex-col bg-[#f8fafc] border-l border-slate-200 h-full overflow-hidden shadow-lg shrink-0">
      {/* Header with dark green background */}
      <div className="bg-[#1b5e20] px-5 py-4 flex items-center justify-between text-white shadow-md">
        <h2 className="text-base font-bold font-sans">Tooth No. {selectedTooth.number}</h2>
        <button
          type="button"
          onClick={closeTooth}
          className="p-1 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition-colors cursor-pointer"
          title="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white">
        {(["history", "add", "plan"] as const).map((tab) => {
          let label = "Treatment History";
          if (tab === "add") label = "Add Treatment";
          if (tab === "plan") label = "Treatment Plan";

          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-center text-xs font-bold transition-all border-b-2 cursor-pointer ${
                isActive
                  ? "border-[#1b5e20] text-[#1b5e20] bg-slate-50"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {activeTab === "history" && (
          <TreatmentHistoryTab record={selectedTooth.record} />
        )}
        {activeTab === "add" && (
          <AddTreatmentTab
            toothNumber={selectedTooth.number}
            onSaveTreatment={onSaveTreatment}
            isSaving={isSaving}
          />
        )}
        {activeTab === "plan" && (
          <TreatmentPlanTab record={selectedTooth.record} />
        )}
      </div>
    </div>
  );
}
