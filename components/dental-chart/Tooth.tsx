"use client";

import React from "react";
import type { FdiTooth, ToothRecord } from "./types";
import { toUniversalNotation, CONDITION_STYLES } from "./types";
import { ToothSvg } from "./ToothSvg";
import { useDentalChartStore } from "../../lib/store/useDentalChartStore";

interface ToothProps {
  tooth: FdiTooth;
  record?: ToothRecord;
  isSelected: boolean;
  onClick: (tooth: FdiTooth, record?: ToothRecord) => void;
  orientation: "upper" | "lower";
}

export function Tooth({ tooth, record, isSelected, onClick, orientation }: ToothProps) {
  const { notation } = useDentalChartStore();
  const conditionCode = record?.condition ?? "healthy";
  const conditionMeta = CONDITION_STYLES[conditionCode] || CONDITION_STYLES.healthy;

  const handleSelect = () => {
    onClick(tooth, record);
  };

  const displayNumber = notation === "universal" ? tooth.universalNumber : tooth.number;

  // Responsive width class based on tooth anatomy
  const widthClass =
    tooth.type === "wisdom"
      ? "w-8 sm:w-9"
      : tooth.type === "molar"
      ? "w-9 sm:w-10"
      : tooth.type === "premolar"
      ? "w-8 sm:w-9"
      : "w-7 sm:w-8";

  // Bubble style based on selection and condition
  const bubbleStyles = isSelected
    ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300 scale-110"
    : conditionCode !== "healthy"
    ? `${conditionMeta.bg} ${conditionMeta.text} ${conditionMeta.border} shadow-2xs font-bold`
    : "bg-white text-slate-700 border-slate-300 hover:border-indigo-400 hover:text-indigo-600 hover:bg-slate-50";

  return (
    <div
      className={`flex flex-col items-center gap-1.5 ${widthClass} select-none group transition-all duration-150`}
    >
      {orientation === "upper" ? (
        <>
          {/* Upper Tooth: SVG on top, Bubble on bottom */}
          <div
            onClick={handleSelect}
            className="cursor-pointer transition-transform duration-150 h-[74px] flex items-end justify-center w-full relative"
            title={`${tooth.label} (${notation === "universal" ? `Univ #${tooth.universalNumber}` : `FDI #${tooth.number}`}) - ${conditionMeta.label}`}
          >
            <ToothSvg
              type={tooth.type}
              orientation="upper"
              condition={conditionCode}
              isSelected={isSelected}
              surfaces={record?.conditionRecord?.surfaces}
              toothNumber={tooth.number}
              className="w-full h-[70px]"
            />
          </div>

          {/* Tooth Number Bubble */}
          <button
            type="button"
            onClick={handleSelect}
            className={`w-7 h-7 rounded-full border flex items-center justify-center text-[11px] font-bold font-sans transition-all duration-150 cursor-pointer ${bubbleStyles}`}
            title={`Select Tooth ${displayNumber} (${tooth.label})`}
          >
            {displayNumber}
          </button>
        </>
      ) : (
        <>
          {/* Lower Tooth: Bubble on top, SVG on bottom */}
          <button
            type="button"
            onClick={handleSelect}
            className={`w-7 h-7 rounded-full border flex items-center justify-center text-[11px] font-bold font-sans transition-all duration-150 cursor-pointer ${bubbleStyles}`}
            title={`Select Tooth ${displayNumber} (${tooth.label})`}
          >
            {displayNumber}
          </button>

          <div
            onClick={handleSelect}
            className="cursor-pointer transition-transform duration-150 h-[74px] flex items-start justify-center w-full relative"
            title={`${tooth.label} (${notation === "universal" ? `Univ #${tooth.universalNumber}` : `FDI #${tooth.number}`}) - ${conditionMeta.label}`}
          >
            <ToothSvg
              type={tooth.type}
              orientation="lower"
              condition={conditionCode}
              isSelected={isSelected}
              surfaces={record?.conditionRecord?.surfaces}
              toothNumber={tooth.number}
              className="w-full h-[70px]"
            />
          </div>
        </>
      )}
    </div>
  );
}
