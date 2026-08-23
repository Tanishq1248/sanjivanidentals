"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  IndianRupee,
  FileText,
  History,
  CalendarCheck2,
  Loader2,
  Stethoscope,
  ChevronDown,
} from "lucide-react";
import { useDentalChartStore } from "../../lib/store/useDentalChartStore";
import {
  toUniversalNotation,
  getToothAnatomicalName,
  getQuadrantDetails,
  isUpperTooth,
  CONDITION_STYLES,
  CLINICAL_DIAGNOSES,
  CLINICAL_PROCEDURES,
  type ToothConditionCode,
  type ToothConditionRecord,
  type ToothNumber,
} from "./types";
import { ToothSvg } from "./ToothSvg";
import { SurfaceSelector } from "./SurfaceSelector";
import { TreatmentHistoryTab } from "./TreatmentHistoryTab";
import { TreatmentPlanTab } from "./TreatmentPlanTab";
import type { SurfaceType } from "../../lib/types";

interface ToothDetailPanelProps {
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
}

const QUICK_STATUS_CHIPS: {
  code: ToothConditionCode;
  label: string;
  activeClass: string;
  badgeClass: string;
}[] = [
  {
    code: "healthy",
    label: "Healthy",
    activeClass: "bg-emerald-600 text-white border-emerald-600 shadow-sm",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    code: "planned",
    label: "Planned",
    activeClass: "bg-amber-500 text-white border-amber-500 shadow-sm",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    code: "existing_work",
    label: "Existing Work",
    activeClass: "bg-blue-600 text-white border-blue-600 shadow-sm",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    code: "root_canal",
    label: "Root Canal",
    activeClass: "bg-orange-600 text-white border-orange-600 shadow-sm",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
  },
  {
    code: "extracted",
    label: "Extracted",
    activeClass: "bg-rose-600 text-white border-rose-600 shadow-sm",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    code: "impacted",
    label: "Impacted",
    activeClass: "bg-purple-600 text-white border-purple-600 shadow-sm",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
];

export function ToothDetailPanel({ onSaveTreatment, isSaving }: ToothDetailPanelProps) {
  const {
    selectedTooth,
    closeTooth,
    notation,
    selectedSurfaces,
    setSelectedSurfaces,
    setToothCondition,
    toothConditions,
  } = useDentalChartStore();

  const [panelTab, setPanelTab] = useState<"detail" | "history" | "plan">("detail");

  // Clinical Form Fields
  const [selectedStatus, setSelectedStatus] = useState<ToothConditionCode>("healthy");
  const [diagnosis, setDiagnosis] = useState("");
  const [procedure, setProcedure] = useState("");
  const [fee, setFee] = useState<number | string>("");
  const [note, setNote] = useState("");
  const [clinicalStatus, setClinicalStatus] = useState<"Planned" | "In Progress" | "Completed">("Completed");

  // Search autocomplete dropdown states
  const [showDiagnosisDropdown, setShowDiagnosisDropdown] = useState(false);
  const [showProcedureDropdown, setShowProcedureDropdown] = useState(false);
  const [autoSaveFeedback, setAutoSaveFeedback] = useState<string | null>(null);

  const toothNumber = selectedTooth?.number || 11;
  const isUpper = isUpperTooth(toothNumber);
  const anatomicalName = getToothAnatomicalName(toothNumber);
  const quadrantInfo = getQuadrantDetails(toothNumber);
  const universalNotation = toUniversalNotation(toothNumber);

  // Sync local form state whenever toothNumber changes
  const activeToothNumber = selectedTooth?.number;
  useEffect(() => {
    if (!activeToothNumber) return;

    const existingCondition = toothConditions[activeToothNumber] || selectedTooth?.record?.conditionRecord;
    const initialStatus = existingCondition?.status || selectedTooth?.record?.condition || "healthy";

    setSelectedStatus(initialStatus);
    setDiagnosis(existingCondition?.diagnosis || "");
    setProcedure(existingCondition?.procedure || "");
    setFee(existingCondition?.fee !== undefined ? existingCondition.fee : "");
    setNote(existingCondition?.note || selectedTooth?.record?.notes || "");
    setClinicalStatus(initialStatus === "planned" ? "Planned" : "Completed");
    setPanelTab("detail");
  }, [activeToothNumber]);

  if (!selectedTooth) return null;

  // Handle Quick Status Pill Click (instant status update + feedback)
  const handleStatusChange = (status: ToothConditionCode) => {
    setSelectedStatus(status);
    setClinicalStatus(status === "planned" ? "Planned" : "Completed");

    // Auto-update local condition record
    const updatedRecord: ToothConditionRecord = {
      patientId: selectedTooth.record?.patientId || "current-patient",
      toothNumber: selectedTooth.number,
      surfaces: selectedSurfaces,
      status,
      diagnosis: diagnosis || undefined,
      procedure: procedure || undefined,
      note: note || undefined,
      fee: typeof fee === "number" ? fee : parseFloat(String(fee)) || undefined,
      updatedAt: new Date().toISOString(),
    };

    setToothCondition(updatedRecord);
    setAutoSaveFeedback(`Status set to ${CONDITION_STYLES[status]?.label || status}`);
    setTimeout(() => setAutoSaveFeedback(null), 2000);
  };

  // Handle Procedure Selection & Fee Auto-Mapping
  const handleSelectProcedure = (procName: string, defaultFee?: number) => {
    setProcedure(procName);
    setShowProcedureDropdown(false);
    if (defaultFee !== undefined) {
      setFee(defaultFee);
    } else {
      const match = CLINICAL_PROCEDURES.find((p) => p.name.toLowerCase() === procName.toLowerCase());
      if (match) setFee(match.defaultFee);
    }
  };

  // Handle Diagnosis Selection
  const handleSelectDiagnosis = (diag: string) => {
    setDiagnosis(diag);
    setShowDiagnosisDropdown(false);
  };

  // Primary Save Action (logs to encounter/case paper & saves condition)
  const handleSaveTreatment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return;

    const parsedFee = typeof fee === "number" ? fee : parseFloat(String(fee)) || 0;
    const finalTreatmentName = procedure.trim() || `${CONDITION_STYLES[selectedStatus]?.label || "General"} Treatment`;

    const conditionRecord: ToothConditionRecord = {
      patientId: selectedTooth.record?.patientId || "current-patient",
      toothNumber: selectedTooth.number,
      surfaces: selectedSurfaces,
      status: selectedStatus,
      diagnosis: diagnosis.trim() || undefined,
      procedure: finalTreatmentName,
      note: note.trim() || undefined,
      fee: parsedFee,
      updatedAt: new Date().toISOString(),
    };

    setToothCondition(conditionRecord);

    try {
      await onSaveTreatment(selectedTooth.number, {
        treatmentName: finalTreatmentName,
        status: clinicalStatus,
        fee: parsedFee,
        notes: note.trim() || undefined,
        surfaces: selectedSurfaces.length > 0 ? selectedSurfaces : undefined,
        diagnosis: diagnosis.trim() || undefined,
      });

      setAutoSaveFeedback("Saved & synced to Treatment Kanban!");
      setTimeout(() => setAutoSaveFeedback(null), 2500);
    } catch (err) {
      console.error("Error saving tooth treatment:", err);
    }
  };

  // Filter diagnoses and procedures for search dropdowns
  const filteredDiagnoses = CLINICAL_DIAGNOSES.filter((d) =>
    d.toLowerCase().includes(diagnosis.toLowerCase())
  );

  const filteredProcedures = CLINICAL_PROCEDURES.filter((p) =>
    p.name.toLowerCase().includes(procedure.toLowerCase())
  );

  return (
    <>
      {/* Mobile Drawer Dark Backdrop Overlay (< 1024px) */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
        onClick={closeTooth}
      />

      {/* ─── TOOTH DETAIL PANEL CONTAINER (BOTTOM DRAWER ON MOBILE, SIDE PANEL ON DESKTOP) ─── */}
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] lg:relative lg:inset-auto lg:z-30 lg:max-h-none lg:h-full w-full lg:w-[420px] bg-white rounded-t-3xl lg:rounded-none border-t lg:border-t-0 lg:border-l border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 lg:animate-none font-sans shrink-0">
        
        {/* Mobile Pull / Drag Indicator Handle (< 1024px) */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 lg:hidden shrink-0" />

        {/* ─── A. HEADER & ANATOMICAL PREVIEW CARD ─── */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 px-4 sm:px-5 py-3 sm:py-4 text-white shrink-0 shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {notation === "universal" ? `Univ #${universalNotation}` : `FDI #${toothNumber}`}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  ({notation === "universal" ? `FDI ${toothNumber}` : `Universal #${universalNotation}`})
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white mt-1 leading-tight">
                Tooth {toothNumber}: {anatomicalName}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-[10px] sm:text-[11px] text-slate-300">
                <span className="font-semibold">{quadrantInfo.name}</span>
                <span>•</span>
                <span className="text-indigo-300">{quadrantInfo.arch} Arch</span>
              </div>
            </div>

            <button
              type="button"
              onClick={closeTooth}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── TAB SELECTOR: Details vs History vs Plan ─── */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-2 pt-1 shrink-0">
          <button
            type="button"
            onClick={() => setPanelTab("detail")}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[40px] ${
              panelTab === "detail"
                ? "border-indigo-600 text-indigo-700 bg-white shadow-2xs rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Tooth Detail</span>
          </button>
          <button
            type="button"
            onClick={() => setPanelTab("history")}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[40px] ${
              panelTab === "history"
                ? "border-indigo-600 text-indigo-700 bg-white shadow-2xs rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({selectedTooth.record?.treatments?.length || 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setPanelTab("plan")}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[40px] ${
              panelTab === "plan"
                ? "border-indigo-600 text-indigo-700 bg-white shadow-2xs rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <CalendarCheck2 className="w-3.5 h-3.5" />
            <span>Plans ({selectedTooth.record?.plans?.length || 0})</span>
          </button>
        </div>

        {/* ─── TAB CONTENT BODY ─── */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4">
          {panelTab === "history" ? (
            <TreatmentHistoryTab record={selectedTooth.record} />
          ) : panelTab === "plan" ? (
            <TreatmentPlanTab record={selectedTooth.record} />
          ) : (
            /* ─── MAIN TOOTH DETAIL & CLINICAL FORM ─── */
            <div className="space-y-4">
              
              {/* 1. Anatomical Profile & Surface Target Card */}
              <div className="bg-slate-50/70 p-3 sm:p-3.5 rounded-xl border border-slate-200 flex flex-col gap-3">
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Anatomical Mini Profile */}
                  <div className="w-14 h-18 sm:w-16 sm:h-20 flex items-center justify-center bg-white rounded-lg border border-slate-200 p-1 shrink-0 shadow-2xs">
                    <ToothSvg
                      type={
                        toothNumber % 10 === 8
                          ? "wisdom"
                          : toothNumber % 10 >= 6
                          ? "molar"
                          : toothNumber % 10 >= 4
                          ? "premolar"
                          : toothNumber % 10 === 3
                          ? "canine"
                          : "incisor"
                      }
                      orientation={isUpper ? "upper" : "lower"}
                      condition={selectedStatus}
                      isSelected={false}
                      surfaces={selectedSurfaces}
                      toothNumber={toothNumber}
                      className="w-10 h-16 sm:w-12 sm:h-18"
                    />
                  </div>

                  {/* Status Summary & Quick Info */}
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Status:</span>
                      <span
                        className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          CONDITION_STYLES[selectedStatus]?.bg || "bg-slate-100"
                        } ${CONDITION_STYLES[selectedStatus]?.text || "text-slate-700"} ${
                          CONDITION_STYLES[selectedStatus]?.border || "border-slate-300"
                        }`}
                      >
                        {CONDITION_STYLES[selectedStatus]?.label || selectedStatus}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 leading-tight">
                      {CONDITION_STYLES[selectedStatus]?.description}
                    </p>
                  </div>
                </div>

                {/* Surface Selector Visual Target */}
                <SurfaceSelector
                  toothNumber={toothNumber}
                  selectedSurfaces={selectedSurfaces}
                  onChange={setSelectedSurfaces}
                  disabled={isSaving}
                />
              </div>

              {/* 2. Quick Status Selection Chips */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Quick Status Selection
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {QUICK_STATUS_CHIPS.map((chip) => {
                    const isActive = selectedStatus === chip.code;
                    return (
                      <button
                        key={chip.code}
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleStatusChange(chip.code)}
                        className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer border text-center select-none min-h-[38px] flex items-center justify-center ${
                          isActive
                            ? chip.activeClass
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100"
                        }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Searchable Clinical Fields & Inputs */}
              <div className="space-y-3 pt-1">
                
                {/* Diagnosis Field (Searchable Auto-complete + Custom Text) */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="input-diagnosis" className="block text-xs font-bold text-slate-700">
                      Clinical Diagnosis
                    </label>
                    <span className="text-[10px] text-slate-400">Search or type</span>
                  </div>
                  <div className="relative">
                    <input
                      id="input-diagnosis"
                      type="text"
                      disabled={isSaving}
                      value={diagnosis}
                      onChange={(e) => {
                        setDiagnosis(e.target.value);
                        setShowDiagnosisDropdown(true);
                      }}
                      onFocus={() => setShowDiagnosisDropdown(true)}
                      placeholder="e.g. Deep dental caries"
                      className="w-full px-3 py-2 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors min-h-[40px]"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                  </div>

                  {/* Autocomplete Suggestions Dropdown */}
                  {showDiagnosisDropdown && filteredDiagnoses.length > 0 && (
                    <div className="absolute z-40 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-44 overflow-y-auto divide-y divide-slate-100">
                      {filteredDiagnoses.map((diag) => (
                        <button
                          key={diag}
                          type="button"
                          onClick={() => handleSelectDiagnosis(diag)}
                          className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 transition-colors cursor-pointer"
                        >
                          {diag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Procedure Field (Searchable Auto-complete + Pricing link) */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="input-procedure" className="block text-xs font-bold text-slate-700">
                      Planned Procedure / Treatment
                    </label>
                    <span className="text-[10px] text-slate-400">Auto-fills fee</span>
                  </div>
                  <div className="relative">
                    <input
                      id="input-procedure"
                      type="text"
                      disabled={isSaving}
                      value={procedure}
                      onChange={(e) => {
                        setProcedure(e.target.value);
                        setShowProcedureDropdown(true);
                      }}
                      onFocus={() => setShowProcedureDropdown(true)}
                      placeholder="e.g. Composite Restoration"
                      className="w-full px-3 py-2 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors min-h-[40px]"
                    />
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                  </div>

                  {/* Procedure Suggestions Dropdown */}
                  {showProcedureDropdown && filteredProcedures.length > 0 && (
                    <div className="absolute z-40 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {filteredProcedures.map((proc) => (
                        <button
                          key={proc.name}
                          type="button"
                          onClick={() => handleSelectProcedure(proc.name, proc.defaultFee)}
                          className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 transition-colors cursor-pointer flex items-center justify-between"
                        >
                          <span>{proc.name}</span>
                          <span className="text-[11px] font-bold text-emerald-700 font-mono">
                            ₹{proc.defaultFee}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fee & Lifecycle Status Row */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {/* Estimated Fee Input */}
                  <div>
                    <label htmlFor="input-fee" className="block text-xs font-bold text-slate-700 mb-1">
                      Estimated Fee (₹)
                    </label>
                    <div className="relative">
                      <input
                        id="input-fee"
                        type="number"
                        min="0"
                        disabled={isSaving}
                        placeholder="0"
                        value={fee}
                        onChange={(e) => setFee(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors min-h-[40px]"
                      />
                      <span className="absolute left-2.5 top-2.5 text-xs font-bold text-slate-400">₹</span>
                    </div>
                  </div>

                  {/* Session Kanban Status */}
                  <div>
                    <label htmlFor="select-kanban-status" className="block text-xs font-bold text-slate-700 mb-1">
                      Lifecycle Status
                    </label>
                    <select
                      id="select-kanban-status"
                      disabled={isSaving}
                      value={clinicalStatus}
                      onChange={(e) => setClinicalStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors min-h-[40px]"
                    >
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Planned">Planned</option>
                    </select>
                  </div>
                </div>

                {/* Clinical Note Textarea */}
                <div>
                  <label htmlFor="textarea-tooth-note" className="block text-xs font-bold text-slate-700 mb-1">
                    Tooth-Specific Clinical Note <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    id="textarea-tooth-note"
                    rows={2}
                    disabled={isSaving}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Sensitivity to cold, 2 canals obturated..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Auto-save Feedback Badge */}
              {autoSaveFeedback && (
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{autoSaveFeedback}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── D. ACTIONS & AUTO-SAVE FOOTER ─── */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 shrink-0 space-y-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSaveTreatment()}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving &amp; Syncing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Save &amp; Log to Case Paper</span>
              </>
            )}
          </button>
          <p className="text-[10px] sm:text-[11px] text-center text-slate-500 leading-tight">
            Status &amp; surfaces save instantly. Add a procedure to append to the Treatment Kanban.
          </p>
        </div>

      </div>
    </>
  );
}
