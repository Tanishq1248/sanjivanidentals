/**
 * Dental Chart — Zustand State Store
 *
 * Manages UI and patient state for the interactive dental chart,
 * supporting MolarPlus features (FDI & Universal notation, sub-views,
 * surface selections, condition records, and encounter synchronization).
 */

import { create } from "zustand";
import type {
  SelectedTooth,
  ToothModalTab,
  ToothRecord,
  ToothTreatment,
  ToothPlan,
  ToothNumber,
  ToothConditionCode,
  ToothConditionRecord,
  NotationSystem,
  ChartSubView,
} from "../../components/dental-chart/types";
import type { SurfaceType } from "../../lib/types";
import { getTreatmentStatus } from "../types";

interface DentalChartState {
  selectedTooth: SelectedTooth | null;
  isModalOpen: boolean;
  activeTab: ToothModalTab;
  pediatric: boolean;
  notation: NotationSystem;
  subView: ChartSubView;
  selectedSurfaces: SurfaceType[];

  // Mapping of toothNumber -> ToothRecord loaded from Firestore
  toothRecords: Record<number, ToothRecord>;
  
  // Mapping of toothNumber -> ToothConditionRecord (MolarPlus standard)
  toothConditions: Record<number, ToothConditionRecord>;

  // ─── Actions ────────────────────────────────────────────────────────────
  openTooth: (tooth: SelectedTooth) => void;
  closeTooth: () => void;
  setActiveTab: (tab: ToothModalTab) => void;
  setPediatric: (pediatric: boolean) => void;
  setNotation: (notation: NotationSystem) => void;
  setSubView: (subView: ChartSubView) => void;
  setSelectedSurfaces: (surfaces: SurfaceType[]) => void;
  toggleSurface: (surface: SurfaceType) => void;
  setToothCondition: (record: ToothConditionRecord) => void;
  syncEncounters: (encounters: any[]) => void;

  // Local mutations (UI instant feedback)
  addTreatment: (toothNumber: ToothNumber, treatment: Omit<ToothTreatment, "id">) => void;
  addPlan: (toothNumber: ToothNumber, plan: Omit<ToothPlan, "id">) => void;
  resetChart: () => void;
}

