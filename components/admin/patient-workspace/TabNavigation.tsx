"use client";

import React from "react";
import {
  Stethoscope,
  User,
  IndianRupee,
  FileImage,
  FolderArchive,
  AlertTriangle,
} from "lucide-react";

export type PrimaryTabKey =
  | "case-paper"
  | "patient-info"
  | "billing"
  | "xray"
  | "documents";

// Legacy aliases for backward compatibility
export type LegacyTabKey =
  | "overview"
  | "appointments"
  | "encounters"
  | "treatment-plan"
  | "dental-chart"
  | "medical-history"
  | "invoices"
  | "notes"
  | "records";

export type TabKey = PrimaryTabKey | LegacyTabKey;

export interface TabOption {
  key: PrimaryTabKey;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeColor?: string;
  description?: string;
}

interface TabNavigationProps {
  activeTab: TabKey;
  onTabChange: (key: PrimaryTabKey) => void;
  encountersCount?: number;
  invoicesCount?: number;
  unpaidInvoicesCount?: number;
  hasMedicalAlert?: boolean;
  documentsCount?: number;
  xraysCount?: number;
}

/** Helper to normalize any legacy tab key to the corresponding primary tab key */
export function normalizeTabKey(key: TabKey): PrimaryTabKey {
  switch (key) {
    case "overview":
    case "encounters":
    case "treatment-plan":
    case "dental-chart":
    case "notes":
    case "appointments":
      return "case-paper";
    case "medical-history":
      return "patient-info";
    case "invoices":
      return "billing";
    case "records":
      return "xray";
    case "documents":
      return "documents";
    default:
      return key as PrimaryTabKey;
  }
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  encountersCount = 0,
  invoicesCount = 0,
  unpaidInvoicesCount = 0,
  hasMedicalAlert = false,
  documentsCount = 0,
  xraysCount = 0,
}) => {
  const currentPrimaryTab = normalizeTabKey(activeTab);

  const tabs: TabOption[] = [
    {
      key: "case-paper",
      label: "Case Paper",
      icon: Stethoscope,
      badge: encountersCount > 0 ? encountersCount : undefined,
      description: "Clinical timeline, dental chart, treatments & notes",
    },
    {
      key: "patient-info",
      label: "Patient Info",
      icon: User,
      badge: hasMedicalAlert ? "Alert" : undefined,
      badgeColor: "bg-red-500 text-white font-bold animate-pulse",
      description: "Demographics, medical history & emergency contact",
    },
    {
      key: "billing",
      label: "Billing",
      icon: IndianRupee,
      badge: unpaidInvoicesCount > 0 ? `${unpaidInvoicesCount} Due` : invoicesCount > 0 ? invoicesCount : undefined,
      badgeColor: unpaidInvoicesCount > 0 ? "bg-amber-500 text-white font-bold" : undefined,
      description: "Invoices, payment logs & outstanding dues",
    },
    {
      key: "xray",
      label: "X-Ray",
      icon: FileImage,
      badge: xraysCount > 0 ? xraysCount : undefined,
      description: "Diagnostic scans, bitewings & IOPA images",
    },
    {
      key: "documents",
      label: "Documents",
      icon: FolderArchive,
      badge: documentsCount > 0 ? documentsCount : undefined,
      description: "Prescriptions, reports, receipts & consent forms",
    },
  ];

  return (
    <div className="bg-white border-b border-outline-variant/15 sticky top-[72px] z-10 shadow-xs">
      <div className="overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex min-w-max px-4 sm:px-6 gap-2 border-b border-slate-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentPrimaryTab === tab.key;

            return (
              <button
                key={tab.key}
                id={`tab-${tab.key}`}
                onClick={() => onTabChange(tab.key)}
                className={`relative py-3.5 px-4 sm:px-5 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border-b-2 cursor-pointer outline-none whitespace-nowrap select-none ${
                  isActive
                    ? "border-primary text-primary font-bold bg-primary/5 rounded-t-xl shadow-2xs"
                    : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-slate-50 rounded-t-xl"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-primary stroke-[2.5]" : "text-on-surface-variant/70"
                  }`}
                />
                <span>{tab.label}</span>

                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-tight ${
                      tab.badgeColor ||
                      (isActive
                        ? "bg-primary text-white"
                        : "bg-slate-100 text-slate-700 border border-slate-200")
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
