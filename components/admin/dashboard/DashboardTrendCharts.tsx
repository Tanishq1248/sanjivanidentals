"use client";

import React, { useMemo, useState } from "react";
import { TrendingUp, Users, Calendar, AlertCircle } from "lucide-react";
import type { Invoice, Patient, Appointment } from "../../../lib/types";

function formatINR(val: number): string {
  if (isNaN(val) || val === 0) return "0";
  if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
  return String(Math.round(val));
}

function getLast6Months() {
  const months: Array<{ key: string; label: string }> = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const label = d.toLocaleDateString("en-US", { month: "short" });
    months.push({ key: `${year}-${month}`, label });
  }
  return months;
}

function getLast7Days() {
  const days: Array<{ dateStr: string; label: string }> = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-US", { weekday: "narrow" });
    days.push({ dateStr, label });
  }
  return days;
}

interface DashboardTrendChartsProps {
  invoices: Invoice[];
  patients: Patient[];
  appointments?: Appointment[];
  isLoading?: boolean;
}

export function DashboardTrendCharts({
  invoices = [],
  patients = [],
  appointments = [],
  isLoading = false,
}: DashboardTrendChartsProps) {
  const [activeRevenueHover, setActiveRevenueHover] = useState<{ label: string; value: number } | null>(null);
  const [activePatientHover, setActivePatientHover] = useState<{ label: string; value: number } | null>(null);

  // Last 6 Months Revenue Data
  const revenueTrend = useMemo(() => {
    const months = getLast6Months();
    const map = new Map<string, number>();
    months.forEach((m) => map.set(m.key, 0));

    invoices.forEach((inv) => {
      const dateStr = inv.invoiceDate || "";
      const monthKey = dateStr.slice(0, 7);
      if (map.has(monthKey)) {
        const invTotal = inv.total ?? inv.netAmount ?? inv.amount ?? 0;
        const paid = inv.paidAmount ?? (inv.paymentStatus === "Paid" || inv.paymentStatus === "PAID" ? invTotal : 0);
        map.set(monthKey, (map.get(monthKey) || 0) + (paid > 0 ? paid : invTotal));
      }
    });

    const data = months.map((m) => ({
      key: m.key,
      label: m.label,
      value: map.get(m.key) || 0,
    }));

    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const hasData = data.some((d) => d.value > 0);

    return { data, maxVal, hasData };
  }, [invoices]);

  // Last 6 Months Patient Growth Data
  const patientGrowth = useMemo(() => {
    const months = getLast6Months();
    const map = new Map<string, number>();
    months.forEach((m) => map.set(m.key, 0));

    patients.forEach((p) => {
      let monthKey = "";
      if (p.createdAt && typeof p.createdAt === "object" && "seconds" in p.createdAt) {
        const d = new Date(p.createdAt.seconds * 1000);
        monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      } else if (p.lastVisit && p.lastVisit.includes("-")) {
        monthKey = p.lastVisit.slice(0, 7);
      }

      if (map.has(monthKey)) {
        map.set(monthKey, (map.get(monthKey) || 0) + 1);
      }
    });

    const data = months.map((m) => ({
      key: m.key,
      label: m.label,
      value: map.get(m.key) || 0,
    }));

    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const hasData = data.some((d) => d.value > 0);

    return { data, maxVal, hasData };
  }, [patients]);

  // Last 7 Days Appointments Sparkline Data
  const appointmentSparkline = useMemo(() => {
    const days = getLast7Days();
    const map = new Map<string, number>();
    days.forEach((d) => map.set(d.dateStr, 0));

    appointments.forEach((a) => {
      if (map.has(a.date)) {
        map.set(a.date, (map.get(a.date) || 0) + 1);
      }
    });

    const data = days.map((d) => ({
      dateStr: d.dateStr,
      label: d.label,
      value: map.get(d.dateStr) || 0,
    }));

    const total7Days = data.reduce((sum, d) => sum + d.value, 0);

    return { data, total7Days };
  }, [appointments]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        <div className="bg-white rounded-2xl border border-outline-variant/15 p-6 h-64" />
        <div className="bg-white rounded-2xl border border-outline-variant/15 p-6 h-64" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
      {/* ── CHART 1: MONTHLY REVENUE TREND (LINE CHART) ── */}
      <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm p-5 flex flex-col justify-between hover:border-outline-variant/30 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
          <div>
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Monthly Revenue Trend
            </h3>
            <span className="text-[10px] text-on-surface-variant/70 font-semibold block mt-0.5">
              Last 6 Months (₹ Collected)
            </span>
          </div>

          {activeRevenueHover ? (
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block">{activeRevenueHover.label}</span>
              <span className="text-xs font-extrabold text-emerald-700 font-mono">₹{activeRevenueHover.value.toLocaleString("en-IN")}</span>
            </div>
          ) : (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              6 Months
            </span>
          )}
        </div>

        {/* SVG Line Chart */}
        {!revenueTrend.hasData ? (
          <div className="h-44 flex flex-col items-center justify-center text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-slate-300" />
            <p className="text-xs font-bold text-slate-600">No revenue data</p>
            <p className="text-[10px] text-slate-400">Revenue trend will appear once payments are logged.</p>
          </div>
        ) : (
          <div className="pt-4 pb-2">
            <div className="relative h-36 w-full">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                <line x1="0" y1="20" x2="300" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="0" y1="50" x2="300" y2="50" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="300" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" />

                {/* Line & Area Path */}
                {(() => {
                  const pts = revenueTrend.data.map((d, i) => {
                    const x = (i / (revenueTrend.data.length - 1)) * 300;
                    const y = 90 - (d.value / revenueTrend.maxVal) * 75;
                    return { x, y, val: d.value, label: d.label };
                  });

                  const pathD = pts.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), "");
                  const areaD = `${pathD} L 300 95 L 0 95 Z`;

                  return (
                    <>
                      <path d={areaD} fill="url(#revenueGrad)" />
                      <path d={pathD} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      {pts.map((p, idx) => (
                        <circle
                          key={idx}
                          cx={p.x}
                          cy={p.y}
                          r="4"
                          className="fill-white stroke-emerald-600 stroke-[2.5] hover:r-6 cursor-pointer transition-all"
                          onMouseEnter={() => setActiveRevenueHover({ label: p.label, value: p.val })}
                          onMouseLeave={() => setActiveRevenueHover(null)}
                        />
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-500">
              {revenueTrend.data.map((d) => (
                <span key={d.key} className="text-center">
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── CHART 2: PATIENT GROWTH (BAR CHART) ── */}
      <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm p-5 flex flex-col justify-between hover:border-outline-variant/30 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
          <div>
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              Patient Growth
            </h3>
            <span className="text-[10px] text-on-surface-variant/70 font-semibold block mt-0.5">
              New Patients Registered (Last 6 Months)
            </span>
          </div>

          {activePatientHover ? (
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block">{activePatientHover.label}</span>
              <span className="text-xs font-extrabold text-purple-700 font-mono">{activePatientHover.value} Patients</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
              <Calendar className="w-3 h-3" />
              <span>7-Day Appts: <strong className="font-mono text-purple-900">{appointmentSparkline.total7Days}</strong></span>
            </div>
          )}
        </div>

        {/* SVG Bar Chart */}
        {!patientGrowth.hasData ? (
          <div className="h-44 flex flex-col items-center justify-center text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-slate-300" />
            <p className="text-xs font-bold text-slate-600">No patient data</p>
            <p className="text-[10px] text-slate-400">Patient growth metrics will appear as patients register.</p>
          </div>
        ) : (
          <div className="pt-4 pb-2">
            <div className="h-36 flex items-end justify-between gap-3 px-2">
              {patientGrowth.data.map((d) => {
                const heightPct = Math.max(12, Math.round((d.value / patientGrowth.maxVal) * 100));

                return (
                  <div
                    key={d.key}
                    className="flex-1 flex flex-col items-center group cursor-pointer"
                    onMouseEnter={() => setActivePatientHover({ label: d.label, value: d.value })}
                    onMouseLeave={() => setActivePatientHover(null)}
                  >
                    <span className="text-[10px] font-extrabold text-purple-900 font-mono opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                      {d.value}
                    </span>
                    <div className="w-full max-w-[32px] bg-purple-100 rounded-t-lg overflow-hidden flex items-end h-28">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full bg-gradient-to-t from-purple-700 to-indigo-500 rounded-t-md transition-all duration-300 group-hover:from-purple-800 group-hover:to-indigo-600"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-500">
              {patientGrowth.data.map((d) => (
                <span key={d.key} className="text-center flex-1">
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
