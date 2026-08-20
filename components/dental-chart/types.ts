/**
 * Dental Chart — Types, Metadata & Static Data
 *
 * Supports FDI World Dental Federation (ISO 3950) & Universal Numbering Systems.
 * Modeled after MolarPlus clinical odontogram standards.
 */

import type { SurfaceType } from "../../lib/types";
export type { SurfaceType };

// ─── FDI Tooth Numbers ──────────────────────────────────────────────────────

/** Permanent FDI tooth numbers (11–18, 21–28, 31–38, 41–48) */
export type PermanentToothNumber =
  | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18
  | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28
  | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38
  | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48;

/** Primary / Pediatric FDI tooth numbers (51–55, 61–65, 71–75, 81–85) */
export type PrimaryToothNumber =
  | 51 | 52 | 53 | 54 | 55
  | 61 | 62 | 63 | 64 | 65
  | 71 | 72 | 73 | 74 | 75
  | 81 | 82 | 83 | 84 | 85;

export type ToothNumber = PermanentToothNumber | PrimaryToothNumber;

// ─── Notation Systems & Sub-Views ──────────────────────────────────────────

export type NotationSystem = "fdi" | "universal";
export type ChartSubView = "dental" | "soft-tissue" | "tmj";
export type ArchType = "adult" | "child";

// ─── Tooth Conditions ──────────────────────────────────────────────────────

export type ToothConditionCode =
  | "healthy"
  | "planned"
  | "existing_work"
  | "root_canal"
  | "extracted"
  | "caries"
  | "impacted"
  | "cavity"
  | "filled"
  | "crowned"
  | "implant"
  | "bridge"
  | "missing"
  | "watch";

export interface ConditionStyle {
  label: string;
  bg: string;
  border: string;
  text: string;
  swatchBg: string;
  icon?: string;
  description?: string;
}

export const CONDITION_STYLES: Record<ToothConditionCode, ConditionStyle> = {
  healthy: {
    label: "Healthy",
    bg: "bg-emerald-50 hover:bg-emerald-100",
    border: "border-emerald-300",
    text: "text-emerald-800",
    swatchBg: "bg-emerald-500",
    icon: "✓",
    description: "Intact natural tooth structure with no active pathology",
  },
  planned: {
    label: "Planned",
    bg: "bg-amber-50 hover:bg-amber-100",
    border: "border-amber-400",
    text: "text-amber-800",
    swatchBg: "bg-amber-500",
    icon: "⏱",
    description: "Treatment planned for upcoming session",
  },
  existing_work: {
    label: "Existing Work",
    bg: "bg-blue-50 hover:bg-blue-100",
    border: "border-blue-400",
    text: "text-blue-800",
    swatchBg: "bg-blue-600",
    icon: "■",
    description: "Existing composite/amalgam restoration or past dental work",
  },
  filled: {
    label: "Filled",
    bg: "bg-blue-50 hover:bg-blue-100",
    border: "border-blue-400",
    text: "text-blue-800",
    swatchBg: "bg-blue-600",
    icon: "■",
    description: "Restored tooth with filling material",
  },
  root_canal: {
    label: "Root Canal",
    bg: "bg-orange-50 hover:bg-orange-100",
    border: "border-orange-400",
    text: "text-orange-800",
    swatchBg: "bg-orange-600",
    icon: "⟳",
    description: "Endodontic therapy completed or in progress",
  },
  extracted: {
    label: "Extracted",
    bg: "bg-slate-100 hover:bg-slate-200",
    border: "border-slate-400",
    text: "text-slate-600",
    swatchBg: "bg-rose-500",
    icon: "✕",
    description: "Tooth missing or surgically extracted",
  },
  missing: {
    label: "Missing",
    bg: "bg-slate-100 hover:bg-slate-200",
    border: "border-dashed border-slate-400",
    text: "text-slate-500",
    swatchBg: "bg-slate-400",
    icon: "✕",
    description: "Congenitally or clinically absent tooth",
  },
  caries: {
    label: "Caries",
    bg: "bg-red-50 hover:bg-red-100",
    border: "border-red-400",
    text: "text-red-800",
    swatchBg: "bg-red-600",
    icon: "●",
    description: "Active carious lesion / tooth decay",
  },
  cavity: {
    label: "Cavity",
    bg: "bg-red-50 hover:bg-red-100",
    border: "border-red-400",
    text: "text-red-800",
    swatchBg: "bg-red-600",
    icon: "●",
    description: "Active cavity requiring restoration",
  },
  impacted: {
    label: "Impacted",
    bg: "bg-purple-50 hover:bg-purple-100",
    border: "border-purple-400",
    text: "text-purple-800",
    swatchBg: "bg-purple-600",
    icon: "↑",
    description: "Unerupted or partially impacted tooth structure",
  },
  crowned: {
    label: "Crown",
    bg: "bg-yellow-50 hover:bg-yellow-100",
    border: "border-yellow-400",
    text: "text-yellow-800",
    swatchBg: "bg-yellow-500",
    icon: "♛",
    description: "Full prosthetic crown placement",
  },
  bridge: {
    label: "Bridge",
    bg: "bg-indigo-50 hover:bg-indigo-100",
    border: "border-indigo-400",
    text: "text-indigo-800",
    swatchBg: "bg-indigo-600",
    icon: "⌶",
    description: "Fixed partial denture / dental bridge abutment",
  },
  implant: {
    label: "Implant",
    bg: "bg-teal-50 hover:bg-teal-100",
    border: "border-teal-400",
    text: "text-teal-800",
    swatchBg: "bg-teal-600",
    icon: "↓",
    description: "Endosteal implant fixture integrated",
  },
  watch: {
    label: "Watch",
    bg: "bg-amber-50 hover:bg-amber-100",
    border: "border-amber-400",
    text: "text-amber-800",
    swatchBg: "bg-amber-500",
    icon: "◈",
    description: "Monitor condition at next recall",
  },
};

