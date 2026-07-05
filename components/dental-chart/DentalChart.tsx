"use client";

import React from "react";
import { useDentalChartStore } from "../../lib/store/useDentalChartStore";
import { Tooth } from "./Tooth";
import {
  UPPER_TEETH,
  LOWER_TEETH,
  UPPER_PEDIATRIC_TEETH,
  LOWER_PEDIATRIC_TEETH,
} from "./types";
import type { FdiTooth, ToothRecord } from "./types";

interface DentalChartProps {
  patientId: string;
  patientName: string;
  onClose?: () => void;
}

export function DentalChart({ patientId, patientName, onClose }: DentalChartProps) {
  const {
    selectedTooth,
    openTooth,
    pediatric,
    setPediatric,
    toothRecords,
  } = useDentalChartStore();

  const handleToothClick = (tooth: FdiTooth, record?: ToothRecord) => {
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Card Header with dark green background banner */}
      <div className="bg-[#1b5e20] px-5 py-3.5 flex items-center justify-between text-white select-none">
        <h3 className="text-sm font-bold tracking-wider uppercase font-sans">Dental Chart</h3>
        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-bold">
          {pediatric ? "Pediatric View (20)" : "Permanent View (32)"}
        </span>
      </div>

      {/* Card Body */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
        
        {/* Pediatric Toggle */}
        <div className="flex items-center gap-2 select-none shrink-0">
          <input
            id="pediatric-checkbox"
            type="checkbox"
            checked={pediatric}
            onChange={(e) => setPediatric(e.target.checked)}
            className="w-4.5 h-4.5 text-[#1b5e20] bg-white border-slate-300 rounded focus:ring-offset-1 focus:ring-[#1b5e20] cursor-pointer"
          />
          <label
            htmlFor="pediatric-checkbox"
            className="text-xs font-bold text-slate-700 cursor-pointer"
          >
            Pediatric
          </label>
        </div>

        {/* Teeth Grid Layout: scrollable horizontally for small screens */}
        <div className="overflow-x-auto -mx-6 px-6 py-4 flex-1 flex flex-col justify-center min-h-[300px]">
          <div className="min-w-[640px] mx-auto flex flex-col items-center gap-6">
            
            {/* ─── Upper Jaw ─── */}
            <div className="flex items-end justify-center gap-2 relative">
              {/* Left Quadrant (Upper Right) */}
              <div className="flex items-end gap-1.5">
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

              {/* Midline Divider */}
              <div className="w-px self-stretch bg-slate-300 mx-1 flex-shrink-0" />

              {/* Right Quadrant (Upper Left) */}
              <div className="flex items-end gap-1.5">
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

            {/* Occlusal Separator Plane */}
            <div className="w-full flex items-center gap-4 select-none">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                Occlusal Plane
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
            </div>

            {/* ─── Lower Jaw ─── */}
            <div className="flex items-start justify-center gap-2 relative">
              {/* Left Quadrant (Lower Right) */}
              <div className="flex items-start gap-1.5">
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

              {/* Midline Divider */}
              <div className="w-px self-stretch bg-slate-300 mx-1 flex-shrink-0" />

              {/* Right Quadrant (Lower Left) */}
              <div className="flex items-start gap-1.5">
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

          </div>
        </div>

        {/* Legend */}
        <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 select-none shrink-0 text-xs">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-600">
              <span className="w-3.5 h-3.5 bg-blue-600 rounded-sm border border-blue-700" />
              <span>History</span>
            </div>
            <div className="flex items-center gap-2 font-semibold text-slate-600">
              <span className="w-3.5 h-3.5 bg-[#1b5e20] rounded-sm border border-[#123f15]" />
              <span>Treatment Done</span>
            </div>
            <div className="flex items-center gap-2 font-semibold text-slate-600">
              <span className="w-3.5 h-3.5 bg-[#dc2626] rounded-sm border border-[#b91c1c]" />
              <span>Treatment Planned</span>
            </div>
            <div className="flex items-center gap-2 font-semibold text-slate-600">
              <span className="w-3.5 h-3.5 bg-white rounded-sm border border-slate-300" />
              <span>Not Selected</span>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {onClose && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-initial px-6 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-initial px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  Save
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
