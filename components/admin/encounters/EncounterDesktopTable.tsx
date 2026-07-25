"use client";

import React, { memo } from "react";
import { ChevronDown, ChevronUp, MoreVertical, Pencil, FileText, Receipt, Printer, Trash2 } from "lucide-react";
import type { PatientEncounter, ToothTreatmentEntry, EncounterStatus } from "../../../lib/types";

interface EncounterDesktopTableProps {
  encounters: PatientEncounter[];
  expandedEncounterId: string | null;
  onToggleExpand: (id: string) => void;
  selectedBillingItems: Record<string, boolean>;
  onToggleBillingItem: (itemId: string) => void;
  isEncounterAllBillingSelected: (e: PatientEncounter) => boolean;
  onToggleAllBillingItems: (e: PatientEncounter) => void;
  calculateTotalFees: (e: PatientEncounter) => number;
  getTeethNumbers: (e: PatientEncounter) => number[];
  onStatusChange: (id: string, status: EncounterStatus) => void;
  onToothTreatmentStatusChange?: (encounterId: string, treatmentId: string, status: "Planned" | "In Progress" | "Completed") => void;
  onEdit: (e: PatientEncounter) => void;
  onDelete: (id: string) => void;
  onPrescription?: (e: PatientEncounter) => void;
  onInvoice?: (e: PatientEncounter) => void;
  onPrint?: (e: PatientEncounter) => void;
  formatVisitDate: (dateStr: string) => string;
  formatINR: (val: number) => string;
}

