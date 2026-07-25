"use client";

import React from "react";
import { PatientEncounterLog } from "../../encounters/PatientEncounterLog";
import type { PatientEncounter, EncounterStatus } from "../../../../lib/types";

interface EncountersTabProps {
  encounters: PatientEncounter[];
  isLoading: boolean;
  onLogFirstVisit: () => void;
  selectedBillingItems: Record<string, boolean>;
  onToggleBillingItem: (itemId: string) => void;
  isEncounterAllBillingSelected: (encounter: PatientEncounter) => boolean;
  onToggleAllBillingItems: (encounter: PatientEncounter) => void;
  calculateTotalFees: (encounter: PatientEncounter) => number;
  getTeethNumbers: (encounter: PatientEncounter) => number[];
  onStatusChange: (id: string, status: EncounterStatus) => void;
  onToothTreatmentStatusChange?: (encounterId: string, treatmentId: string, status: "Planned" | "In Progress" | "Completed") => void;
  onEditEncounter: (encounter: PatientEncounter) => void;
  onDeleteEncounter: (id: string) => void;
  onPrescription: (encounter: PatientEncounter) => void;
  onInvoice: (encounter: PatientEncounter) => void;
  onPrint: () => void;
  formatVisitDate: (dateStr: string) => string;
  formatINR: (amount: any) => string;
}

export const EncountersTab: React.FC<EncountersTabProps> = (props) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PatientEncounterLog {...props} />
    </div>
  );
};
