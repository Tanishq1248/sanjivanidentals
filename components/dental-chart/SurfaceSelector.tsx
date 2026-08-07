"use client";

import React from "react";
import type { SurfaceType } from "../../lib/types";
import { SURFACE_LABELS } from "../../lib/types";
import { isAnteriorTooth } from "./types";

interface SurfaceOption {
  code: SurfaceType;
  label: string;
  fullName: string;
}

const POSTERIOR_SURFACES: SurfaceOption[] = [
  { code: "M", label: "M", fullName: "Mesial" },
  { code: "B", label: "B", fullName: "Buccal" },
  { code: "O", label: "O", fullName: "Occlusal" },
  { code: "L", label: "L", fullName: "Lingual" },
  { code: "D", label: "D", fullName: "Distal" },
];

const ANTERIOR_SURFACES: SurfaceOption[] = [
  { code: "M", label: "M", fullName: "Mesial" },
  { code: "Labial", label: "Labial", fullName: "Labial / Facial" },
  { code: "I", label: "I", fullName: "Incisal" },
  { code: "L", label: "L", fullName: "Lingual" },
  { code: "D", label: "D", fullName: "Distal" },
];

interface SurfaceSelectorProps {
  toothNumber: number;
  selectedSurfaces: SurfaceType[];
  onChange: (surfaces: SurfaceType[]) => void;
  disabled?: boolean;
}

export function SurfaceSelector({
  toothNumber,
  selectedSurfaces = [],
  onChange,
  disabled = false,
}: SurfaceSelectorProps) {
  const isAnterior = isAnteriorTooth(toothNumber);
  const surfaces = isAnterior ? ANTERIOR_SURFACES : POSTERIOR_SURFACES;

  const toggleSurface = (code: SurfaceType) => {
    if (disabled) return;
    if (selectedSurfaces.includes(code)) {
      onChange(selectedSurfaces.filter((s) => s !== code));
    } else {
      onChange([...selectedSurfaces, code]);
    }
  };

  return (
    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5 font-sans">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">
          Select Surface(s) <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
        </label>
        <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
          {isAnterior ? "Anterior Tooth" : "Posterior Tooth"}
        </span>
      </div>

      {/* Surface Button Grid */}
      <div className="flex flex-wrap items-center gap-1.5">
        {surfaces.map((s) => {
          const isSelected = selectedSurfaces.includes(s.code);

          return (
            <button
              key={s.code}
              type="button"
              disabled={disabled}
              onClick={() => toggleSurface(s.code)}
              title={`${s.fullName} (${s.code})`}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer border select-none disabled:opacity-50 disabled:cursor-not-allowed ${
                isSelected
                  ? "bg-[#1b5e20] text-white border-[#1b5e20] shadow-sm hover:bg-[#123f15]"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Selected Summary Badge */}
      {selectedSurfaces.length > 0 && (
        <div className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1 pt-1">
          <span className="font-bold">Selected:</span>
          <span className="bg-emerald-100 px-2 py-0.5 rounded font-mono text-emerald-900 font-bold">
            {selectedSurfaces.join(" • ")}
          </span>
          <span className="text-[10px] text-slate-400 font-normal">
            ({selectedSurfaces.map((code) => SURFACE_LABELS[code] || code).join(", ")})
          </span>
        </div>
      )}
    </div>
  );
}