export const EncounterDesktopTable = memo(function EncounterDesktopTable({
  encounters,
  expandedEncounterId,
  onToggleExpand,
  selectedBillingItems,
  onToggleBillingItem,
  isEncounterAllBillingSelected,
  onToggleAllBillingItems,
  calculateTotalFees,
  getTeethNumbers,
  onStatusChange,
  onToothTreatmentStatusChange,
  onEdit,
  onDelete,
  onPrescription,
  onInvoice,
  onPrint,
  formatVisitDate,
  formatINR,
}: EncounterDesktopTableProps) {
  return (
    <div className="space-y-3 font-sans">
      {encounters.map((e) => {
        const isCompleted = e.status === "Completed";
        const isInProgress = e.status === "In Progress";
        const isCancelled = e.status === "Cancelled";
        const isExpanded = expandedEncounterId === e.id;
        const totalFees = calculateTotalFees(e);
        const teethNums = getTeethNumbers(e);

        const treatments = e.treatments || [];
        const treatmentPreview = treatments.slice(0, 3).join(" • ");
        const hasMoreTreatments = treatments.length > 3;

        const statusColor = isCompleted
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : isInProgress
          ? "bg-blue-50 text-blue-700 border-blue-200"
          : isCancelled
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-gray-50 text-gray-700 border-gray-200";

        const statusDot = isCompleted
          ? "bg-emerald-500"
          : isInProgress
          ? "bg-blue-500 animate-pulse"
          : isCancelled
          ? "bg-red-500"
          : "bg-gray-400";

        return (
          <div
            key={e.id}
            className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
              isExpanded
                ? "border-primary/25 shadow-md bg-white"
                : "border-outline-variant/15 bg-white hover:border-outline-variant/30 hover:shadow-sm"
            }`}
          >
            {/* Header Row */}
            <div className="flex items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={isEncounterAllBillingSelected(e)}
                onChange={() => onToggleAllBillingItems(e)}
                className="w-4 h-4 rounded border-outline-variant/30 cursor-pointer shrink-0"
                title="Toggle all completed treatments for billing"
              />

              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusDot}`} />

              <button
                type="button"
                onClick={() => onToggleExpand(e.id)}
                className="flex-1 min-w-0 text-left cursor-pointer focus:outline-none group"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-bold text-on-surface whitespace-nowrap">
                    {formatVisitDate(e.visitDate)}
                  </span>
                  <span className="text-outline-variant/40 text-xs">|</span>
                  <span className="text-xs text-on-surface-variant font-semibold">
                    {e.doctorName || "Dr. Moore"}
                  </span>
                  <span className="text-outline-variant/40 text-xs">|</span>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                    {e.status}
                  </span>
                  {totalFees > 0 && (
                    <>
                      <span className="text-outline-variant/40 text-xs">|</span>
                      <span className="text-xs font-extrabold text-primary whitespace-nowrap">
                        ₹{formatINR(totalFees)}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1 text-xs">
                  {treatmentPreview && (
                    <span className="text-on-surface-variant font-medium truncate max-w-md">
                      {treatmentPreview}
                      {hasMoreTreatments ? ` +${treatments.length - 3} More` : ""}
                    </span>
                  )}
                  {teethNums.length > 0 && (
                    <>
                      <span className="text-outline-variant/30">|</span>
                      <span className="text-on-surface-variant/80 font-medium">
                        Teeth: <span className="text-on-surface font-semibold">{teethNums.join(", ")}</span>
                      </span>
                    </>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => onToggleExpand(e.id)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              >
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            {/* Desktop Expanded View */}
            {isExpanded && (
              <div className="border-t border-outline-variant/15 bg-surface-container-lowest p-5 space-y-4">
                {e.toothTreatments && e.toothTreatments.length > 0 ? (
                  <div className="rounded-xl border border-outline-variant/15 overflow-hidden bg-white shadow-xs">
                    <div className="grid grid-cols-[60px_1fr_120px_80px_90px_80px] gap-2 px-4 py-2.5 bg-surface-container-low text-[11px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/15 items-center">
                      <span>Tooth</span>
                      <span>Procedure</span>
                      <span>Treatment Status</span>
                      <span className="text-right">Fee</span>
                      <span className="text-center">Add to Bill</span>
                      <span className="text-center">Billing</span>
                    </div>
                    {e.toothTreatments.map((tt) => {
                      const tStatus = e.status === "Completed"
                        ? "Completed"
                        : (tt.treatmentStatus || (tt.status === "Completed" || tt.status === "In Progress" || tt.status === "Planned" ? tt.status : "Planned"));
                      const bStatus = tt.billingStatus || "Unbilled";
                      const isComp = tStatus === "Completed";
                      const isBilled = bStatus === "Billed";

                      return (
                        <div
                          key={tt.id}
                          className="grid grid-cols-[60px_1fr_125px_80px_90px_80px] gap-2 px-4 py-2.5 text-xs border-b border-outline-variant/10 last:border-b-0 items-center hover:bg-surface-container-lowest"
                        >
                          <span className="font-bold text-on-surface">Tooth {tt.toothNumber}</span>
                          <span className="font-semibold text-on-surface">{tt.treatmentName}</span>
                          <select
                            value={tStatus}
                            onChange={(ev) => {
                              const val = ev.target.value as "Planned" | "In Progress" | "Completed";
                              if (onToothTreatmentStatusChange) {
                                onToothTreatmentStatusChange(e.id, tt.id, val);
                              }
                            }}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer focus:outline-none w-fit ${
                              tStatus === "Completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : tStatus === "In Progress"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            <option value="Planned">Planned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                          <span className="text-right font-extrabold text-on-surface">₹{formatINR(tt.fee)}</span>
                          <span className="flex justify-center items-center">
                            {isBilled ? (
                              <span className="text-[10px] font-bold text-indigo-700">Invoiced</span>
                            ) : !isComp ? (
                              <span className="text-[10px] font-medium text-slate-400" title="Must be Completed to bill">N/A</span>
                            ) : (
                              <input
                                type="checkbox"
                                checked={!!selectedBillingItems[`tt-${tt.id}`]}
                                onChange={() => onToggleBillingItem(`tt-${tt.id}`)}
                                className="w-4 h-4 rounded border-outline-variant/30 cursor-pointer"
                                title="Add completed treatment to bill"
                              />
                            )}
                          </span>
                          <span className="flex justify-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isBilled
                                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {bStatus}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {(e.chiefComplaint || e.diagnosis || e.notes) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-white p-4 rounded-xl border border-outline-variant/15">
                    {e.chiefComplaint && (
                      <div>
                        <span className="font-bold text-on-surface-variant block text-[11px] uppercase">Chief Complaint</span>
                        <p className="text-on-surface font-medium mt-1">{e.chiefComplaint}</p>
                      </div>
                    )}
                    {e.diagnosis && (
                      <div>
                        <span className="font-bold text-on-surface-variant block text-[11px] uppercase">Diagnosis</span>
                        <p className="text-on-surface font-medium mt-1">{e.diagnosis}</p>
                      </div>
                    )}
                    {e.notes && (
                      <div>
                        <span className="font-bold text-on-surface-variant block text-[11px] uppercase">Doctor Notes</span>
                        <p className="text-on-surface font-medium mt-1 whitespace-pre-wrap">{e.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/15">
                  <div className="flex items-center gap-2">
                    {!isCompleted && (
                      <button
                        onClick={() => onStatusChange(e.id, "Completed")}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                      >
                        Mark Completed
                      </button>
                    )}
                    {!isInProgress && !isCompleted && (
                      <button
                        onClick={() => onStatusChange(e.id, "In Progress")}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
                      >
                        Start Visit
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(e)}
                      className="px-3 py-1.5 rounded-xl border border-outline-variant/30 text-xs font-semibold text-secondary hover:bg-surface-container-low transition-all cursor-pointer bg-white"
                    >
                      Edit Record
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {onPrescription && (
                      <button
                        onClick={() => onPrescription(e)}
                        className="px-3 py-1.5 rounded-xl bg-surface-container text-primary font-bold text-xs hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant/20 flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Prescription
                      </button>
                    )}
                    {onInvoice && (
                      <button
                        onClick={() => onInvoice(e)}
                        className="px-3 py-1.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-dark transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        Invoice
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(e.id)}
                      className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors cursor-pointer border border-red-200/60 bg-white"
                      title="Delete Encounter"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
