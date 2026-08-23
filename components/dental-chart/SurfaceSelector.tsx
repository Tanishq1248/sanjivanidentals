"use client";

import React from "react";
import type { SurfaceType } from "../../lib/types";
import { SURFACE_LABELS } from "../../lib/types";
import { isAnteriorTooth, getQuadrantDetails } from "./types";

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
  const { side } = getQuadrantDetails(toothNumber);
  const isRightSide = side === "Right"; // Q1 or Q4

  // Surface identifiers
  const centerCode: SurfaceType = isAnterior ? "I" : "O";
  const centerLabel = isAnterior ? "Incisal (I)" : "Occlusal (O)";

  const topCode: SurfaceType = isAnterior ? "Labial" : "B";
  const topLabel = isAnterior ? "Labial / Facial" : "Buccal (B)";

  const bottomCode: SurfaceType = "L";
  const bottomLabel = "Lingual / Palatal (L)";

  const mesialCode: SurfaceType = "M";
  const distalCode: SurfaceType = "D";

  // If patient's right side (Q1/Q4), Mesial is toward center/left of chart, Distal is away
  const leftCode = isRightSide ? distalCode : mesialCode;
  const leftLabel = isRightSide ? "Distal (D)" : "Mesial (M)";

  const rightCode = isRightSide ? mesialCode : distalCode;
  const rightLabel = isRightSide ? "Mesial (M)" : "Distal (D)";

  const toggleSurface = (code: SurfaceType) => {
    if (disabled) return;
    if (selectedSurfaces.includes(code)) {
      onChange(selectedSurfaces.filter((s) => s !== code));
    } else {
      onChange([...selectedSurfaces, code]);
    }
  };

  const isSelected = (code: SurfaceType) => selectedSurfaces.includes(code);

  const activeSectorFill = "#2563eb"; // Blue-600 active fill
  const inactiveSectorFill = "#f8fafc"; // Slate-50 default fill
  const activeSectorStroke = "#1d4ed8";
  const inactiveSectorStroke = "#cbd5e1";

  return (
    <div className="bg-slate-50/80 p-3 sm:p-3.5 rounded-xl border border-slate-200 space-y-3 font-sans max-w-full">
      <div className="flex items-center justify-between">
        <div>
          <span className="block text-xs font-bold text-slate-800">
            Surface Target Map
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            Tap sector or buttons below ({selectedSurfaces.length} selected)
          </span>
        </div>
        <span className="text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
          {isAnterior ? "Anterior" : "Posterior"}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 py-1">
        {/* ─── 5-SURFACE INTERACTIVE GEOMETRIC ODONTOGRAM DISC (ENLARGED TOUCH TARGETS >= 40px) ─── */}
        <div className="relative w-36 h-36 flex items-center justify-center select-none shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-xs">
            {/* Top Sector (Buccal / Labial) */}
            <path
              d="M 12 12 L 88 12 L 70 30 L 30 30 Z"
              fill={isSelected(topCode) ? activeSectorFill : inactiveSectorFill}
              stroke={isSelected(topCode) ? activeSectorStroke : inactiveSectorStroke}
              strokeWidth="1.5"
              className={`transition-colors duration-150 ${
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-80"
              }`}
              onClick={() => toggleSurface(topCode)}
            >
              <title>{topLabel}</title>
            </path>
            <text
              x="50"
              y="23"
              textAnchor="middle"
              className={`text-[11px] font-bold pointer-events-none ${
                isSelected(topCode) ? "fill-white" : "fill-slate-700"
              }`}
            >
              {isAnterior ? "Lab" : "B"}
            </text>

            {/* Bottom Sector (Lingual / Palatal) */}
            <path
              d="M 30 70 L 70 70 L 88 88 L 12 88 Z"
              fill={isSelected(bottomCode) ? activeSectorFill : inactiveSectorFill}
              stroke={isSelected(bottomCode) ? activeSectorStroke : inactiveSectorStroke}
              strokeWidth="1.5"
              className={`transition-colors duration-150 ${
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-80"
              }`}
              onClick={() => toggleSurface(bottomCode)}
            >
              <title>{bottomLabel}</title>
            </path>
            <text
              x="50"
              y="82"
              textAnchor="middle"
              className={`text-[11px] font-bold pointer-events-none ${
                isSelected(bottomCode) ? "fill-white" : "fill-slate-700"
              }`}
            >
              L
            </text>

            {/* Left Sector */}
            <path
              d="M 12 12 L 30 30 L 30 70 L 12 88 Z"
              fill={isSelected(leftCode) ? activeSectorFill : inactiveSectorFill}
              stroke={isSelected(leftCode) ? activeSectorStroke : inactiveSectorStroke}
              strokeWidth="1.5"
              className={`transition-colors duration-150 ${
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-80"
              }`}
              onClick={() => toggleSurface(leftCode)}
            >
              <title>{leftLabel}</title>
            </path>
            <text
              x="20"
              y="54"
              textAnchor="middle"
              className={`text-[11px] font-bold pointer-events-none ${
                isSelected(leftCode) ? "fill-white" : "fill-slate-700"
              }`}
            >
              {leftCode}
            </text>

            {/* Right Sector */}
            <path
              d="M 70 30 L 88 12 L 88 88 L 70 70 Z"
              fill={isSelected(rightCode) ? activeSectorFill : inactiveSectorFill}
              stroke={isSelected(rightCode) ? activeSectorStroke : inactiveSectorStroke}
              strokeWidth="1.5"
              className={`transition-colors duration-150 ${
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-80"
              }`}
              onClick={() => toggleSurface(rightCode)}
            >
              <title>{rightLabel}</title>
            </path>
            <text
              x="80"
              y="54"
              textAnchor="middle"
              className={`text-[11px] font-bold pointer-events-none ${
                isSelected(rightCode) ? "fill-white" : "fill-slate-700"
              }`}
            >
              {rightCode}
            </text>

            {/* Center Sector (Occlusal / Incisal) */}
            <rect
              x="30"
              y="30"
              width="40"
              height="40"
              fill={isSelected(centerCode) ? activeSectorFill : "#ffffff"}
              stroke={isSelected(centerCode) ? activeSectorStroke : inactiveSectorStroke}
              strokeWidth="1.5"
              className={`transition-colors duration-150 ${
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-80"
              }`}
              onClick={() => toggleSurface(centerCode)}
            >
              <title>{centerLabel}</title>
            </rect>
            <text
              x="50"
              y="55"
              textAnchor="middle"
              className={`text-[12px] font-bold pointer-events-none ${
                isSelected(centerCode) ? "fill-white" : "fill-slate-800"
              }`}
            >
              {centerCode}
            </text>
          </svg>
        </div>

        {/* Quick Surface Button Pill Group */}
        <div className="flex flex-col gap-2 w-full sm:flex-1">
          <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1.5">
            {[
              { code: "M" as SurfaceType, label: "M (Mesial)" },
              { code: (isAnterior ? "I" : "O") as SurfaceType, label: isAnterior ? "I (Incisal)" : "O (Occlusal)" },
              { code: "D" as SurfaceType, label: "D (Distal)" },
              { code: (isAnterior ? "Labial" : "B") as SurfaceType, label: isAnterior ? "Labial" : "B (Buccal)" },
              { code: "L" as SurfaceType, label: "L (Lingual)" },
            ].map((s) => {
              const active = isSelected(s.code);
              return (
                <button
                  key={s.code}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleSurface(s.code)}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border text-center min-h-[38px] flex items-center justify-center ${
                    active
                      ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Quick Select Preset Combos (e.g., MOD, MO, DO) */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 pt-1">
            <span className="font-semibold text-[11px]">Presets:</span>
            {["MOD", "MO", "DO", "OB"].map((combo) => (
              <button
                key={combo}
                type="button"
                disabled={disabled}
                onClick={() => {
                  const comboSurfaces = combo.split("") as SurfaceType[];
                  onChange(comboSurfaces);
                }}
                className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-mono font-bold cursor-pointer transition-colors text-xs min-h-[30px]"
              >
                {combo}
              </button>
            ))}
            <button
              type="button"
              disabled={disabled || selectedSurfaces.length === 0}
              onClick={() => onChange([])}
              className="ml-auto text-xs text-rose-600 hover:underline cursor-pointer disabled:opacity-40 font-semibold"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Selected Summary Badge */}
      {selectedSurfaces.length > 0 && (
        <div className="text-[11px] font-medium text-blue-900 bg-blue-50/80 p-2.5 rounded-lg border border-blue-200/60 flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="font-bold">Active Surfaces:</span>
            <span className="font-mono font-bold bg-blue-600 text-white px-1.5 py-0.2 rounded text-[10px]">
              {selectedSurfaces.join(" • ")}
            </span>
          </div>
          <span className="text-[10px] text-blue-700 font-normal">
            ({selectedSurfaces.map((code) => SURFACE_LABELS[code] || code).join(", ")})
          </span>
        </div>
      )}
    </div>
  );
}
