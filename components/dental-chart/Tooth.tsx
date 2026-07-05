"use client";

import React from "react";
import type { FdiTooth, ToothRecord } from "./types";
import { ToothSvg } from "./ToothSvg";

interface ToothProps {
  tooth: FdiTooth;
  record?: ToothRecord;
  isSelected: boolean;
  onClick: (tooth: FdiTooth, record?: ToothRecord) => void;
  orientation: "upper" | "lower";
}

export function Tooth({ tooth, record, isSelected, onClick, orientation }: ToothProps) {
  const conditionCode = record?.condition ?? "healthy";

  const handleSelect = () => {
    onClick(tooth, record);
  };

  // Sizing definitions for layout
  const widthClass = tooth.type === "wisdom"
    ? "w-8"
    : tooth.type === "molar"
    ? "w-9"
    : "w-8";

  // Bubble style based on selection
  const bubbleStyles = isSelected
    ? "bg-[#1b5e20] text-white border-[#1b5e20]"
    : "bg-white text-slate-700 border-slate-300 hover:border-[#1b5e20] hover:text-[#1b5e20]";

  return (
    <div className={`flex flex-col items-center gap-1.5 ${widthClass} select-none`}>
      {orientation === "upper" ? (
        <>
          {/* Upper Tooth: SVG on top, Bubble on bottom */}
          <div
            onClick={handleSelect}
            className="cursor-pointer transition-transform duration-150 h-[70px] flex items-end justify-center"
            title={`${tooth.label} (Click to select)`}
          >
            <ToothSvg
              type={tooth.type}
              orientation="upper"
              condition={conditionCode}
              isSelected={isSelected}
              className="w-full h-[65px]"
            />
          </div>
          
          <button
            type="button"
            onClick={handleSelect}
            className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold font-sans transition-all duration-150 cursor-pointer shadow-sm ${bubbleStyles}`}
            title={`Select Tooth ${tooth.number}`}
          >
            {tooth.number}
          </button>
        </>
      ) : (
        <>
          {/* Lower Tooth: Bubble on top, SVG on bottom */}
          <button
            type="button"
            onClick={handleSelect}
            className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold font-sans transition-all duration-150 cursor-pointer shadow-sm ${bubbleStyles}`}
            title={`Select Tooth ${tooth.number}`}
          >
            {tooth.number}
          </button>
          
          <div
            onClick={handleSelect}
            className="cursor-pointer transition-transform duration-150 h-[70px] flex items-start justify-center"
            title={`${tooth.label} (Click to select)`}
          >
            <ToothSvg
              type={tooth.type}
              orientation="lower"
              condition={conditionCode}
              isSelected={isSelected}
              className="w-full h-[65px]"
            />
          </div>
        </>
      )}
    </div>
  );
}