// ─── Data Schema Models ────────────────────────────────────────────────────

/**
 * Clean condition record matching MolarPlus tooth-level synchronization
 */
export interface ToothConditionRecord {
  patientId: string;
  casePaperId?: string;
  toothNumber: number; // 11–48 or 51–85
  surfaces: ("M" | "D" | "O" | "B" | "L" | "I" | "Labial")[];
  status: ToothConditionCode;
  diagnosis?: string;
  procedure?: string;
  note?: string;
  fee?: number;
  updatedAt: string;
}

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

export interface ToothRecord {
  id?: string;
  toothNumber: ToothNumber;
  patientId: string;
  condition: ToothConditionCode;
  notes?: string;
  treatments?: ToothTreatment[];
  plans?: ToothPlan[];
  conditionRecord?: ToothConditionRecord;
}

export interface SelectedTooth {
  number: ToothNumber;
  label: string;
  quadrant: 1 | 2 | 3 | 4;
  record?: ToothRecord;
  surfaces?: SurfaceType[];
}

export type ToothModalTab = "condition" | "add" | "history" | "plan";

// ─── FDI & Universal Mapping Tables ────────────────────────────────────────

export interface FdiTooth {
  number: ToothNumber;
  universalNumber: string;
  label: string;
  shortLabel: string;
  quadrant: 1 | 2 | 3 | 4;
  type: "incisor" | "canine" | "premolar" | "molar" | "wisdom";
  isAnterior: boolean;
  arch: "maxillary" | "mandibular";
  side: "right" | "left";
}

/** Universal numbering lookup map for permanent teeth */
const FDI_TO_UNIVERSAL_PERMANENT: Record<number, string> = {
  // Maxillary Right (Q1)
  18: "1", 17: "2", 16: "3", 15: "4", 14: "5", 13: "6", 12: "7", 11: "8",
  // Maxillary Left (Q2)
  21: "9", 22: "10", 23: "11", 24: "12", 25: "13", 26: "14", 27: "15", 28: "16",
  // Mandibular Left (Q3)
  38: "17", 37: "18", 36: "19", 35: "20", 34: "21", 33: "22", 32: "23", 31: "24",
  // Mandibular Right (Q4)
  41: "25", 42: "26", 43: "27", 44: "28", 45: "29", 46: "30", 47: "31", 48: "32",
};

