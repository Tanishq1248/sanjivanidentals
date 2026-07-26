/**
 * Dental Chart — Zustand State Store
 *
 * Manages UI and local patient state for the dental chart.
 */

import { create } from "zustand";
import type { SelectedTooth, ToothModalTab, ToothRecord, ToothTreatment, ToothPlan, ToothNumber, ToothConditionCode } from "../../components/dental-chart/types";
import { getTreatmentStatus } from "../types";

interface DentalChartState {
  selectedTooth: SelectedTooth | null;
  isModalOpen: boolean;
  activeTab: ToothModalTab;
  pediatric: boolean;
  
  // Mapping of toothNumber -> ToothRecord loaded from Firestore
  toothRecords: Record<number, ToothRecord>;

  // ─── Actions ────────────────────────────────────────────────────────────
  openTooth: (tooth: SelectedTooth) => void;
  closeTooth: () => void;
  setActiveTab: (tab: ToothModalTab) => void;
  setPediatric: (pediatric: boolean) => void;
  syncEncounters: (encounters: any[]) => void;
  
  // Local state mutations (fallbacks / UI updates)
  addTreatment: (toothNumber: ToothNumber, treatment: Omit<ToothTreatment, "id">) => void;
  addPlan: (toothNumber: ToothNumber, plan: Omit<ToothPlan, "id">) => void;
  resetChart: () => void;
}

export const useDentalChartStore = create<DentalChartState>((set) => ({
  selectedTooth: null,
  isModalOpen: false,
  activeTab: "history",
  pediatric: false,
  toothRecords: {},

  openTooth: (tooth) =>
    set((state) => {
      const existingRecord = state.toothRecords[tooth.number] || {
        toothNumber: tooth.number,
        patientId: "local-patient",
        condition: "healthy" as ToothConditionCode,
        treatments: [],
        plans: [],
      };
      
      return {
        selectedTooth: {
          ...tooth,
          record: existingRecord,
        },
        isModalOpen: true,
        activeTab: "history",
      };
    }),

  closeTooth: () =>
    set({ selectedTooth: null, isModalOpen: false }),

  setActiveTab: (tab) =>
    set({ activeTab: tab }),

  setPediatric: (pediatric) =>
    set({ pediatric, selectedTooth: null }),

  syncEncounters: (encounters) =>
    set((state) => {
      const recordsMap: Record<number, ToothRecord> = {};

      // Sort encounters oldest to newest so that latest treatments win
      const sortedEncounters = [...encounters].sort((a, b) => {
        return new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime();
      });

      for (const enc of sortedEncounters) {
        if (!enc.toothTreatments || !Array.isArray(enc.toothTreatments)) continue;

        for (const tt of enc.toothTreatments) {
          const num = tt.toothNumber;
          if (!recordsMap[num]) {
            recordsMap[num] = {
              toothNumber: num as ToothNumber,
              patientId: enc.patientId,
              condition: "healthy" as ToothConditionCode,
              treatments: [],
              plans: [],
            };
          }

          // Build UI objects
          const status = getTreatmentStatus(tt, enc.status);
          const uiItem = {
            id: tt.id,
            treatment: tt.treatmentName,
            status,
            date: tt.date,
            fee: tt.fee,
            notes: tt.notes,
          };

          if (status === "Planned") {
            recordsMap[num].plans = [...(recordsMap[num].plans || []), uiItem as ToothPlan];
            // If currently healthy, plan sets condition to watch
            if (recordsMap[num].condition === "healthy") {
              recordsMap[num].condition = "watch";
            }
          } else {
            recordsMap[num].treatments = [...(recordsMap[num].treatments || []), uiItem as ToothTreatment];
            
            // Map treatment name to condition
            let cond: ToothConditionCode = "healthy";
            const name = tt.treatmentName.toLowerCase();
            if (name.includes("filling")) {
              cond = "filled";
            } else if (name.includes("extraction")) {
              cond = "extracted";
            } else if (name.includes("canal")) {
              cond = "root_canal";
            } else if (name.includes("crown")) {
              cond = "crowned";
            } else if (name.includes("bridge")) {
              cond = "bridge";
            } else if (name.includes("implant")) {
              cond = "implant";
            } else if (name.includes("cavity")) {
              cond = "cavity";
            } else if (name.includes("watch")) {
              cond = "watch";
            } else {
              cond = "healthy";
            }
            recordsMap[num].condition = cond;
          }
        }
      }

      return {
        toothRecords: recordsMap,
        selectedTooth: state.selectedTooth
          ? {
              ...state.selectedTooth,
              record: recordsMap[state.selectedTooth.number] || {
                toothNumber: state.selectedTooth.number,
                patientId: "local-patient",
                condition: "healthy" as ToothConditionCode,
                treatments: [],
                plans: [],
              },
            }
          : null,
      };
    }),

  // Fallbacks for local mutations (if direct service calls fail or offline)
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
      activeTab: "history",
      pediatric: false,
      toothRecords: {},
    }),
}));
