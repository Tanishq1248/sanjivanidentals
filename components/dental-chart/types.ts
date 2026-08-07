/**
 * Dental Chart — Types & Static Data
 *
 * Uses the FDI World Dental Federation numbering system (ISO 3950)
 */

// ─── FDI Tooth Number ──────────────────────────────────────────────────────

/** A valid FDI tooth number (permanent or primary). */
export type ToothNumber =
  | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18
  | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28
  | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38
  | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48
  | 51 | 52 | 53 | 54 | 55
  | 61 | 62 | 63 | 64 | 65
  | 71 | 72 | 73 | 74 | 75
  | 81 | 82 | 83 | 84 | 85;

// ─── Tooth Conditions ──────────────────────────────────────────────────────

export type ToothConditionCode =
  | "healthy"
  | "cavity"
  | "filled"
  | "extracted"
  | "crowned"
  | "root_canal"
  | "bridge"
  | "implant"
  | "missing"
  | "impacted"
  | "watch";

export interface ConditionStyle {
  label: string;
  bg: string;
  border: string;
  text: string;
  swatchBg: string;
  icon?: string;
}

export const CONDITION_STYLES: Record<ToothConditionCode, ConditionStyle> = {
  healthy: {
    label: "Healthy",
    bg: "bg-white hover:bg-emerald-50",
    border: "border-slate-200 hover:border-emerald-300",
    text: "text-slate-600",
    swatchBg: "bg-white border border-slate-300",
  },
  cavity: {
    label: "Cavity",
    bg: "bg-red-50 hover:bg-red-100",
    border: "border-red-300",
    text: "text-red-700",
    swatchBg: "bg-red-400",
    icon: "●",
  },
  filled: {
    label: "Filled",
    bg: "bg-blue-50 hover:bg-blue-100",
    border: "border-blue-300",
    text: "text-blue-700",
    swatchBg: "bg-blue-400",
    icon: "■",
  },
  extracted: {
    label: "Extracted",
    bg: "bg-slate-100 hover:bg-slate-200",
    border: "border-slate-300",
    text: "text-slate-400",
    swatchBg: "bg-slate-400",
    icon: "✕",
  },
  crowned: {
    label: "Crown",
    bg: "bg-yellow-50 hover:bg-yellow-100",
    border: "border-yellow-300",
    text: "text-yellow-700",
    swatchBg: "bg-yellow-400",
    icon: "♛",
  },
  root_canal: {
    label: "Root Canal",
    bg: "bg-orange-50 hover:bg-orange-100",
    border: "border-orange-300",
    text: "text-orange-700",
    swatchBg: "bg-orange-400",
    icon: "⟳",
  },
  bridge: {
    label: "Bridge",
    bg: "bg-purple-50 hover:bg-purple-100",
    border: "border-purple-300",
    text: "text-purple-700",
    swatchBg: "bg-purple-400",
    icon: "⌶",
  },
  implant: {
    label: "Implant",
    bg: "bg-teal-50 hover:bg-teal-100",
    border: "border-teal-300",
    text: "text-teal-700",
    swatchBg: "bg-teal-400",
    icon: "↓",
  },
  missing: {
    label: "Missing",
    bg: "bg-slate-50 hover:bg-slate-100",
    border: "border-dashed border-slate-300",
    text: "text-slate-300",
    swatchBg: "bg-slate-200",
  },
  impacted: {
    label: "Impacted",
    bg: "bg-pink-50 hover:bg-pink-100",
    border: "border-pink-300",
    text: "text-pink-700",
    swatchBg: "bg-pink-400",
    icon: "↑",
  },
  watch: {
    label: "Watch",
    bg: "bg-amber-50 hover:bg-amber-100",
    border: "border-amber-300",
    text: "text-amber-700",
    swatchBg: "bg-amber-400",
    icon: "◈",
  },
};

import type { SurfaceType } from "../../lib/types";
export type { SurfaceType };