/** Universal lettering lookup map for primary/pediatric teeth */
const FDI_TO_UNIVERSAL_PRIMARY: Record<number, string> = {
  // Maxillary Right Primary (Q5)
  55: "A", 54: "B", 53: "C", 52: "D", 51: "E",
  // Maxillary Left Primary (Q6)
  61: "F", 62: "G", 63: "H", 64: "I", 65: "J",
  // Mandibular Left Primary (Q7)
  75: "K", 74: "L", 73: "M", 72: "N", 71: "O",
  // Mandibular Right Primary (Q8)
  81: "P", 82: "Q", 83: "R", 84: "S", 85: "T",
};

/**
 * Get Universal notation (1-32 for Adult, A-T for Child) from FDI tooth number.
 */
export function toUniversalNotation(toothNumber: number): string {
  if (toothNumber >= 51 && toothNumber <= 85) {
    return FDI_TO_UNIVERSAL_PRIMARY[toothNumber] || String(toothNumber);
  }
  return FDI_TO_UNIVERSAL_PERMANENT[toothNumber] || String(toothNumber);
}

/**
 * Check whether a tooth is an Anterior tooth (Incisors & Canines: 11-13, 21-23, 31-33, 41-43, etc.)
 */
export function isAnteriorTooth(toothNumber: number): boolean {
  const toothDigit = toothNumber % 10;
  return toothDigit >= 1 && toothDigit <= 3;
}

/**
 * Check whether a tooth is Upper/Maxillary.
 */
export function isUpperTooth(toothNumber: number): boolean {
  const q = Math.floor(toothNumber / 10);
  return q === 1 || q === 2 || q === 5 || q === 6;
}

/**
 * Returns detailed quadrant information for a tooth number.
 */
export function getQuadrantDetails(toothNumber: number) {
  const q = Math.floor(toothNumber / 10);
  switch (q) {
    case 1:
    case 5:
      return { quadrant: 1 as const, name: "Upper Right (UR)", arch: "Maxillary", side: "Right" };
    case 2:
    case 6:
      return { quadrant: 2 as const, name: "Upper Left (UL)", arch: "Maxillary", side: "Left" };
    case 3:
    case 7:
      return { quadrant: 3 as const, name: "Lower Left (LL)", arch: "Mandibular", side: "Left" };
    case 4:
    case 8:
    default:
      return { quadrant: 4 as const, name: "Lower Right (LR)", arch: "Mandibular", side: "Right" };
  }
}

/**
 * Get human-readable anatomical name for any FDI tooth number.
 */
export function getToothAnatomicalName(toothNumber: number): string {
  const isPrimary = toothNumber >= 51 && toothNumber <= 85;
  const prefix = isPrimary ? "Primary " : "";
  const digit = toothNumber % 10;
  const { arch, side } = getQuadrantDetails(toothNumber);

  let typeName = "";
  if (digit === 1) typeName = "Central Incisor";
  else if (digit === 2) typeName = "Lateral Incisor";
  else if (digit === 3) typeName = "Canine";
  else if (digit === 4) typeName = isPrimary ? "1st Molar" : "1st Premolar";
  else if (digit === 5) typeName = isPrimary ? "2nd Molar" : "2nd Premolar";
  else if (digit === 6) typeName = "1st Molar";
  else if (digit === 7) typeName = "2nd Molar";
  else if (digit === 8) typeName = "3rd Molar (Wisdom)";
  else typeName = "Tooth";

  return `${prefix}${arch} ${side} ${typeName}`;
}

// ─── 32 Permanent Teeth Specification ──────────────────────────────────────