export const useDentalChartStore = create<DentalChartState>((set, get) => ({
  selectedTooth: null,
  isModalOpen: false,
  activeTab: "condition",
  pediatric: false,
  notation: "fdi",
  subView: "dental",
  selectedSurfaces: [],
  toothRecords: {},
  toothConditions: {},

  openTooth: (tooth) =>
    set((state) => {
      const existingRecord = state.toothRecords[tooth.number] || {
        toothNumber: tooth.number,
        patientId: "local-patient",
        condition: "healthy" as ToothConditionCode,
        treatments: [],
        plans: [],
      };

      const existingCondition = state.toothConditions[tooth.number];
      const initialSurfaces = existingCondition?.surfaces || tooth.surfaces || [];

      return {
        selectedTooth: {
          ...tooth,
          record: existingRecord,
          surfaces: initialSurfaces,
        },
        selectedSurfaces: initialSurfaces,
        isModalOpen: true,
        activeTab: "condition",
      };
    }),

  closeTooth: () =>
    set({ selectedTooth: null, isModalOpen: false, selectedSurfaces: [] }),

  setActiveTab: (tab) =>
    set({ activeTab: tab }),

  setPediatric: (pediatric) =>
    set({ pediatric, selectedTooth: null, selectedSurfaces: [] }),

  setNotation: (notation) =>
    set({ notation }),

  setSubView: (subView) =>
    set({ subView }),

  setSelectedSurfaces: (surfaces) =>
    set({ selectedSurfaces: surfaces }),

  toggleSurface: (surface) =>
    set((state) => {
      const current = state.selectedSurfaces;
      const updated = current.includes(surface)
        ? current.filter((s) => s !== surface)
        : [...current, surface];

      return { selectedSurfaces: updated };
    }),

  setToothCondition: (conditionRecord) =>
    set((state) => {
      const num = conditionRecord.toothNumber;
      const prevRecord = state.toothRecords[num] || {
        toothNumber: num as ToothNumber,
        patientId: conditionRecord.patientId,
        condition: "healthy" as ToothConditionCode,
        treatments: [],
        plans: [],
      };

      const updatedRecord: ToothRecord = {
        ...prevRecord,
        condition: conditionRecord.status,
        conditionRecord,
      };

      return {
        toothConditions: {
          ...state.toothConditions,
          [num]: conditionRecord,
        },
        toothRecords: {
          ...state.toothRecords,
          [num]: updatedRecord,
        },
      };
    }),

  syncEncounters: (encounters) =>
    set((state) => {
      const recordsMap: Record<number, ToothRecord> = {};
      const conditionsMap: Record<number, ToothConditionRecord> = { ...state.toothConditions };

      // Sort encounters oldest to newest so latest treatments take precedence
      const sortedEncounters = [...(encounters || [])].sort((a, b) => {
        const timeA = a.visitDate ? new Date(a.visitDate).getTime() : 0;
        const timeB = b.visitDate ? new Date(b.visitDate).getTime() : 0;
        return timeA - timeB;
      });

      for (const enc of sortedEncounters) {
        if (!enc.toothTreatments || !Array.isArray(enc.toothTreatments)) continue;

        for (const tt of enc.toothTreatments) {
          const num = tt.toothNumber;
          if (!num) continue;

          if (!recordsMap[num]) {
            recordsMap[num] = {
              toothNumber: num as ToothNumber,
              patientId: enc.patientId,
              condition: "healthy" as ToothConditionCode,
              treatments: [],
              plans: [],
            };
          }

          const status = getTreatmentStatus(tt, enc.status);
          const uiItem = {
            id: tt.id || `tt-${Date.now()}-${Math.random()}`,
            treatment: tt.treatmentName,
            surfaces: tt.surfaces,
            status,
            date: tt.date || enc.visitDate,
            fee: tt.fee || 0,
            notes: tt.notes,
          };

          if (status === "Planned") {
            recordsMap[num].plans = [...(recordsMap[num].plans || []), uiItem as ToothPlan];
            if (recordsMap[num].condition === "healthy") {
              recordsMap[num].condition = "planned";
            }
          } else {
            recordsMap[num].treatments = [...(recordsMap[num].treatments || []), uiItem as ToothTreatment];

            // Map treatment name to condition
            let cond: ToothConditionCode = "healthy";
            const name = (tt.treatmentName || "").toLowerCase();
            if (name.includes("filling") || name.includes("restoration") || name.includes("gic") || name.includes("composite")) {
              cond = "existing_work";
            } else if (name.includes("extraction") || name.includes("extracted") || name.includes("removed")) {
              cond = "extracted";
            } else if (name.includes("canal") || name.includes("rct") || name.includes("endodontic")) {
              cond = "root_canal";
            } else if (name.includes("crown") || name.includes("cap") || name.includes("veneer") || name.includes("zirconia")) {
              cond = "crowned";
            } else if (name.includes("bridge")) {
              cond = "bridge";
            } else if (name.includes("implant")) {
              cond = "implant";
            } else if (name.includes("cavity") || name.includes("caries")) {
              cond = "caries";
            } else if (name.includes("impaction") || name.includes("impacted")) {
              cond = "impacted";
            } else if (name.includes("watch")) {
              cond = "watch";
            } else {
              cond = "existing_work";
            }
            recordsMap[num].condition = cond;

            // Generate clean ToothConditionRecord
            conditionsMap[num] = {
              patientId: enc.patientId,
              casePaperId: enc.id,
              toothNumber: num,
              surfaces: tt.surfaces || [],
              status: cond,
              procedure: tt.treatmentName,
              fee: tt.fee,
              note: tt.notes,
              updatedAt: tt.timestamp || new Date().toISOString(),
            };
          }
        }
      }

      const activeSelected = state.selectedTooth;
      return {
        toothRecords: recordsMap,
        toothConditions: conditionsMap,
        selectedTooth: activeSelected
          ? {
              ...activeSelected,
              record: recordsMap[activeSelected.number] || {
                toothNumber: activeSelected.number,
                patientId: "local-patient",
                condition: "healthy" as ToothConditionCode,
                treatments: [],
                plans: [],
              },
            }
          : null,
      };
    }),

  addTreatment: (toothNumber, treatmentData) =>
    set((state) => {
      const record = state.toothRecords[toothNumber] || {
        toothNumber,
        patientId: "local-patient",
        condition: "healthy" as ToothConditionCode,
        treatments: [],
        plans: [],
      };

      const newTreatment: ToothTreatment = {
        ...treatmentData,
        id: `tr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      const updatedRecord = {
        ...record,
        treatments: [...(record.treatments || []), newTreatment],
      };

      return {
        toothRecords: {
          ...state.toothRecords,
          [toothNumber]: updatedRecord,
        },
      };
    }),

  addPlan: (toothNumber, planData) =>
    set((state) => {
      const record = state.toothRecords[toothNumber] || {
        toothNumber,
        patientId: "local-patient",
        condition: "healthy" as ToothConditionCode,
        treatments: [],
        plans: [],
      };

      const newPlan: ToothPlan = {
        ...planData,
        id: `pl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: "Planned",
      };

      const updatedRecord = {
        ...record,
        plans: [...(record.plans || []), newPlan],
      };

      return {
        toothRecords: {
          ...state.toothRecords,
          [toothNumber]: updatedRecord,
        },
      };
    }),

  resetChart: () =>
    set({
      selectedTooth: null,
      isModalOpen: false,
      activeTab: "condition",
      pediatric: false,
      notation: "fdi",
      subView: "dental",
      selectedSurfaces: [],
      toothRecords: {},
      toothConditions: {},
    }),
}));