/**
 * Check whether a tooth is an Anterior tooth (Incisor or Canine).
 * FDI numbers ending in 1, 2, 3 (e.g. 11-13, 21-23, 31-33, 41-43, 51-53, 61-63, 71-73, 81-83) are Anterior.
 */
export function isAnteriorTooth(toothNumber: number): boolean {
  const toothDigit = toothNumber % 10;
  return toothDigit >= 1 && toothDigit <= 3;
}

// ─── Tooth Treatment and Plan models ──────────────────────────────────────────

export interface ToothTreatment {
  id: string;
  treatment: string;
  surfaces?: SurfaceType[];
  status: string;
  date: string;
  fee: number;
  notes?: string;
}

export interface ToothPlan {
  id: string;
  treatment: string;
  surfaces?: SurfaceType[];
  status: "Planned";
  date: string;
  fee: number;
  notes?: string;
}

// ─── Tooth Record ──────────────────────────────────────────────────────────

export interface ToothRecord {
  id?: string;
  toothNumber: ToothNumber;
  patientId: string;
  condition: ToothConditionCode;
  notes?: string;
  treatments?: ToothTreatment[];
  plans?: ToothPlan[];
}

// ─── Selected Tooth ────────────────────────────────────────────────────────

export interface SelectedTooth {
  number: ToothNumber;
  label: string;
  quadrant: 1 | 2 | 3 | 4;
  record?: ToothRecord;
}

// ─── Modal Tab IDs ─────────────────────────────────────────────────────────

export type ToothModalTab = "history" | "add" | "plan";

// ─── FDI Tooth Metadata ────────────────────────────────────────────────────

export interface FdiTooth {
  number: ToothNumber;
  label: string;
  quadrant: 1 | 2 | 3 | 4;
  type: "incisor" | "canine" | "premolar" | "molar" | "wisdom";
}

// ─── Complete FDI 32 permanent teeth ─────────────────────────────────────

export const FDI_TEETH: FdiTooth[] = [
  // Quadrant 1 — Upper Right
  { number: 18, label: "Upper Right 3rd Molar (Wisdom)", quadrant: 1, type: "wisdom" },
  { number: 17, label: "Upper Right 2nd Molar", quadrant: 1, type: "molar" },
  { number: 16, label: "Upper Right 1st Molar", quadrant: 1, type: "molar" },
  { number: 15, label: "Upper Right 2nd Premolar", quadrant: 1, type: "premolar" },
  { number: 14, label: "Upper Right 1st Premolar", quadrant: 1, type: "premolar" },
  { number: 13, label: "Upper Right Canine", quadrant: 1, type: "canine" },
  { number: 12, label: "Upper Right Lateral Incisor", quadrant: 1, type: "incisor" },
  { number: 11, label: "Upper Right Central Incisor", quadrant: 1, type: "incisor" },
  // Quadrant 2 — Upper Left
  { number: 21, label: "Upper Left Central Incisor", quadrant: 2, type: "incisor" },
  { number: 22, label: "Upper Left Lateral Incisor", quadrant: 2, type: "incisor" },
  { number: 23, label: "Upper Left Canine", quadrant: 2, type: "canine" },
  { number: 24, label: "Upper Left 1st Premolar", quadrant: 2, type: "premolar" },
  { number: 25, label: "Upper Left 2nd Premolar", quadrant: 2, type: "premolar" },
  { number: 26, label: "Upper Left 1st Molar", quadrant: 2, type: "molar" },
  { number: 27, label: "Upper Left 2nd Molar", quadrant: 2, type: "molar" },
  { number: 28, label: "Upper Left 3rd Molar (Wisdom)", quadrant: 2, type: "wisdom" },
  // Quadrant 4 — Lower Right
  { number: 48, label: "Lower Right 3rd Molar (Wisdom)", quadrant: 4, type: "wisdom" },
  { number: 47, label: "Lower Right 2nd Molar", quadrant: 4, type: "molar" },
  { number: 46, label: "Lower Right 1st Molar", quadrant: 4, type: "molar" },
  { number: 45, label: "Lower Right 2nd Premolar", quadrant: 4, type: "premolar" },
  { number: 44, label: "Lower Right 1st Premolar", quadrant: 4, type: "premolar" },
  { number: 43, label: "Lower Right Canine", quadrant: 4, type: "canine" },
  { number: 42, label: "Lower Right Lateral Incisor", quadrant: 4, type: "incisor" },
  { number: 41, label: "Lower Right Central Incisor", quadrant: 4, type: "incisor" },
  // Quadrant 3 — Lower Left
  { number: 31, label: "Lower Left Central Incisor", quadrant: 3, type: "incisor" },
  { number: 32, label: "Lower Left Lateral Incisor", quadrant: 3, type: "incisor" },
  { number: 33, label: "Lower Left Canine", quadrant: 3, type: "canine" },
  { number: 34, label: "Lower Left 1st Premolar", quadrant: 3, type: "premolar" },
  { number: 35, label: "Lower Left 2nd Premolar", quadrant: 3, type: "premolar" },
  { number: 36, label: "Lower Left 1st Molar", quadrant: 3, type: "molar" },
  { number: 37, label: "Lower Left 2nd Molar", quadrant: 3, type: "molar" },
  { number: 38, label: "Lower Left 3rd Molar (Wisdom)", quadrant: 3, type: "wisdom" },
];

