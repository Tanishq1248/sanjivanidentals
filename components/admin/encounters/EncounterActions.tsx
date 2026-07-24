"use client";

import React, { useState } from "react";
import {
  MoreVertical,
  Pencil,
  FileText,
  Receipt,
  Printer,
  Trash2,
  CheckCircle2,
  Play,
  XCircle,
} from "lucide-react";
import type { PatientEncounter, EncounterStatus } from "../../../lib/types";

interface EncounterActionsProps {
  encounter: PatientEncounter;
  onStatusChange: (id: string, status: EncounterStatus) => void;
  onEdit: (encounter: PatientEncounter) => void;
  onDelete: (id: string) => void;
  onPrescription?: (encounter: PatientEncounter) => void;
  onInvoice?: (encounter: PatientEncounter) => void;
  onPrint?: (encounter: PatientEncounter) => void;
}

export function EncounterActions({
  encounter,
  onStatusChange,
  onEdit,
  onDelete,
  onPrescription,
  onInvoice,
  onPrint,
}: EncounterActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isCompleted = encounter.status === "Completed";
  const isInProgress = encounter.status === "In Progress";
  const isCancelled = encounter.status === "Cancelled";

  return (
    <div className="flex items-center justify-between gap-2 pt-3 border-t border-outline-variant/15 font-sans">
      {/* Quick Status Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {!isCompleted && (
          <button
            onClick={() => onStatusChange(encounter.id, "Completed")}
            className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer min-h-[44px] flex items-center gap-1.5 active:scale-95"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Mark Completed
          </button>
        )}

        {!isInProgress && !isCompleted && (
          <button
            onClick={() => onStatusChange(encounter.id, "In Progress")}
            className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 hover:bg-blue-500 hover:text-white transition-all cursor-pointer min-h-[44px] flex items-center gap-1.5 active:scale-95"
          >
            <Play className="w-3.5 h-3.5" />
            Start
          </button>
        )}

        {!isCancelled && (
          <button
            onClick={() => onStatusChange(encounter.id, "Cancelled")}
            className="px-3 py-2 rounded-xl bg-red-50 text-red-700 font-bold text-xs border border-red-200 hover:bg-red-500 hover:text-white transition-all cursor-pointer min-h-[44px] flex items-center gap-1.5 active:scale-95"
          >
            <XCircle className="w-3.5 h-3.5" />
            Cancel
          </button>
        )}
      </div>

      {/* More Actions Menu (⋮) */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2.5 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center bg-white"
          title="More Actions"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 bottom-12 w-52 bg-white rounded-2xl border border-outline-variant/20 shadow-xl py-2 z-40 animate-in fade-in zoom-in-95 duration-150 text-xs">
              <button
                onClick={() => {
                  onEdit(encounter);
                  setMenuOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left font-semibold text-on-surface hover:bg-surface-container-low flex items-center gap-2.5 cursor-pointer border-none bg-transparent min-h-[44px]"
              >
                <Pencil className="w-4 h-4 text-primary" />
                Edit Encounter
              </button>

              {onPrescription && (
                <button
                  onClick={() => {
                    onPrescription(encounter);
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left font-semibold text-on-surface hover:bg-surface-container-low flex items-center gap-2.5 cursor-pointer border-none bg-transparent min-h-[44px]"
                >
                  <FileText className="w-4 h-4 text-indigo-600" />
                  View / Write Prescription
                </button>
              )}

              {onInvoice && (
                <button
                  onClick={() => {
                    onInvoice(encounter);
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left font-semibold text-on-surface hover:bg-surface-container-low flex items-center gap-2.5 cursor-pointer border-none bg-transparent min-h-[44px]"
                >
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  View / Generate Invoice
                </button>
              )}

              {onPrint && (
                <button
                  onClick={() => {
                    onPrint(encounter);
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left font-semibold text-on-surface hover:bg-surface-container-low flex items-center gap-2.5 cursor-pointer border-none bg-transparent min-h-[44px]"
                >
                  <Printer className="w-4 h-4 text-secondary" />
                  Print Record
                </button>
              )}

              <div className="border-t border-outline-variant/15 my-1" />

              <button
                onClick={() => {
                  onDelete(encounter.id);
                  setMenuOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer border-none bg-transparent min-h-[44px]"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                Delete Encounter
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
