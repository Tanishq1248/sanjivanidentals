import { create } from "zustand";
import type { Patient } from "../types";

interface PatientState {
  selectedPatient: Patient | null;
  isModalOpen: boolean;
  openPatientDetails: (patient: Patient) => void;
  closePatientDetails: () => void;
}

export const usePatientStore = create<PatientState>((set) => ({
  selectedPatient: null,
  isModalOpen: false,
  openPatientDetails: (patient) => set({ selectedPatient: patient, isModalOpen: true }),
  closePatientDetails: () => set({ selectedPatient: null, isModalOpen: false }),
}));
