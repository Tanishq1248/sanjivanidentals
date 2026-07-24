"use client";

import React, { useEffect } from "react";
import { DentalChart } from "../../../dental-chart/DentalChart";
import { ToothDetailPanel } from "../../../dental-chart/ToothDetailPanel";
import { useDentalChartStore } from "../../../../lib/store/useDentalChartStore";
import type { PatientEncounter } from "../../../../lib/types";

interface DentalChartTabProps {
  patientId: string;
  patientName: string;
  encounters: PatientEncounter[];
  onSaveTreatment: (
    toothNumber: number,
    treatmentData: {
      treatmentName: string;
      status: string;
      fee: number;
      notes?: string;
    }
  ) => Promise<void>;
  isSaving: boolean;
}

export const DentalChartTab: React.FC<DentalChartTabProps> = ({
  patientId,
  patientName,
  encounters,
  onSaveTreatment,
  isSaving,
}) => {
  const { syncEncounters, selectedTooth } = useDentalChartStore();

  useEffect(() => {
    syncEncounters(encounters);
  }, [encounters, syncEncounters]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[600px] h-[calc(100vh-280px)]">
        {/* Main Interactive Dental Chart Canvas */}
        <div className="flex-1 overflow-hidden h-full">
          <DentalChart patientId={patientId} patientName={patientName} />
        </div>

        {/* Side Panel for Selected Tooth Treatments */}
        {selectedTooth && (
          <ToothDetailPanel
            onSaveTreatment={onSaveTreatment}
            isSaving={isSaving}
          />
        )}
      </div>
    </div>
  );
};
