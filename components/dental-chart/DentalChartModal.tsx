"use client";

import React, { useEffect } from "react";
import { X, Activity } from "lucide-react";
import { useDentalChartStore } from "../../lib/store/useDentalChartStore";
import { DynamicDentalChart, DynamicToothDetailPanel } from "./DynamicDentalChart";
import type { SurfaceType } from "../../lib/types";

interface PatientData {
  id: string;
  name: string;
  age?: string | number;
  phone: string;
  gender?: string;
  avatarColor?: string;
}

interface DentalChartModalProps {
  patient: PatientData;
  encounters: any[];
  onSaveTreatment: (
    toothNumber: number,
    treatmentData: {
      treatmentName: string;
      status: string;
      fee: number;
      notes?: string;
      surfaces?: SurfaceType[];
      diagnosis?: string;
    }
  ) => Promise<void>;
  isSaving: boolean;
  onClose: () => void;
}

export function DentalChartModal({
  patient,
  encounters,
  onSaveTreatment,
  isSaving,
  onClose,
}: DentalChartModalProps) {
  const { selectedTooth, closeTooth, syncEncounters } = useDentalChartStore();

  // Sync encounters into the store whenever they change
  useEffect(() => {
    syncEncounters(encounters);
  }, [encounters, syncEncounters]);

  // Clean up selected tooth on unmount
  useEffect(() => {
    return () => {
      closeTooth();
    };
  }, [closeTooth]);

  const initials = patient.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-100 rounded-3xl shadow-2xl border border-slate-300 w-full max-w-7xl h-[92vh] max-h-[900px] flex flex-col overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="bg-white px-4 sm:px-6 py-3 border-b border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${patient.avatarColor || "bg-primary"} text-white font-bold flex items-center justify-center text-sm shadow-xs`}>
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 font-sans">
                  {patient.name}
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  ({patient.age ? `${patient.age} Yrs` : "Age N/A"} • {patient.gender || "N/A"})
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {patient.phone} • FDI ISO 3950 Standard Notation
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close Dental Chart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Sub-header banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-2 shrink-0 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700">
              Interactive 32-Tooth Multi-Surface FDI Odontogram
            </span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-500 hidden sm:inline">
              Click on any tooth crown to log diagnoses, multi-surface restorations (MOD/B/L), or treatment plans.
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-bold bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                Active Clinical Charting Session
              </span>
            </div>
          </div>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 sm:p-6 gap-4 min-h-0">
          {/* Main Dental Chart Area (Left side) */}
          <div className="flex-1 overflow-hidden h-full">
            <DynamicDentalChart
              patientId={patient.id}
              patientName={patient.name}
              onClose={onClose}
            />
          </div>

          {/* Tooth Details Sidebar Panel (Right side, conditionally visible if tooth selected) */}
          {selectedTooth && (
            <div className="w-full lg:w-[420px] shrink-0 h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl flex flex-col">
              <DynamicToothDetailPanel
                onSaveTreatment={onSaveTreatment}
                isSaving={isSaving}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
