"use client";

import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PatientEncounter, ToothTreatmentEntry, EncounterStatus } from "../../../lib/types";
import { EncounterHeader } from "./EncounterHeader";
import { TreatmentItem } from "./TreatmentItem";
import { EncounterSummary } from "./EncounterSummary";
import { EncounterActions } from "./EncounterActions";

interface EncounterCardProps {
  encounter: PatientEncounter;
  isExpanded: boolean;
  onToggleExpand: () => void;
  totalFees: number;
  teethNums: number[];
  selectedBillingItems: Record<string, boolean>;
  onToggleBillingItem: (itemId: string) => void;
  isAllBillingSelected?: boolean;
  onToggleAllBilling?: () => void;
  onStatusChange: (id: string, status: EncounterStatus) => void;
  onEdit: (encounter: PatientEncounter) => void;
  onDelete: (id: string) => void;
  onPrescription?: (encounter: PatientEncounter) => void;
  onInvoice?: (encounter: PatientEncounter) => void;
  onPrint?: (encounter: PatientEncounter) => void;
  formatVisitDate: (dateStr: string) => string;
  formatINR: (val: number) => string;
}

export const EncounterCard = memo(function EncounterCard({
  encounter,
  isExpanded,
  onToggleExpand,
  totalFees,
  teethNums,
  selectedBillingItems,
  onToggleBillingItem,
  isAllBillingSelected,
  onToggleAllBilling,
  onStatusChange,
  onEdit,
  onDelete,
  onPrescription,
  onInvoice,
  onPrint,
  formatVisitDate,
  formatINR,
}: EncounterCardProps) {
  const toothTreatments = encounter.toothTreatments || [];
  const manualTreatments = encounter.treatments || [];
  const treatmentCount = toothTreatments.length > 0 ? toothTreatments.length : manualTreatments.length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden font-sans ${
        isExpanded ? "border-primary/30 shadow-md ring-1 ring-primary/10" : "border-outline-variant/20 hover:border-outline-variant/35"
      }`}
    >
      {/* Header Overview */}
      <EncounterHeader
        encounter={encounter}
        isExpanded={isExpanded}
        totalFees={totalFees}
        teethNums={teethNums}
        treatmentCount={treatmentCount}
        isAllBillingSelected={isAllBillingSelected}
        onToggleAllBilling={onToggleAllBilling}
        onToggleExpand={onToggleExpand}
        formatVisitDate={formatVisitDate}
        formatINR={formatINR}
      />

      {/* Expanded Content with Framer Motion */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-outline-variant/15 bg-surface-container-low/40"
          >
            <div className="p-4 space-y-4">
              {/* Treatments List */}
              {toothTreatments.length > 0 ? (
                <div className="space-y-3">
                  {toothTreatments.map((tt: ToothTreatmentEntry, idx: number) => (
                    <TreatmentItem
                      key={tt.id}
                      index={idx}
                      treatment={tt}
                      isBillingSelected={!!selectedBillingItems[`tt-${tt.id}`]}
                      onToggleBilling={() => onToggleBillingItem(`tt-${tt.id}`)}
                      formatINR={formatINR}
                    />
                  ))}
                </div>
              ) : manualTreatments.length > 0 ? (
                <div className="space-y-3">
                  {manualTreatments.map((tName: string, idx: number) => (
                    <TreatmentItem
                      key={idx}
                      index={idx}
                      treatment={{
                        id: `fallback-${encounter.id}-${idx}`,
                        treatmentName: tName,
                        status: encounter.status,
                        fee: 0,
                      }}
                      isBillingSelected={!!selectedBillingItems[`fallback-${encounter.id}`]}
                      onToggleBilling={() => onToggleBillingItem(`fallback-${encounter.id}`)}
                      formatINR={formatINR}
                    />
                  ))}
                </div>
              ) : null}

              {/* Summary & Notes Footer */}
              <EncounterSummary
                encounter={encounter}
                totalFees={totalFees}
                treatmentCount={treatmentCount}
                formatINR={formatINR}
                onOpenPrescription={onPrescription ? () => onPrescription(encounter) : undefined}
                onOpenInvoice={onInvoice ? () => onInvoice(encounter) : undefined}
              />

              {/* Status Action Buttons & Menu */}
              <EncounterActions
                encounter={encounter}
                onStatusChange={onStatusChange}
                onEdit={onEdit}
                onDelete={onDelete}
                onPrescription={onPrescription}
                onInvoice={onInvoice}
                onPrint={onPrint}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
