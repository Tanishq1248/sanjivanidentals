"use client";

import React, { useState } from "react";
import { Activity, Plus, FileSpreadsheet } from "lucide-react";
import type { PatientEncounter, EncounterStatus } from "../../../lib/types";
import { EncounterCard } from "./EncounterCard";
import { EncounterDesktopTable } from "./EncounterDesktopTable";

interface PatientEncounterLogProps {
  encounters: PatientEncounter[];
  isLoading?: boolean;
  onLogFirstVisit: () => void;
  selectedBillingItems: Record<string, boolean>;
  onToggleBillingItem: (itemId: string) => void;
  isEncounterAllBillingSelected: (e: PatientEncounter) => boolean;
  onToggleAllBillingItems: (e: PatientEncounter) => void;
  calculateTotalFees: (e: PatientEncounter) => number;
  getTeethNumbers: (e: PatientEncounter) => number[];
  onStatusChange: (id: string, status: EncounterStatus) => void;
  onToothTreatmentStatusChange?: (encounterId: string, treatmentId: string, status: "Planned" | "In Progress" | "Completed") => void;
  onEditEncounter: (e: PatientEncounter) => void;
  onDeleteEncounter: (id: string) => void;
  onPrescription?: (e: PatientEncounter) => void;
  onInvoice?: (e: PatientEncounter) => void;
  onPrint?: (e: PatientEncounter) => void;
  formatVisitDate: (dateStr: string) => string;
  formatINR: (val: number) => string;
}

export function PatientEncounterLog({
  encounters,
  isLoading,
  onLogFirstVisit,
  selectedBillingItems,
  onToggleBillingItem,
  isEncounterAllBillingSelected,
  onToggleAllBillingItems,
  calculateTotalFees,
  getTeethNumbers,
  onStatusChange,
  onToothTreatmentStatusChange,
  onEditEncounter,
  onDeleteEncounter,
  onPrescription,
  onInvoice,
  onPrint,
  formatVisitDate,
  formatINR,
}: PatientEncounterLogProps) {
  const [expandedEncounterId, setExpandedEncounterId] = useState<string | null>(null);

  const handleToggleExpand = (id: string) => {
    setExpandedEncounterId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm p-4 md:p-6 space-y-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary shrink-0" />
            Patient Visit Encounter Logs
          </h2>
          <p className="text-xs text-on-surface-variant hidden sm:block">
            Track clinical visit histories, procedures, fees, and billing status
          </p>
        </div>
        <button
          onClick={onLogFirstVisit}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Log Visit</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4 py-4 animate-pulse">
          <div className="h-24 bg-surface-container rounded-2xl"></div>
          <div className="h-24 bg-surface-container rounded-2xl"></div>
        </div>
      ) : encounters.length === 0 ? (
        /* Empty State */
        <div className="py-12 px-4 text-center border-2 border-dashed border-outline-variant/20 rounded-2xl space-y-3 bg-surface-container-lowest">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-on-surface text-base">📋 No Encounter History</h3>
            <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto leading-relaxed">
              This patient has no recorded clinical visits yet. Log the first encounter to establish a medical record timeline.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onLogFirstVisit}
              className="bg-primary text-white font-bold py-2.5 px-5 rounded-xl text-xs hover:bg-primary-dark transition-all cursor-pointer shadow-sm inline-flex items-center gap-2 min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              Log First Encounter
            </button>
          </div>
        </div>
      ) : (
        /* Encounters List / Table */
        <div>
          {/* Mobile & Tablet Stacked Cards View (< 1024px) */}
          <div className="block lg:hidden space-y-4">
            {encounters.map((e) => {
              const isExpanded = expandedEncounterId === e.id;
              const totalFees = calculateTotalFees(e);
              const teethNums = getTeethNumbers(e);

              return (
                <EncounterCard
                  key={e.id}
                  encounter={e}
                  isExpanded={isExpanded}
                  onToggleExpand={() => handleToggleExpand(e.id)}
                  totalFees={totalFees}
                  teethNums={teethNums}
                  selectedBillingItems={selectedBillingItems}
                  onToggleBillingItem={onToggleBillingItem}
                  isAllBillingSelected={isEncounterAllBillingSelected(e)}
                  onToggleAllBilling={() => onToggleAllBillingItems(e)}
                  onStatusChange={onStatusChange}
                  onToothTreatmentStatusChange={onToothTreatmentStatusChange}
                  onEdit={onEditEncounter}
                  onDelete={onDeleteEncounter}
                  onPrescription={onPrescription}
                  onInvoice={onInvoice}
                  onPrint={onPrint}
                  formatVisitDate={formatVisitDate}
                  formatINR={formatINR}
                />
              );
            })}
          </div>

          {/* Desktop Table View (≥ 1024px) */}
          <div className="hidden lg:block">
            <EncounterDesktopTable
              encounters={encounters}
              expandedEncounterId={expandedEncounterId}
              onToggleExpand={handleToggleExpand}
              selectedBillingItems={selectedBillingItems}
              onToggleBillingItem={onToggleBillingItem}
              isEncounterAllBillingSelected={isEncounterAllBillingSelected}
              onToggleAllBillingItems={onToggleAllBillingItems}
              calculateTotalFees={calculateTotalFees}
              getTeethNumbers={getTeethNumbers}
              onStatusChange={onStatusChange}
              onToothTreatmentStatusChange={onToothTreatmentStatusChange}
              onEdit={onEditEncounter}
              onDelete={onDeleteEncounter}
              onPrescription={onPrescription}
              onInvoice={onInvoice}
              onPrint={onPrint}
              formatVisitDate={formatVisitDate}
              formatINR={formatINR}
            />
          </div>
        </div>
      )}
    </div>
  );
}
