"use client";

import React, { useEffect } from "react";
import { X, Activity } from "lucide-react";
import { useDentalChartStore } from "../../lib/store/useDentalChartStore";
import { DentalChart } from "./DentalChart";
import { ToothDetailPanel } from "./ToothDetailPanel";
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
    .toUpperCase()
    .slice(0, 2);

  const genderSymbol =
    patient.gender?.toLowerCase() === "female"
      ? "♀"
      : patient.gender?.toLowerCase() === "male"
      ? "♂"
      : "";
  const genderColor =
    patient.gender?.toLowerCase() === "female" ? "text-pink-500" : "text-blue-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="relative bg-[#f1f5f9] w-full max-w-7xl h-[92vh] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header Bar: Breadcrumbs & Close Button */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>Patients</span>
            <span>/</span>
            <span className="text-slate-800 font-bold">{patient.name}</span>
            <span>/</span>
            <span className="text-indigo-600 font-bold">MolarPlus Odontogram</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title="Close Dental Chart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Info Card Block */}
        <div className="bg-[#f1f5f9] px-6 pt-4 pb-2 shrink-0">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              {/* Initials Badge */}
              <div
                className={`w-11 h-11 rounded-full ${
                  patient.avatarColor || "bg-indigo-600"
                } flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0`}
              >
                {initials}
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-base font-bold text-slate-800 flex items-center justify-center sm:justify-start gap-1.5">
                  {patient.name}
                  {genderSymbol && (
                    <span className={`font-semibold ${genderColor} text-sm`}>{genderSymbol}</span>
                  )}
                </h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 mt-0.5 text-xs text-slate-500 font-semibold">
                  <p>PID: <span className="text-slate-700 font-mono">{patient.id.slice(0, 8).toUpperCase()}</span></p>
                  <p>Age: <span className="text-slate-700">{patient.age || "—"}</span></p>
                  <p>Mobile: <span className="text-slate-700">{patient.phone}</span></p>
                </div>
              </div>
            </div>

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
            <DentalChart
              patientId={patient.id}
              patientName={patient.name}
              onClose={onClose}
            />
          </div>

          {/* Tooth Details Sidebar Panel (Right side, conditionally visible if tooth selected) */}
          {selectedTooth && (
            <div className="w-full lg:w-[420px] shrink-0 h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl flex flex-col">
              <ToothDetailPanel
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
