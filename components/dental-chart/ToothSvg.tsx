import React from "react";
import type { ToothConditionCode } from "./types";
import type { SurfaceType } from "../../lib/types";

interface ToothSvgProps {
  type: "incisor" | "canine" | "premolar" | "molar" | "wisdom";
  orientation: "upper" | "lower";
  condition: ToothConditionCode;
  isSelected: boolean;
  surfaces?: SurfaceType[];
  toothNumber?: number;
  className?: string;
}

export function ToothSvg({
  type,
  orientation,
  condition,
  isSelected,
  surfaces = [],
  toothNumber,
  className = "",
}: ToothSvgProps) {
  const isUpper = orientation === "upper";

  // Normalize condition
  const cond = condition || "healthy";
  const isExtracted = cond === "extracted" || cond === "missing";
  const isPlanned = cond === "planned" || cond === "watch";
  const isExistingWork = cond === "existing_work" || cond === "filled";
  const isRootCanal = cond === "root_canal";
  const isCaries = cond === "caries" || cond === "cavity";
  const isCrowned = cond === "crowned";
  const isImplant = cond === "implant";
  const isImpacted = cond === "impacted";

  // Dynamic Base Strokes & Fills
  let strokeColor = isSelected ? "#4f46e5" : "#94a3b8"; // Indigo-600 when selected, Slate-400 default
  let crownFill = "url(#enamelGradient)";
  let rootFill = "url(#dentinRootGradient)";

  if (isPlanned) {
    strokeColor = isSelected ? "#4f46e5" : "#f59e0b"; // Amber-500
    crownFill = "url(#plannedGradient)";
    rootFill = "url(#plannedRootGradient)";
  } else if (isExistingWork) {
    strokeColor = isSelected ? "#4f46e5" : "#2563eb"; // Blue-600
    crownFill = "url(#existingWorkGradient)";
    rootFill = "url(#dentinRootGradient)";
  } else if (isRootCanal) {
    strokeColor = isSelected ? "#4f46e5" : "#ea580c"; // Orange-600
    crownFill = "url(#rctCrownGradient)";
    rootFill = "url(#rctRootGradient)";
  } else if (isCaries) {
    strokeColor = isSelected ? "#4f46e5" : "#b91c1c"; // Red-700
    crownFill = "url(#cariesGradient)";
  } else if (isCrowned) {
    strokeColor = isSelected ? "#4f46e5" : "#d97706"; // Amber-600
    crownFill = "url(#goldCrownGradient)";
  } else if (isImplant) {
    strokeColor = isSelected ? "#4f46e5" : "#0d9488"; // Teal-600
    crownFill = "url(#implantCrownGradient)";
    rootFill = "url(#titaniumImplantGradient)";
  }

  // Coordinate system: viewBox 0 0 36 76
  // Upper Jaw: Root points UP (Y: 4 -> 36), Crown is DOWN (Y: 36 -> 72)
  // Lower Jaw: Crown is UP (Y: 4 -> 40), Root points DOWN (Y: 40 -> 72)

  // ─── ANATOMICAL PATHS BY TOOTH MORPHOLOGY ───

  const renderAnatomicalCrown = () => {
    if (type === "molar" || type === "wisdom") {
      // Quadricuspid / Multi-cuspid Molar Crown
      if (isUpper) {
        return (
          <g id="crown-upper-molar">
            {/* Main Upper Molar Crown Body */}
            <path
              d="M 5 36 C 4 45, 3 61, 6 67 C 8 71, 13 72, 16 68 C 18 72, 23 72, 25 68 C 28 72, 31 71, 33 67 C 35 61, 34 45, 33 36 Z"
              fill={crownFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.3}
              strokeLinejoin="round"
            />
            {/* Occlusal Fissures & Cusp Contour Lines */}
            <path
              d="M 10 50 C 13 54, 23 54, 27 50 M 18 42 L 18 64"
              stroke={isCaries ? "#78350f" : "#cbd5e1"}
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
              opacity="0.8"
            />
          </g>
        );
      } else {
        return (
          <g id="crown-lower-molar">
            {/* Main Lower Molar Crown Body */}
            <path
              d="M 5 40 C 4 31, 3 15, 6 9 C 8 5, 13 4, 16 8 C 18 4, 23 4, 25 8 C 28 4, 31 5, 33 9 C 35 15, 34 31, 33 40 Z"
              fill={crownFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.3}
              strokeLinejoin="round"
            />
            {/* Occlusal Fissures */}
            <path
              d="M 10 26 C 13 22, 23 22, 27 26 M 18 12 L 18 34"
              stroke={isCaries ? "#78350f" : "#cbd5e1"}
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
              opacity="0.8"
            />
          </g>
        );
      }
    } else if (type === "premolar") {
      // Bicuspid Premolar Crown
      if (isUpper) {
        return (
          <g id="crown-upper-premolar">
            <path
              d="M 8 36 C 6 43, 6 60, 9 66 C 12 70, 16 71, 18 67 C 20 71, 25 70, 28 66 C 31 60, 31 43, 29 36 Z"
              fill={crownFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.3}
              strokeLinejoin="round"
            />
            {/* Cusp Grooves */}
            <path
              d="M 13 48 C 16 52, 21 52, 24 48 M 18 40 L 18 62"
              stroke={isCaries ? "#78350f" : "#cbd5e1"}
              strokeWidth="1"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
            />
          </g>
        );
      } else {
        return (
          <g id="crown-lower-premolar">
            <path
              d="M 8 40 C 6 33, 6 16, 9 10 C 12 6, 16 5, 18 9 C 20 5, 25 6, 28 10 C 31 16, 31 33, 29 40 Z"
              fill={crownFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.3}
              strokeLinejoin="round"
            />
            <path
              d="M 13 28 C 16 24, 21 24, 24 28 M 18 14 L 18 36"
              stroke={isCaries ? "#78350f" : "#cbd5e1"}
              strokeWidth="1"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
            />
          </g>
        );
      }
    } else if (type === "canine") {
      // Pointed Cuspid Canine Crown
      if (isUpper) {
        return (
          <g id="crown-upper-canine">
            <path
              d="M 9 34 C 7 42, 8 56, 18 71 C 29 56, 30 42, 28 34 Z"
              fill={crownFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.3}
              strokeLinejoin="round"
            />
            {/* Labial Ridge Accent */}
            <path
              d="M 18 38 L 18 66"
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.7"
            />
          </g>
        );
      } else {
        return (
          <g id="crown-lower-canine">
            <path
              d="M 9 42 C 7 34, 8 20, 18 5 C 29 20, 30 34, 28 42 Z"
              fill={crownFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.3}
              strokeLinejoin="round"
            />
            <path
              d="M 18 38 L 18 10"
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.7"
            />
          </g>
        );
      }
    } else {
      // Incisor Chisel Crown
      if (isUpper) {
        return (
          <g id="crown-upper-incisor">
            <path
              d="M 9 34 C 8 40, 8 60, 10 66 C 12 69, 25 69, 27 66 C 29 60, 29 40, 28 34 Z"
              fill={crownFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.3}
              strokeLinejoin="round"
            />
            {/* Mamelon / Incisal edge detail */}
            <line x1="12" y1="67" x2="25" y2="67" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        );
      } else {
        return (
          <g id="crown-lower-incisor">
            <path
              d="M 9 42 C 8 36, 8 16, 10 10 C 12 7, 25 7, 27 10 C 29 16, 29 36, 28 42 Z"
              fill={crownFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.3}
              strokeLinejoin="round"
            />
            <line x1="12" y1="9" x2="25" y2="9" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        );
      }
    }
  };

  const renderAnatomicalRoots = () => {
    if (isImplant) {
      // Titanium Implant Screw Vector
      if (isUpper) {
        return (
          <g id="implant-upper-screw">
            <path
              d="M 13 36 L 13 8 C 13 5, 23 5, 23 8 L 23 36 Z"
              fill={rootFill}
              stroke={strokeColor}
              strokeWidth="1.2"
            />
            {/* Screw Threads */}
            <line x1="11" y1="12" x2="25" y2="12" stroke="#475569" strokeWidth="1.5" />
            <line x1="11" y1="18" x2="25" y2="18" stroke="#475569" strokeWidth="1.5" />
            <line x1="11" y1="24" x2="25" y2="24" stroke="#475569" strokeWidth="1.5" />
            <line x1="11" y1="30" x2="25" y2="30" stroke="#475569" strokeWidth="1.5" />
          </g>
        );
      } else {
        return (
          <g id="implant-lower-screw">
            <path
              d="M 13 40 L 13 68 C 13 71, 23 71, 23 68 L 23 40 Z"
              fill={rootFill}
              stroke={strokeColor}
              strokeWidth="1.2"
            />
            <line x1="11" y1="46" x2="25" y2="46" stroke="#475569" strokeWidth="1.5" />
            <line x1="11" y1="52" x2="25" y2="52" stroke="#475569" strokeWidth="1.5" />
            <line x1="11" y1="58" x2="25" y2="58" stroke="#475569" strokeWidth="1.5" />
            <line x1="11" y1="64" x2="25" y2="64" stroke="#475569" strokeWidth="1.5" />
          </g>
        );
      }
    }

    if (type === "molar" || type === "wisdom") {
      if (isUpper) {
        // Upper Molar: Triple Root System (Mesiobuccal, Distobuccal, Palatal)
        return (
          <g id="roots-upper-molar">
            {/* Mesiobuccal (Left), Palatal (Center), Distobuccal (Right) */}
            <path
              d="M 6 36 C 5 24, 4 9, 8 5 C 10 3, 11 11, 14 22 C 15 11, 17 3, 19 5 C 21 7, 21 21, 23 26 C 24 16, 27 7, 29 9 C 31 11, 30 25, 31 36 Z"
              fill={rootFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.3}
              strokeLinejoin="round"
            />
            {/* Endodontic Lines for Root Canal */}
            {isRootCanal && (
              <g id="rct-upper-molar-canals">
                <path d="M 8 7 C 9 14, 11 26, 12 36" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 19 7 C 19 14, 18 26, 18 36" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 29 11 C 28 18, 25 26, 24 36" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
                {/* Pulpal Chamber Marker */}
                <circle cx="18" cy="38" r="2.5" fill="#ef4444" />
              </g>
            )}
          </g>
        );
      } else {
        // Lower Molar: Double Root System (Mesial & Distal)
        return (
          <g id="roots-lower-molar">
            <path
              d="M 6 40 C 5 52, 6 69, 10 72 C 12 73, 15 62, 17 52 C 19 62, 22 73, 25 72 C 29 69, 30 52, 30 40 Z"
              fill={rootFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.3}
              strokeLinejoin="round"
            />
            {/* Endodontic Lines for Lower Molar */}
            {isRootCanal && (
              <g id="rct-lower-molar-canals">
                <path d="M 10 70 C 11 60, 13 48, 14 40" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 25 70 C 24 60, 22 48, 22 40" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="18" cy="38" r="2.5" fill="#ef4444" />
              </g>
            )}
          </g>
        );
      }
    } else if (type === "premolar") {
      if (isUpper) {
        // Upper Premolar: Bifurcated Double Apex
        return (
          <g id="roots-upper-premolar">
            <path
              d="M 10 36 C 8 23, 10 7, 14 4 C 16 6, 17 16, 19 16 C 20 16, 21 6, 23 4 C 27 7, 28 23, 26 36 Z"
              fill={rootFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.3}
              strokeLinejoin="round"
            />
            {isRootCanal && (
              <g id="rct-upper-premolar-canals">
                <path d="M 14 6 C 14 16, 16 26, 17 36" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 23 6 C 22 16, 20 26, 19 36" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="18" cy="38" r="2.2" fill="#ef4444" />
              </g>
            )}
          </g>
        );
      } else {
        // Lower Premolar: Single Sturdy Root
        return (
          <g id="roots-lower-premolar">
            <path
              d="M 11 40 C 9 53, 12 68, 18 72 C 24 68, 27 53, 25 40 Z"
              fill={rootFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.3}
              strokeLinejoin="round"
            />
            {isRootCanal && (
              <g id="rct-lower-premolar-canals">
                <path d="M 18 70 L 18 40" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                <circle cx="18" cy="38" r="2.2" fill="#ef4444" />
              </g>
            )}
          </g>
        );
      }
    } else if (type === "canine") {
      // Canine: Long Single Tapered Root
      if (isUpper) {
        return (
          <g id="roots-upper-canine">
            <path
              d="M 11 34 C 9 19, 12 3, 18 1 C 24 3, 27 19, 25 34 Z"
              fill={rootFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.3}
              strokeLinejoin="round"
            />
            {isRootCanal && (
              <g id="rct-upper-canine-canals">
                <path d="M 18 3 L 18 34" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                <circle cx="18" cy="36" r="2.2" fill="#ef4444" />
              </g>
            )}
          </g>
        );
      } else {
        return (
          <g id="roots-lower-canine">
            <path
              d="M 11 42 C 9 57, 12 73, 18 75 C 24 73, 27 57, 25 42 Z"
              fill={rootFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.3}
              strokeLinejoin="round"
            />
            {isRootCanal && (
              <g id="rct-lower-canine-canals">
                <path d="M 18 73 L 18 42" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                <circle cx="18" cy="40" r="2.2" fill="#ef4444" />
              </g>
            )}
          </g>
        );
      }
    } else {
      // Incisor: Slender Straight Root
      if (isUpper) {
        return (
          <g id="roots-upper-incisor">
            <path
              d="M 12 34 C 10 19, 13 4, 18 2 C 23 4, 26 19, 24 34 Z"
              fill={rootFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.3}
              strokeLinejoin="round"
            />
            {isRootCanal && (
              <g id="rct-upper-incisor-canals">
                <path d="M 18 4 L 18 34" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                <circle cx="18" cy="36" r="2.2" fill="#ef4444" />
              </g>
            )}
          </g>
        );
      } else {
        return (
          <g id="roots-lower-incisor">
            <path
              d="M 12 42 C 10 57, 13 72, 18 74 C 23 72, 26 57, 24 42 Z"
              fill={rootFill}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1.3}
              strokeLinejoin="round"
            />
            {isRootCanal && (
              <g id="rct-lower-incisor-canals">
                <path d="M 18 72 L 18 42" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                <circle cx="18" cy="40" r="2.2" fill="#ef4444" />
              </g>
            )}
          </g>
        );
      }
    }
  };

  // ─── CARIES / CAVITY SURFACE LESIONS ───
  const renderCariesLesions = () => {
    if (!isCaries) return null;
    const cy = isUpper ? 52 : 24;
    return (
      <g id="caries-lesion-overlay">
        <circle cx="18" cy={cy} r="4.5" fill="#451a03" stroke="#b91c1c" strokeWidth="1" />
        <circle cx="18" cy={cy} r="2.5" fill="#1c0a00" />
      </g>
    );
  };

  // ─── EXISTING WORK RESTORATION OVERLAY ───
  const renderRestorationOverlay = () => {
    if (!isExistingWork) return null;
    const cy = isUpper ? 52 : 24;
    return (
      <g id="restoration-overlay">
        <rect
          x="12"
          y={cy - 4}
          width="12"
          height="8"
          rx="3"
          fill="#2563eb"
          stroke="#1d4ed8"
          strokeWidth="1"
          opacity="0.9"
        />
        <line x1="14" y1={cy} x2="22" y2={cy} stroke="#93c5fd" strokeWidth="1" strokeLinecap="round" />
      </g>
    );
  };

  return (
    <svg
      viewBox="0 0 36 76"
      className={`${className} select-none transition-all duration-200 ${
        isSelected
          ? "scale-110 drop-shadow-[0_0_8px_rgba(79,70,229,0.5)] z-20"
          : "hover:scale-105 hover:drop-shadow-sm"
      }`}
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Natural Tooth Enamel Gradient */}
        <linearGradient id="enamelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>

        {/* Dentin & Root Gradient */}
        <linearGradient id="dentinRootGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="70%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>

        {/* Planned / Yellow Amber Gradients */}
        <linearGradient id="plannedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="60%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        <linearGradient id="plannedRootGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#fcd34d" />
        </linearGradient>

        {/* Existing Work / Blue Gradients */}
        <linearGradient id="existingWorkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eff6ff" />
          <stop offset="50%" stopColor="#bfdbfe" />
          <stop offset="100%" stopColor="#93c5fd" />
        </linearGradient>

        {/* Root Canal Gradients */}
        <linearGradient id="rctCrownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff7ed" />
          <stop offset="100%" stopColor="#ffedd5" />
        </linearGradient>
        <linearGradient id="rctRootGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffedd5" />
          <stop offset="100%" stopColor="#fed7aa" />
        </linearGradient>

        {/* Caries Gradients */}
        <linearGradient id="cariesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef2f2" />
          <stop offset="60%" stopColor="#fecaca" />
          <stop offset="100%" stopColor="#f87171" />
        </linearGradient>

        {/* Crown Gold Gradient */}
        <linearGradient id="goldCrownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>

        {/* Titanium Implant Gradients */}
        <linearGradient id="titaniumImplantGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="implantCrownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f0fdfa" />
          <stop offset="100%" stopColor="#ccfbf1" />
        </linearGradient>
      </defs>

      {/* ── Selection Ring Halo ── */}
      {isSelected && (
        <rect
          x="1"
          y="1"
          width="34"
          height="74"
          rx="8"
          fill="rgba(99, 102, 241, 0.08)"
          stroke="#4f46e5"
          strokeWidth="1.8"
          strokeDasharray="4 2"
          className="animate-pulse"
        />
      )}

      {/* Normal Tooth Elements */}
      {!isExtracted && (
        <g>
          {renderAnatomicalRoots()}
          {renderAnatomicalCrown()}
          {renderRestorationOverlay()}
          {renderCariesLesions()}

          {/* Impacted Arrow / Indicator */}
          {isImpacted && (
            <g id="impacted-indicator" transform={isUpper ? "translate(4, 2)" : "translate(4, 60)"}>
              <circle cx="14" cy="7" r="7" fill="#7e22ce" />
              <path d="M 14 3 L 11 8 L 17 8 Z" fill="#ffffff" />
            </g>
          )}
        </g>
      )}

      {/* Extracted / Missing Diagnostic Cross Overlay */}
      {isExtracted && (
        <g opacity="0.3">
          {renderAnatomicalRoots()}
          {renderAnatomicalCrown()}
          <line x1="4" y1="6" x2="32" y2="70" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
          <line x1="32" y1="6" x2="4" y2="70" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