export const UPPER_TEETH = FDI_TEETH.slice(0, 16);
export const LOWER_TEETH = FDI_TEETH.slice(16, 32);

// ─── Pediatric FDI Teeth ──────────────────────────────────────────────────

export const PEDIATRIC_TEETH: FdiTooth[] = [
  // Quadrant 5 — Upper Right Primary
  { number: 55, label: "Primary Upper Right 2nd Molar", quadrant: 1, type: "molar" },
  { number: 54, label: "Primary Upper Right 1st Molar", quadrant: 1, type: "molar" },
  { number: 53, label: "Primary Upper Right Canine", quadrant: 1, type: "canine" },
  { number: 52, label: "Primary Upper Right Lateral Incisor", quadrant: 1, type: "incisor" },
  { number: 51, label: "Primary Upper Right Central Incisor", quadrant: 1, type: "incisor" },
  // Quadrant 6 — Upper Left Primary
  { number: 61, label: "Primary Upper Left Central Incisor", quadrant: 2, type: "incisor" },
  { number: 62, label: "Primary Upper Left Lateral Incisor", quadrant: 2, type: "incisor" },
  { number: 63, label: "Primary Upper Left Canine", quadrant: 2, type: "canine" },
  { number: 64, label: "Primary Upper Left 1st Molar", quadrant: 2, type: "molar" },
  { number: 65, label: "Primary Upper Left 2nd Molar", quadrant: 2, type: "molar" },
  // Quadrant 8 — Lower Right Primary
  { number: 85, label: "Primary Lower Right 2nd Molar", quadrant: 4, type: "molar" },
  { number: 84, label: "Primary Lower Right 1st Molar", quadrant: 4, type: "molar" },
  { number: 83, label: "Primary Lower Right Canine", quadrant: 4, type: "canine" },
  { number: 82, label: "Primary Lower Right Lateral Incisor", quadrant: 4, type: "incisor" },
  { number: 81, label: "Primary Lower Right Central Incisor", quadrant: 4, type: "incisor" },
  // Quadrant 7 — Lower Left Primary
  { number: 71, label: "Primary Lower Left Central Incisor", quadrant: 3, type: "incisor" },
  { number: 72, label: "Primary Lower Left Lateral Incisor", quadrant: 3, type: "incisor" },
  { number: 73, label: "Primary Lower Left Canine", quadrant: 3, type: "canine" },
  { number: 74, label: "Primary Lower Left 1st Molar", quadrant: 3, type: "molar" },
  { number: 75, label: "Primary Lower Left 2nd Molar", quadrant: 3, type: "molar" },
];

export const UPPER_PEDIATRIC_TEETH = PEDIATRIC_TEETH.slice(0, 10);
export const LOWER_PEDIATRIC_TEETH = PEDIATRIC_TEETH.slice(10, 20);