export const FDI_TEETH: FdiTooth[] = [
  // Quadrant 1 — Upper Right (18 -> 11)
  { number: 18, universalNumber: "1", label: "Upper Right 3rd Molar (Wisdom)", shortLabel: "UR 3rd Molar", quadrant: 1, type: "wisdom", isAnterior: false, arch: "maxillary", side: "right" },
  { number: 17, universalNumber: "2", label: "Upper Right 2nd Molar", shortLabel: "UR 2nd Molar", quadrant: 1, type: "molar", isAnterior: false, arch: "maxillary", side: "right" },
  { number: 16, universalNumber: "3", label: "Upper Right 1st Molar", shortLabel: "UR 1st Molar", quadrant: 1, type: "molar", isAnterior: false, arch: "maxillary", side: "right" },
  { number: 15, universalNumber: "4", label: "Upper Right 2nd Premolar", shortLabel: "UR 2nd Premolar", quadrant: 1, type: "premolar", isAnterior: false, arch: "maxillary", side: "right" },
  { number: 14, universalNumber: "5", label: "Upper Right 1st Premolar", shortLabel: "UR 1st Premolar", quadrant: 1, type: "premolar", isAnterior: false, arch: "maxillary", side: "right" },
  { number: 13, universalNumber: "6", label: "Upper Right Canine", shortLabel: "UR Canine", quadrant: 1, type: "canine", isAnterior: true, arch: "maxillary", side: "right" },
  { number: 12, universalNumber: "7", label: "Upper Right Lateral Incisor", shortLabel: "UR Lateral Incisor", quadrant: 1, type: "incisor", isAnterior: true, arch: "maxillary", side: "right" },
  { number: 11, universalNumber: "8", label: "Upper Right Central Incisor", shortLabel: "UR Central Incisor", quadrant: 1, type: "incisor", isAnterior: true, arch: "maxillary", side: "right" },
  // Quadrant 2 — Upper Left (21 -> 28)
  { number: 21, universalNumber: "9", label: "Upper Left Central Incisor", shortLabel: "UL Central Incisor", quadrant: 2, type: "incisor", isAnterior: true, arch: "maxillary", side: "left" },
  { number: 22, universalNumber: "10", label: "Upper Left Lateral Incisor", shortLabel: "UL Lateral Incisor", quadrant: 2, type: "incisor", isAnterior: true, arch: "maxillary", side: "left" },
  { number: 23, universalNumber: "11", label: "Upper Left Canine", shortLabel: "UL Canine", quadrant: 2, type: "canine", isAnterior: true, arch: "maxillary", side: "left" },
  { number: 24, universalNumber: "12", label: "Upper Left 1st Premolar", shortLabel: "UL 1st Premolar", quadrant: 2, type: "premolar", isAnterior: false, arch: "maxillary", side: "left" },
  { number: 25, universalNumber: "13", label: "Upper Left 2nd Premolar", shortLabel: "UL 2nd Premolar", quadrant: 2, type: "premolar", isAnterior: false, arch: "maxillary", side: "left" },
  { number: 26, universalNumber: "14", label: "Upper Left 1st Molar", shortLabel: "UL 1st Molar", quadrant: 2, type: "molar", isAnterior: false, arch: "maxillary", side: "left" },
  { number: 27, universalNumber: "15", label: "Upper Left 2nd Molar", shortLabel: "UL 2nd Molar", quadrant: 2, type: "molar", isAnterior: false, arch: "maxillary", side: "left" },
  { number: 28, universalNumber: "16", label: "Upper Left 3rd Molar (Wisdom)", shortLabel: "UL 3rd Molar", quadrant: 2, type: "wisdom", isAnterior: false, arch: "maxillary", side: "left" },
  // Quadrant 4 — Lower Right (48 -> 41)
  { number: 48, universalNumber: "32", label: "Lower Right 3rd Molar (Wisdom)", shortLabel: "LR 3rd Molar", quadrant: 4, type: "wisdom", isAnterior: false, arch: "mandibular", side: "right" },
  { number: 47, universalNumber: "31", label: "Lower Right 2nd Molar", shortLabel: "LR 2nd Molar", quadrant: 4, type: "molar", isAnterior: false, arch: "mandibular", side: "right" },
  { number: 46, universalNumber: "30", label: "Lower Right 1st Molar", shortLabel: "LR 1st Molar", quadrant: 4, type: "molar", isAnterior: false, arch: "mandibular", side: "right" },
  { number: 45, universalNumber: "29", label: "Lower Right 2nd Premolar", shortLabel: "LR 2nd Premolar", quadrant: 4, type: "premolar", isAnterior: false, arch: "mandibular", side: "right" },
  { number: 44, universalNumber: "28", label: "Lower Right 1st Premolar", shortLabel: "LR 1st Premolar", quadrant: 4, type: "premolar", isAnterior: false, arch: "mandibular", side: "right" },
  { number: 43, universalNumber: "27", label: "Lower Right Canine", shortLabel: "LR Canine", quadrant: 4, type: "canine", isAnterior: true, arch: "mandibular", side: "right" },
  { number: 42, universalNumber: "26", label: "Lower Right Lateral Incisor", shortLabel: "LR Lateral Incisor", quadrant: 4, type: "incisor", isAnterior: true, arch: "mandibular", side: "right" },
  { number: 41, universalNumber: "25", label: "Lower Right Central Incisor", shortLabel: "LR Central Incisor", quadrant: 4, type: "incisor", isAnterior: true, arch: "mandibular", side: "right" },
  // Quadrant 3 — Lower Left (31 -> 38)
  { number: 31, universalNumber: "24", label: "Lower Left Central Incisor", shortLabel: "LL Central Incisor", quadrant: 3, type: "incisor", isAnterior: true, arch: "mandibular", side: "left" },
  { number: 32, universalNumber: "23", label: "Lower Left Lateral Incisor", shortLabel: "LL Lateral Incisor", quadrant: 3, type: "incisor", isAnterior: true, arch: "mandibular", side: "left" },
  { number: 33, universalNumber: "22", label: "Lower Left Canine", shortLabel: "LL Canine", quadrant: 3, type: "canine", isAnterior: true, arch: "mandibular", side: "left" },
  { number: 34, universalNumber: "21", label: "Lower Left 1st Premolar", shortLabel: "LL 1st Premolar", quadrant: 3, type: "premolar", isAnterior: false, arch: "mandibular", side: "left" },
  { number: 35, universalNumber: "20", label: "Lower Left 2nd Premolar", shortLabel: "LL 2nd Premolar", quadrant: 3, type: "premolar", isAnterior: false, arch: "mandibular", side: "left" },
  { number: 36, universalNumber: "19", label: "Lower Left 1st Molar", shortLabel: "LL 1st Molar", quadrant: 3, type: "molar", isAnterior: false, arch: "mandibular", side: "left" },
  { number: 37, universalNumber: "18", label: "Lower Left 2nd Molar", shortLabel: "LL 2nd Molar", quadrant: 3, type: "molar", isAnterior: false, arch: "mandibular", side: "left" },
  { number: 38, universalNumber: "17", label: "Lower Left 3rd Molar (Wisdom)", shortLabel: "LL 3rd Molar", quadrant: 3, type: "wisdom", isAnterior: false, arch: "mandibular", side: "left" },
];

