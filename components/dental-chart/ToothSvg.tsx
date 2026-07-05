import React from "react";
import type { ToothConditionCode } from "./types";

interface ToothSvgProps {
  type: "incisor" | "canine" | "premolar" | "molar" | "wisdom";
  orientation: "upper" | "lower";
  condition: ToothConditionCode;
  isSelected: boolean;
  className?: string;
}

export function ToothSvg({ type, orientation, condition, isSelected, className = "" }: ToothSvgProps) {
  // Determine fills and strokes based on condition (History, Treatment Done, Treatment Planned, Not Selected)
  // Legend:
  // - History: Blue
  // - Treatment Done: Green
  // - Treatment Planned: Red
  // - Not Selected: Light Grey / Slate

  let strokeColor = "#cbd5e1"; // Slate 300
  let crownFill = "url(#crownGradient)";
  let rootFill = "url(#rootGradient)";

  // Handle condition styles
  switch (condition) {
    case "cavity":
      strokeColor = "#dc2626"; // Red
      crownFill = "url(#cavityGradient)";
      break;
    case "filled":
      strokeColor = "#2563eb"; // Blue
      crownFill = "url(#filledGradient)";
      break;
    case "root_canal":
      strokeColor = "#d97706"; // Amber
      rootFill = "url(#rootCanalGradient)";
      crownFill = "url(#rootCanalCrownGradient)";
      break;
    case "crowned":
      strokeColor = "#ca8a04"; // Yellow
      crownFill = "url(#crownGoldGradient)";
      break;
    case "extracted":
    case "missing":
      strokeColor = "#94a3b8"; // Slate 400
      crownFill = "transparent";
      rootFill = "transparent";
      break;
    case "implant":
      strokeColor = "#0d9488"; // Teal
      rootFill = "url(#implantGradient)";
      crownFill = "url(#implantCrownGradient)";
      break;
    case "bridge":
      strokeColor = "#7c3aed"; // Purple
      crownFill = "url(#bridgeGradient)";
      break;
    case "watch":
      strokeColor = "#d97706"; // Amber
      crownFill = "url(#watchGradient)";
      break;
    default:
      // healthy
      strokeColor = "#94a3b8";
      break;
  }

  // Highlight selected tooth
  if (isSelected) {
    strokeColor = "#1b5e20"; // Forest Green from the design
  }

  // Render SVG based on tooth type
  // Coordinate space: width 32, height 70
  // Upper: root at top (points up), crown at bottom.
  // Lower: crown at top, root at bottom (points down).

  const renderToothPaths = () => {
    const isUpper = orientation === "upper";
    
    // Tooth type geometries
    if (type === "molar" || type === "wisdom") {
      // Molars: wider crown, triple roots (upper) or double roots (lower)
      if (isUpper) {
        return (
          <g>
            {/* Triple Root pointing up */}
            <path
              d="M 6 35 C 5 25, 4 10, 8 6 C 10 4, 11 12, 13 22 C 14 12, 16 4, 18 6 C 21 8, 20 22, 21 28 C 22 18, 25 10, 27 12 C 29 14, 27 25, 26 35 Z"
              fill={rootFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.2}
              strokeLinejoin="round"
              className="transition-colors duration-200"
            />
            {/* Crown at bottom */}
            <path
              d="M 5 35 C 4 42, 3 58, 6 62 C 8 65, 12 66, 14 63 C 16 66, 21 66, 23 63 C 25 66, 28 65, 30 62 C 32 58, 31 42, 29 35 Z"
              fill={crownFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.2}
              strokeLinejoin="round"
              className="transition-colors duration-200"
            />
          </g>
        );
      } else {
        return (
          <g>
            {/* Crown at top */}
            <path
              d="M 5 35 C 4 28, 3 12, 6 8 C 8 5, 12 4, 14 7 C 16 4, 21 4, 23 7 C 25 4, 28 5, 30 8 C 32 12, 31 28, 29 35 Z"
              fill={crownFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.2}
              strokeLinejoin="round"
              className="transition-colors duration-200"
            />
            {/* Double Root pointing down */}
            <path
              d="M 6 35 C 5 45, 6 62, 10 65 C 12 66, 14 55, 16 48 C 18 55, 20 66, 22 65 C 26 62, 27 45, 26 35 Z"
              fill={rootFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.2}
              strokeLinejoin="round"
              className="transition-colors duration-200"
            />
          </g>
        );
      }
    } else if (type === "premolar") {
      // Premolars: medium crown, single/fused root
      if (isUpper) {
        return (
          <g>
            {/* Root pointing up */}
            <path
              d="M 10 35 C 8 22, 11 8, 16 5 C 21 8, 24 22, 22 35 Z"
              fill={rootFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.2}
              strokeLinejoin="round"
              className="transition-colors duration-200"
            />
            {/* Crown at bottom */}
            <path
              d="M 7 35 C 6 40, 5 54, 8 58 C 10 61, 14 62, 16 59 C 18 62, 22 61, 24 58 C 27 54, 26 40, 25 35 Z"
              fill={crownFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.2}
              strokeLinejoin="round"
              className="transition-colors duration-200"
            />
          </g>
        );
      } else {
        return (
          <g>
            {/* Crown at top */}
            <path
              d="M 7 35 C 6 30, 5 16, 8 12 C 10 9, 14 8, 16 11 C 18 8, 22 9, 24 12 C 27 16, 26 30, 25 35 Z"
              fill={crownFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.2}
              strokeLinejoin="round"
              className="transition-colors duration-200"
            />
            {/* Root pointing down */}
            <path
              d="M 10 35 C 8 48, 11 62, 16 65 C 21 62, 24 48, 22 35 Z"
              fill={rootFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.2}
              strokeLinejoin="round"
              className="transition-colors duration-200"
            />
          </g>
        );
      }
    } else if (type === "canine") {
      // Canines: slightly pointed crown, long single root
      if (isUpper) {
        return (
          <g>
            {/* Extra long single root pointing up */}
            <path
              d="M 11 32 C 9 18, 12 3, 16 1 C 20 3, 23 18, 21 32 Z"
              fill={rootFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.2}
              strokeLinejoin="round"
              className="transition-colors duration-200"
            />
            {/* Crown at bottom (pointed cusp) */}
            <path
              d="M 8 32 C 7 38, 7 50, 16 61 C 25 50, 25 38, 24 32 Z"
              fill={crownFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.2}
              strokeLinejoin="round"
              className="transition-colors duration-200"
            />
          </g>
        );
      } else {
        return (
          <g>
            {/* Crown at top */}
            <path
              d="M 8 38 C 7 32, 7 20, 16 9 C 25 20, 25 32, 24 38 Z"
              fill={crownFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.2}
              strokeLinejoin="round"
              className="transition-colors duration-200"
            />
            {/* Root pointing down */}
            <path
              d="M 11 38 C 9 52, 12 67, 16 69 C 20 67, 23 52, 21 38 Z"
              fill={rootFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.2}
              strokeLinejoin="round"
              className="transition-colors duration-200"
            />
          </g>
        );
      }
    } else {
      // Incisors: narrow single root, chisel-shaped crown
      if (isUpper) {
        return (
          <g>
            {/* Root pointing up */}
            <path
              d="M 11 32 C 9 18, 12 4, 16 2 C 20 4, 23 18, 21 32 Z"
              fill={rootFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.2}
              strokeLinejoin="round"
              className="transition-colors duration-200"
            />
            {/* Crown at bottom */}
            <path
              d="M 9 32 C 8 37, 7 54, 8 57 C 9 59, 13 60, 16 60 C 19 60, 23 59, 24 57 C 25 54, 24 37, 23 32 Z"
              fill={crownFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.2}
              strokeLinejoin="round"
              className="transition-colors duration-200"
            />
          </g>
        );
      } else {
        return (
          <g>
            {/* Crown at top */}
            <path
              d="M 9 38 C 8 33, 7 16, 8 13 C 9 11, 13 10, 16 10 C 19 10, 23 11, 24 13 C 25 16, 24 33, 23 38 Z"
              fill={crownFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.2}
              strokeLinejoin="round"
              className="transition-colors duration-200"
            />
            {/* Root pointing down */}
            <path
              d="M 11 38 C 9 52, 12 66, 16 68 C 20 66, 23 52, 21 38 Z"
              fill={rootFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.2}
              strokeLinejoin="round"
              className="transition-colors duration-200"
            />
          </g>
        );
      }
    }
  };

  return (
    <svg
      viewBox="0 0 32 70"
      className={`${className} select-none transition-transform duration-150 ${
        isSelected ? "scale-105 filter drop-shadow-[0_0_4px_rgba(27,94,32,0.35)]" : "hover:scale-102"
      }`}
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Shading gradients */}
        <linearGradient id="crownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id="rootGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        
        {/* Condition gradients */}
        <linearGradient id="cavityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fee2e2" />
          <stop offset="50%" stopColor="#fca5a5" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
        <linearGradient id="filledGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="50%" stopColor="#93c5fd" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="crownGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="50%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
        <linearGradient id="rootCanalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffedd5" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id="rootCanalCrownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#ffedd5" />
        </linearGradient>
        <linearGradient id="implantGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="implantCrownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f0fdfa" />
          <stop offset="100%" stopColor="#5eead4" />
        </linearGradient>
        <linearGradient id="bridgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f3e8ff" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="watchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* Renders the actual paths */}
      {condition !== "extracted" && condition !== "missing" && renderToothPaths()}
      {(condition === "extracted" || condition === "missing") && (
        <g opacity="0.25">
          {renderToothPaths()}
          {/* Red cross out indicator */}
          <line x1="2" y1="2" x2="30" y2="68" stroke="#ef4444" strokeWidth="2.5" />
          <line x1="30" y1="2" x2="2" y2="68" stroke="#ef4444" strokeWidth="2.5" />
        </g>
      )}
    </svg>
  );
}
