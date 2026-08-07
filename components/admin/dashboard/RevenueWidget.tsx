"use client";

import React, { useMemo } from "react";
import { IndianRupee, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import type { Invoice } from "../../../lib/types";

function formatINR(val: number): string {
  if (isNaN(val) || val === 0) return "0";
  const hasPaise = val % 1 !== 0;
  return val.toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

interface RevenueWidgetProps {
  invoices: Invoice[];
  isLoading?: boolean;
}

export function RevenueWidget({ invoices = [], isLoading = false }: RevenueWidgetProps) {
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const currentMonthPrefix = todayStr.slice(0, 7); // "YYYY-MM"

    let todayRevenue = 0;
    let monthRevenue = 0;
    let totalCollected = 0;
    let totalPending = 0;

    invoices.forEach((inv) => {
      const invTotal = inv.total ?? inv.netAmount ?? inv.amount ?? 0;
      const paid = inv.paidAmount ?? (inv.paymentStatus === "Paid" || inv.paymentStatus === "PAID" ? invTotal : 0);
      const remaining = inv.remainingAmount ?? Math.max(0, invTotal - paid);

      totalCollected += paid;
      totalPending += remaining;

      const dateStr = inv.invoiceDate || "";
      if (dateStr === todayStr) {
        todayRevenue += paid > 0 ? paid : (inv.paymentStatus === "Paid" || inv.paymentStatus === "PAID" ? invTotal : 0);
      }

      if (dateStr.startsWith(currentMonthPrefix)) {
        monthRevenue += paid > 0 ? paid : (inv.paymentStatus === "Paid" || inv.paymentStatus === "PAID" ? invTotal : 0);
      }
    });

    return {
      todayRevenue,
      monthRevenue,
      totalCollected,
      totalPending,
      hasData: invoices.length > 0,
    };
  }, [invoices]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-outline-variant/15 p-5 shadow-sm animate-pulse space-y-4">
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm p-5 flex flex-col justify-between font-sans transition-all hover:border-outline-variant/30">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <IndianRupee className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider font-sans">
              Revenue Overview
            </h3>
            <span className="text-[10px] text-on-surface-variant/70 font-semibold block">
              Live Financial Summary
            </span>
          </div>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> Realtime
        </span>
      </div>

      {!stats.hasData ? (
        <div className="py-8 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-bold text-on-surface">No revenue yet</p>
          <p className="text-[11px] text-on-surface-variant max-w-[200px] mx-auto">
            Invoices generated for treatments will populate your revenue metrics here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {/* Today's Revenue */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 p-3.5 rounded-xl border border-emerald-100/80">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              Today
            </span>
            <span className="text-lg font-extrabold text-emerald-950 tracking-tight font-mono block mt-0.5">
              ₹{formatINR(stats.todayRevenue)}
            </span>
          </div>

          {/* This Month Revenue */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 p-3.5 rounded-xl border border-blue-100/80">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
              This Month
            </span>
            <span className="text-lg font-extrabold text-blue-950 tracking-tight font-mono block mt-0.5">
              ₹{formatINR(stats.monthRevenue)}
            </span>
          </div>

          {/* Collected */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Collected
            </span>
            <span className="text-base font-extrabold text-slate-900 tracking-tight font-mono block mt-0.5">
              ₹{formatINR(stats.totalCollected)}
            </span>
          </div>

          {/* Pending */}
          <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" /> Pending
            </span>
            <span className="text-base font-extrabold text-amber-950 tracking-tight font-mono block mt-0.5">
              ₹{formatINR(stats.totalPending)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
