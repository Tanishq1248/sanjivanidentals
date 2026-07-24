"use client";

import React from "react";
import {
  LayoutDashboard,
  Calendar,
  Activity,
  FileSpreadsheet,
  Stethoscope,
  ShieldAlert,
  IndianRupee,
  FileText,
  FolderArchive,
  FileCheck,
} from "lucide-react";

export type TabKey =
  | "overview"
  | "appointments"
  | "encounters"
  | "treatment-plan"
  | "dental-chart"
  | "medical-history"
  | "invoices"
  | "notes"
  | "records"
  | "documents";

export interface TabOption {
  key: TabKey;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeColor?: string;
}

interface TabNavigationProps {
  activeTab: TabKey;
  onTabChange: (key: TabKey) => void;
  encountersCount?: number;
  appointmentsCount?: number;
  invoicesCount?: number;
  hasMedicalAlert?: boolean;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  encountersCount = 0,
  appointmentsCount = 0,
  invoicesCount = 0,
  hasMedicalAlert = false,
}) => {
  const tabs: TabOption[] = [
    {
      key: "overview",
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      key: "appointments",
      label: "Appointments",
      icon: Calendar,
      badge: appointmentsCount > 0 ? appointmentsCount : undefined,
    },
    {
      key: "encounters",
      label: "Encounters",
      icon: Activity,
      badge: encountersCount > 0 ? encountersCount : undefined,
    },
    {
      key: "treatment-plan",
      label: "Treatment Plan",
      icon: FileSpreadsheet,
    },
    {
      key: "dental-chart",
      label: "Dental Chart",
      icon: Stethoscope,
    },
    {
      key: "medical-history",
      label: "Medical History",
      icon: ShieldAlert,
      badge: hasMedicalAlert ? "!" : undefined,
      badgeColor: "bg-red-500 text-white font-bold",
    },
    {
      key: "invoices",
      label: "Invoices & Payments",
      icon: IndianRupee,
      badge: invoicesCount > 0 ? invoicesCount : undefined,
    },
    {
      key: "notes",
      label: "Notes",
      icon: FileText,
    },
    {
      key: "records",
      label: "Records",
      icon: FolderArchive,
    },
    {
      key: "documents",
      label: "Documents",
      icon: FileCheck,
    },
  ];

  return (
    <div className="bg-white border-b border-outline-variant/15 sticky top-[72px] z-10 shadow-xs">
      <div className="overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex min-w-max px-4 sm:px-6 gap-1 sm:gap-2 border-b border-slate-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                id={`tab-${tab.key}`}
                onClick={() => onTabChange(tab.key)}
                className={`relative py-3.5 px-3.5 sm:px-4 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border-b-2 cursor-pointer outline-none whitespace-nowrap select-none ${
                  isActive
                    ? "border-primary text-primary font-bold bg-primary/5 rounded-t-xl"
                    : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-slate-50 rounded-t-xl"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-primary" : "text-on-surface-variant/70"
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