export const UPPER_TEETH = FDI_TEETH.slice(0, 16);
export const LOWER_TEETH = FDI_TEETH.slice(16, 32);

// ─── 20 Primary / Pediatric Teeth ──────────────────────────────────────────

export const PEDIATRIC_TEETH: FdiTooth[] = [
  // Quadrant 5 — Upper Right Primary (55 -> 51)
  { number: 55, universalNumber: "A", label: "Primary Upper Right 2nd Molar", shortLabel: "Primary UR 2nd Molar", quadrant: 1, type: "molar", isAnterior: false, arch: "maxillary", side: "right" },
  { number: 54, universalNumber: "B", label: "Primary Upper Right 1st Molar", shortLabel: "Primary UR 1st Molar", quadrant: 1, type: "molar", isAnterior: false, arch: "maxillary", side: "right" },
  { number: 53, universalNumber: "C", label: "Primary Upper Right Canine", shortLabel: "Primary UR Canine", quadrant: 1, type: "canine", isAnterior: true, arch: "maxillary", side: "right" },
  { number: 52, universalNumber: "D", label: "Primary Upper Right Lateral Incisor", shortLabel: "Primary UR Lat Incisor", quadrant: 1, type: "incisor", isAnterior: true, arch: "maxillary", side: "right" },
  { number: 51, universalNumber: "E", label: "Primary Upper Right Central Incisor", shortLabel: "Primary UR Cent Incisor", quadrant: 1, type: "incisor", isAnterior: true, arch: "maxillary", side: "right" },
  // Quadrant 6 — Upper Left Primary (61 -> 65)
  { number: 61, universalNumber: "F", label: "Primary Upper Left Central Incisor", shortLabel: "Primary UL Cent Incisor", quadrant: 2, type: "incisor", isAnterior: true, arch: "maxillary", side: "left" },
  { number: 62, universalNumber: "G", label: "Primary Upper Left Lateral Incisor", shortLabel: "Primary UL Lat Incisor", quadrant: 2, type: "incisor", isAnterior: true, arch: "maxillary", side: "left" },
  { number: 63, universalNumber: "H", label: "Primary Upper Left Canine", shortLabel: "Primary UL Canine", quadrant: 2, type: "canine", isAnterior: true, arch: "maxillary", side: "left" },
  { number: 64, universalNumber: "I", label: "Primary Upper Left 1st Molar", shortLabel: "Primary UL 1st Molar", quadrant: 2, type: "molar", isAnterior: false, arch: "maxillary", side: "left" },
  { number: 65, universalNumber: "J", label: "Primary Upper Left 2nd Molar", shortLabel: "Primary UL 2nd Molar", quadrant: 2, type: "molar", isAnterior: false, arch: "maxillary", side: "left" },
  // Quadrant 8 — Lower Right Primary (85 -> 81)
  { number: 85, universalNumber: "T", label: "Primary Lower Right 2nd Molar", shortLabel: "Primary LR 2nd Molar", quadrant: 4, type: "molar", isAnterior: false, arch: "mandibular", side: "right" },
  { number: 84, universalNumber: "S", label: "Primary Lower Right 1st Molar", shortLabel: "Primary LR 1st Molar", quadrant: 4, type: "molar", isAnterior: false, arch: "mandibular", side: "right" },
  { number: 83, universalNumber: "R", label: "Primary Lower Right Canine", shortLabel: "Primary LR Canine", quadrant: 4, type: "canine", isAnterior: true, arch: "mandibular", side: "right" },
  { number: 82, universalNumber: "Q", label: "Primary Lower Right Lateral Incisor", shortLabel: "Primary LR Lat Incisor", quadrant: 4, type: "incisor", isAnterior: true, arch: "mandibular", side: "right" },
  { number: 81, universalNumber: "P", label: "Primary Lower Right Central Incisor", shortLabel: "Primary LR Cent Incisor", quadrant: 4, type: "incisor", isAnterior: true, arch: "mandibular", side: "right" },
  // Quadrant 7 — Lower Left Primary (71 -> 75)
  { number: 71, universalNumber: "O", label: "Primary Lower Left Central Incisor", shortLabel: "Primary LL Cent Incisor", quadrant: 3, type: "incisor", isAnterior: true, arch: "mandibular", side: "left" },
  { number: 72, universalNumber: "N", label: "Primary Lower Left Lateral Incisor", shortLabel: "Primary LL Lat Incisor", quadrant: 3, type: "incisor", isAnterior: true, arch: "mandibular", side: "left" },
  { number: 73, universalNumber: "M", label: "Primary Lower Left Canine", shortLabel: "Primary LL Canine", quadrant: 3, type: "canine", isAnterior: true, arch: "mandibular", side: "left" },
  { number: 74, universalNumber: "L", label: "Primary Lower Left 1st Molar", shortLabel: "Primary LL 1st Molar", quadrant: 3, type: "molar", isAnterior: false, arch: "mandibular", side: "left" },
  { number: 75, universalNumber: "K", label: "Primary Lower Left 2nd Molar", shortLabel: "Primary LL 2nd Molar", quadrant: 3, type: "molar", isAnterior: false, arch: "mandibular", side: "left" },
];

