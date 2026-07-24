"use client";

import React from "react";
import { FileText, Receipt, CheckCircle2, AlertCircle, Stethoscope } from "lucide-react";
import type { PatientEncounter } from "../../../lib/types";

interface EncounterSummaryProps {
  encounter: PatientEncounter;
  totalFees: number;
  treatmentCount: number;
  formatINR: (val: number) => string;
  onOpenPrescription?: () => void;
  onOpenInvoice?: () => void;
}

export function EncounterSummary({
  encounter,
  totalFees,
  treatmentCount,
  formatINR,
  onOpenPrescription,
  onOpenInvoice,
}: EncounterSummaryProps) {
  const hasPrescription = Boolean(encounter.prescriptionId);

  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/15 space-y-4 font-sans shadow-xs">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 p-3 bg-surface-container/40 rounded-xl border border-outline-variant/10 text-xs">
        <div>
          <span className="text-on-surface-variant/70 font-bold uppercase tracking-wider text-[10px] block">
            Total Treatments
          </span>
          <span className="text-base font-extrabold text-on-surface">{treatmentCount}</span>
        </div>
        <div>
          <span className="text-on-surface-variant/70 font-bold uppercase tracking-wider text-[10px] block">
            Total Fee
          </span>
          <span className="text-base font-extrabold text-primary">₹{formatINR(totalFees)}</span>
        </div>
      </div>

      {/* Clinical Notes Section */}
      <div className="space-y-2 text-xs">
        {encounter.chiefComplaint && (
          <div>
            <span className="text-on-surface-variant font-bold text-[11px] block">Chief Complaint</span>
            <p className="text-on-surface font-medium leading-relaxed bg-white p-2.5 rounded-lg border border-outline-variant/10 mt-0.5">
              {encounter.chiefComplaint}
            </p>
          </div>
        )}

        {encounter.diagnosis && (
          <div>
            <span className="text-on-surface-variant font-bold text-[11px] block">Diagnosis</span>
            <p className="text-on-surface font-medium leading-relaxed bg-white p-2.5 rounded-lg border border-outline-variant/10 mt-0.5">
              {encounter.diagnosis}
            </p>
          </div>
        )}

        {encounter.notes && (
          <div>
            <span className="text-on-surface-variant font-bold text-[11px] block flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5 text-primary" /> Doctor Notes
            </span>
            <p className="text-on-surface font-medium leading-relaxed bg-white p-2.5 rounded-lg border border-outline-variant/10 mt-0.5 whitespace-pre-wrap">
              {encounter.notes}
            </p>
          </div>
        )}
      </div>

      {/* Prescription & Invoice Badges */}
      <div className="pt-2 border-t border-outline-variant/15 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {hasPrescription ? (
            <button
              onClick={onOpenPrescription}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer min-h-[44px]"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Prescription Available
            </button>
          ) : (
            <button
              onClick={onOpenPrescription}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant font-semibold text-[11px] border border-outline-variant/20 hover:bg-surface-container-high transition-colors cursor-pointer min-h-[44px]"
            >
              <FileText className="w-3.5 h-3.5 text-primary" />
              + Add Prescription
            </button>
          )}
        </div>

        {onOpenInvoice && (
          <button
            onClick={onOpenInvoice}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white font-bold text-[11px] shadow-xs hover:bg-primary-dark transition-colors cursor-pointer min-h-[44px]"
          >
            <Receipt className="w-3.5 h-3.5" />
            Generate / Review Invoice
          </button>
        )}
      </div>
    </div>
  );
}
