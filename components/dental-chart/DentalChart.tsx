"use client";

import React, { useState } from "react";
import {
  Activity,
  Layers,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MoveHorizontal,
} from "lucide-react";
import { useDentalChartStore } from "../../lib/store/useDentalChartStore";
import { Tooth } from "./Tooth";
import {
  UPPER_TEETH,
  LOWER_TEETH,
  UPPER_PEDIATRIC_TEETH,
  LOWER_PEDIATRIC_TEETH,
  CONDITION_STYLES,
  type FdiTooth,
  type ToothRecord,
  type NotationSystem,
  type ChartSubView,
} from "./types";

export interface DentalChartProps {
  patientId: string;
  patientName: string;
  onClose?: () => void;
}

export function DentalChart({ patientId, patientName, onClose }: DentalChartProps) {
  const {
    selectedTooth,
    openTooth,
    closeTooth,
    pediatric,
    setPediatric,
    notation,
    setNotation,
    subView,
    setSubView,
    toothRecords,
    resetChart,
  } = useDentalChartStore();

  // Mobile Arch View State (Upper, Lower, or Both)
  const [mobileArchView, setMobileArchView] = useState<"both" | "upper" | "lower">("both");

  const handleToothClick = (tooth: FdiTooth, record?: ToothRecord) => {
    // If clicking already selected tooth, toggle or keep open
    openTooth({
      number: tooth.number,
      label: tooth.label,
      quadrant: tooth.quadrant,
      record: record || toothRecords[tooth.number],
    });
  };

  // Determine teeth rows based on pediatric toggle
  const upperRow = pediatric ? UPPER_PEDIATRIC_TEETH : UPPER_TEETH;
  const lowerRow = pediatric ? LOWER_PEDIATRIC_TEETH : LOWER_TEETH;

  const midIndexUpper = upperRow.length / 2;
  const midIndexLower = lowerRow.length / 2;

  // Calculate status counts for live chart summary legend
  const allTeeth = [...upperRow, ...lowerRow];
  const statusCounts: Record<string, number> = {
    healthy: 0,
    planned: 0,
    existing_work: 0,
    root_canal: 0,
    extracted: 0,
    caries: 0,
  };

  allTeeth.forEach((t) => {
    const rec = toothRecords[t.number];
    const cond = rec?.condition || "healthy";
    if (cond === "cavity" || cond === "caries") statusCounts.caries++;
    else if (cond === "filled" || cond === "existing_work") statusCounts.existing_work++;
    else if (cond === "root_canal") statusCounts.root_canal++;
    else if (cond === "extracted" || cond === "missing") statusCounts.extracted++;
    else if (cond === "planned" || cond === "watch") statusCounts.planned++;
    else statusCounts.healthy++;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full font-sans max-w-full">
      
      {/* ─── 1. TOP HEADER & MULTI-SYSTEM TOOLBAR ─── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 px-4 sm:px-5 py-3 sm:py-3.5 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 text-white select-none shrink-0 shadow-md max-w-full">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase truncate">Clinical Odontogram</h3>
              <span className="text-[9px] sm:text-[10px] font-mono bg-indigo-500/30 text-indigo-200 px-1.5 py-0.2 rounded-full border border-indigo-400/30 font-semibold shrink-0">
                FDI ISO 3950
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-300 font-medium truncate">
              {patientName}
            </p>
          </div>
        </div>

        {/* System Toggles Group */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          
          {/* Arch Type Toggle: Adult (32) / Child (20) */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => setPediatric(false)}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                !pediatric
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Adult (32)
            </button>
            <button
              type="button"
              onClick={() => setPediatric(true)}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                pediatric
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Child (20)
            </button>
          </div>

          {/* Notation System Toggle: FDI vs Universal */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => setNotation("fdi")}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                notation === "fdi"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              FDI
            </button>
            <button
              type="button"
              onClick={() => setNotation("universal")}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                notation === "universal"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Univ
            </button>
          </div>

          {/* Sub-Views Selector: Dental Chart / Soft Tissue / TMJ */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
            {(["dental", "soft-tissue", "tmj"] as const).map((view) => {
              const label =
                view === "dental"
                  ? "Dental Chart"
                  : view === "soft-tissue"
                  ? "Soft Tissue"
                  : "TMJ";
              const isActive = subView === view;
              return (
                <button
                  key={view}
                  type="button"
                  onClick={() => setSubView(view)}
                  className={`px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* ─── Mobile Jaw Arch Selector (< 640px) ─── */}
      {subView === "dental" && (
        <div className="sm:hidden bg-slate-100 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            View Arch:
          </span>
          <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-300 shadow-2xs">
            <button
              type="button"
              onClick={() => setMobileArchView("both")}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                mobileArchView === "both"
                  ? "bg-primary text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Both Arches
            </button>
            <button
              type="button"
              onClick={() => setMobileArchView("upper")}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                mobileArchView === "upper"
                  ? "bg-primary text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Upper Jaw
            </button>
            <button
              type="button"
              onClick={() => setMobileArchView("lower")}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                mobileArchView === "lower"
                  ? "bg-primary text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Lower Jaw
            </button>
          </div>
        </div>
      )}

      {/* ─── 2. MAIN BODY / SUB-VIEW DISPATCHER ─── */}
      <div className="p-3 sm:p-6 flex-1 flex flex-col justify-between overflow-y-auto space-y-4 max-w-full">
        
        {subView === "soft-tissue" ? (
          /* ── Soft Tissue Examination Sub-View ── */
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
              <Activity className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-slate-800">
                Soft Tissue &amp; Periodontal Screening Matrix
              </h4>
              <p className="text-xs text-slate-500 max-w-lg mt-1 leading-relaxed">
                Comprehensive mucosal, gingival, and periodontal assessment for {patientName}. Probing depths, gingival recession, frenal attachments, and oral mucosal screening are within normal limits.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 max-w-2xl w-full pt-2">
              {["Labial Mucosa", "Buccal Mucosa", "Hard & Soft Palate", "Tongue & Floor of Mouth"].map((tissue) => (
                <div key={tissue} className="p-2.5 sm:p-3 bg-white rounded-xl border border-slate-200 shadow-2xs text-left">
                  <span className="text-[11px] font-bold text-slate-700 block truncate">{tissue}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" /> Normal / Healthy
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : subView === "tmj" ? (
          /* ── TMJ Assessment Sub-View ── */
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-100 border border-indigo-300 flex items-center justify-center text-indigo-700">
              <Activity className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-slate-800">
                Temporomandibular Joint (TMJ) Function Analysis
              </h4>
              <p className="text-xs text-slate-500 max-w-lg mt-1 leading-relaxed">
                Bilateral condylar translation smooth with no audible clicking, popping, crepitation, or muscular tenderness on maximum interincisal opening.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 max-w-2xl w-full pt-2">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs text-left">
                <span className="text-[11px] font-bold text-slate-700 block">Max Incisal Opening</span>
                <span className="text-sm font-bold text-indigo-700 font-mono">42 mm</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Normal (40–45 mm)</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs text-left">
                <span className="text-[11px] font-bold text-slate-700 block">Joint Sounds</span>
                <span className="text-xs font-bold text-emerald-600 block mt-1">None / Smooth</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">No clicking or crepitus</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs text-left">
                <span className="text-[11px] font-bold text-slate-700 block">Jaw Deviation</span>
                <span className="text-xs font-bold text-emerald-600 block mt-1">Straight Line</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">No lateral deflection</span>
              </div>
            </div>
          </div>
        ) : (
          /* ── Full Interactive 2-Part FDI Odontogram Canvas ── */
          <div className="flex-1 flex flex-col justify-center overflow-x-auto py-2 max-w-full">
            {/* Mobile Scroll Indicator */}
            <div className="sm:hidden flex items-center justify-center gap-1.5 py-1 px-3 bg-slate-100/90 text-slate-500 rounded-full text-[10px] font-bold mb-2 self-center border border-slate-200">
              <MoveHorizontal className="w-3 h-3" />
              <span>Scroll horizontally to view all teeth</span>
            </div>

            <div className="min-w-[620px] sm:min-w-[680px] mx-auto flex flex-col items-center gap-3 sm:gap-4 select-none">
              
              {/* ── UPPER JAW (Maxillary Arch) ── */}
              {(mobileArchView === "both" || mobileArchView === "upper") && (
                <>
                  <div className="w-full flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-slate-400 px-4 uppercase tracking-wider">
                    <span>{pediatric ? "Quadrant 5 (Upper Right)" : "Quadrant 1 (Upper Right - UR)"}</span>
                    <span>{pediatric ? "Quadrant 6 (Upper Left)" : "Quadrant 2 (Upper Left - UL)"}</span>
                  </div>

                  <div className="flex items-end justify-center gap-1.5 sm:gap-2 relative bg-slate-50/50 p-2 sm:p-3 rounded-2xl border border-slate-100">
                    {/* Left Quadrant (Upper Right Teeth) */}
                    <div className="flex items-end gap-1 sm:gap-2">
                      {upperRow.slice(0, midIndexUpper).map((tooth) => (
                        <Tooth
                          key={tooth.number}
                          tooth={tooth}
                          record={toothRecords[tooth.number]}
                          isSelected={selectedTooth?.number === tooth.number}
                          onClick={handleToothClick}
                          orientation="upper"
                        />
                      ))}
                    </div>

                    {/* Vertical Midline Axis Divider */}
                    <div className="w-px self-stretch bg-indigo-300 mx-1 sm:mx-2 flex-shrink-0 relative group">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[8px] sm:text-[9px] font-mono font-bold px-1.5 py-0.2 rounded shadow-xs">
                        MIDLINE
                      </div>
                    </div>

                    {/* Right Quadrant (Upper Left Teeth) */}
                    <div className="flex items-end gap-1 sm:gap-2">
                      {upperRow.slice(midIndexUpper).map((tooth) => (
                        <Tooth
                          key={tooth.number}
                          tooth={tooth}
                          record={toothRecords[tooth.number]}
                          isSelected={selectedTooth?.number === tooth.number}
                          onClick={handleToothClick}
                          orientation="upper"
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── Occlusal Separator Plane ── */}
              {mobileArchView === "both" && (
                <div className="w-full flex items-center gap-4 my-0.5 sm:my-1">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <span>Occlusal Plane</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                </div>
              )}

              {/* ── LOWER JAW (Mandibular Arch) ── */}
              {(mobileArchView === "both" || mobileArchView === "lower") && (
                <>
                  <div className="flex items-start justify-center gap-1.5 sm:gap-2 relative bg-slate-50/50 p-2 sm:p-3 rounded-2xl border border-slate-100">
                    {/* Left Quadrant (Lower Right Teeth) */}
                    <div className="flex items-start gap-1 sm:gap-2">
                      {lowerRow.slice(0, midIndexLower).map((tooth) => (
                        <Tooth
                          key={tooth.number}
                          tooth={tooth}
                          record={toothRecords[tooth.number]}
                          isSelected={selectedTooth?.number === tooth.number}
                          onClick={handleToothClick}
                          orientation="lower"
                        />
                      ))}
                    </div>

                    {/* Vertical Midline Axis Divider */}
                    <div className="w-px self-stretch bg-indigo-300 mx-1 sm:mx-2 flex-shrink-0 relative group">
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[8px] sm:text-[9px] font-mono font-bold px-1.5 py-0.2 rounded shadow-xs">
                        MIDLINE
                      </div>
                    </div>

                    {/* Right Quadrant (Lower Left Teeth) */}
                    <div className="flex items-start gap-1 sm:gap-2">
                      {lowerRow.slice(midIndexLower).map((tooth) => (
                        <Tooth
                          key={tooth.number}
                          tooth={tooth}
                          record={toothRecords[tooth.number]}
                          isSelected={selectedTooth?.number === tooth.number}
                          onClick={handleToothClick}
                          orientation="lower"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-slate-400 px-4 uppercase tracking-wider">
                    <span>{pediatric ? "Quadrant 8 (Lower Right)" : "Quadrant 4 (Lower Right - LR)"}</span>
                    <span>{pediatric ? "Quadrant 7 (Lower Left)" : "Quadrant 3 (Lower Left - LL)"}</span>
                  </div>
                </>
              )}

            </div>
          </div>
        )}

        {/* ─── 3. STATUS COUNTER BADGES & LEGEND ─── */}
        <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 text-xs shrink-0 select-none">
          <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1.5">
            
            <div className="flex items-center gap-1.5 font-semibold text-slate-700 text-[11px]">
              <span className="w-3 h-3 rounded-sm bg-white border border-slate-300 shrink-0" />
              <span>Healthy</span>
              <span className="text-[10px] text-slate-400 font-mono">({statusCounts.healthy})</span>
            </div>

            <div className="flex items-center gap-1.5 font-semibold text-slate-700 text-[11px]">
              <span className="w-3 h-3 rounded-sm bg-amber-400 border border-amber-500 shrink-0" />
              <span>Planned</span>
              {statusCounts.planned > 0 && (
                <span className="text-[10px] text-amber-700 font-mono font-bold">({statusCounts.planned})</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 font-semibold text-slate-700 text-[11px]">
              <span className="w-3 h-3 rounded-sm bg-blue-600 border border-blue-700 shrink-0" />
              <span>Existing</span>
              {statusCounts.existing_work > 0 && (
                <span className="text-[10px] text-blue-700 font-mono font-bold">({statusCounts.existing_work})</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 font-semibold text-slate-700 text-[11px]">
              <span className="w-3 h-3 rounded-sm bg-orange-600 border border-orange-700 shrink-0" />
              <span>RCT</span>
              {statusCounts.root_canal > 0 && (
                <span className="text-[10px] text-orange-700 font-mono font-bold">({statusCounts.root_canal})</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 font-semibold text-slate-700 text-[11px]">
              <span className="w-3 h-3 rounded-sm bg-rose-500 border border-rose-600 shrink-0" />
              <span>Extracted</span>
              {statusCounts.extracted > 0 && (
                <span className="text-[10px] text-rose-700 font-mono font-bold">({statusCounts.extracted})</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 font-semibold text-slate-700 text-[11px]">
              <span className="w-3 h-3 rounded-sm bg-red-600 border border-red-700 shrink-0" />
              <span>Caries</span>
              {statusCounts.caries > 0 && (
                <span className="text-[10px] text-red-700 font-mono font-bold">({statusCounts.caries})</span>
              )}
            </div>

          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {selectedTooth && (
              <button
                type="button"
                onClick={closeTooth}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Deselect Tooth
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                Done
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