export const UPPER_PEDIATRIC_TEETH = PEDIATRIC_TEETH.slice(0, 10);
export const LOWER_PEDIATRIC_TEETH = PEDIATRIC_TEETH.slice(10, 20);

// ─── Standard Clinical Presets (Diagnoses & Procedures) ────────────────────

export const CLINICAL_DIAGNOSES = [
  "Dental Caries (Enamel)",
  "Deep Dental Caries with Pulp Exposure",
  "Irreversible Pulpitis",
  "Periapical Abscess / Periodontitis",
  "Fractured Cusp / Cracked Tooth",
  "Defective Restoration / Secondary Caries",
  "Severe Attrition / Cervical Abrasion",
  "Impacted 3rd Molar",
  "Severe Mobility (Grade II/III)",
  "Root Stumps / Non-restorable Crown",
  "Gingival Recession & Dentin Hypersensitivity",
  "Grossly Carious Tooth",
  "Pulp Necrosis",
];

export const CLINICAL_PROCEDURES: { name: string; defaultFee: number; category: string }[] = [
  { name: "Composite Restoration (1-Surface)", defaultFee: 1200, category: "Restorative" },
  { name: "Composite Restoration (Multi-Surface)", defaultFee: 1800, category: "Restorative" },
  { name: "Glass Ionomer (GIC) Restoration", defaultFee: 1000, category: "Restorative" },
  { name: "Root Canal Treatment (Anterior)", defaultFee: 3500, category: "Endodontics" },
  { name: "Root Canal Treatment (Premolar)", defaultFee: 4200, category: "Endodontics" },
  { name: "Root Canal Treatment (Molar)", defaultFee: 5000, category: "Endodontics" },
  { name: "Re-RCT / Endodontic Retreatment", defaultFee: 6500, category: "Endodontics" },
  { name: "Post and Core Build-up", defaultFee: 2500, category: "Endodontics" },
  { name: "Zirconia / All-Ceramic Crown", defaultFee: 7500, category: "Prosthodontics" },
  { name: "PFM (Porcelain-Fused-to-Metal) Crown", defaultFee: 4500, category: "Prosthodontics" },
  { name: "E-Max Aesthetic Crown / Veneer", defaultFee: 9500, category: "Prosthodontics" },
  { name: "Dental Bridge (Per Unit)", defaultFee: 5000, category: "Prosthodontics" },
  { name: "Simple Extraction", defaultFee: 1000, category: "Oral Surgery" },
  { name: "Surgical Extraction / Impaction", defaultFee: 4000, category: "Oral Surgery" },
  { name: "Dental Implant Placement (Fixture + Crown)", defaultFee: 35000, category: "Implantology" },
  { name: "Full Mouth Scaling & Polishing", defaultFee: 1500, category: "Periodontics" },
  { name: "Deep Curettage & Root Planing", defaultFee: 2500, category: "Periodontics" },
  { name: "In-Office Teeth Whitening", defaultFee: 8000, category: "Cosmetics" },
  { name: "Night Guard / Occlusal Splint", defaultFee: 3000, category: "TMJ & Occlusion" },
  { name: "Fluoride Application / Pit & Fissure Sealant", defaultFee: 800, category: "Preventive" },
];
