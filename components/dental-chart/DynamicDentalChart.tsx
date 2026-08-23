"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { DentalChartProps } from "./DentalChart";
import type { ToothDetailPanelProps } from "./ToothDetailPanel";

export const DynamicDentalChart = dynamic(
  () => import("./DentalChart").then((mod) => mod.DentalChart),
  {
    loading: () => (
      <div className="h-96 w-full flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-200">
        <div className="flex flex-col items-center gap-2.5">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-slate-500 font-medium">Loading Interactive Odontogram...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export const DynamicToothDetailPanel = dynamic(
  () => import("./ToothDetailPanel").then((mod) => mod.ToothDetailPanel),
  {
    ssr: false,
  }
);
