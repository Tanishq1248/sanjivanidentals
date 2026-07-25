"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Users,
  CalendarDays,
  CheckCircle2,
  Clock,
  IndianRupee,
  Activity,
  ChevronRight,
  Menu,
  Stethoscope,
  Phone,
  FileText,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { AdminAuthGuard } from "../../../../components/auth/AdminAuthGuard";
import { useSidebarStore } from "../../../../lib/store/useSidebarStore";
import { Sidebar } from "../../../../components/admin/Sidebar";
import { queryKeys } from "../../../../lib/query/queryKeys";
import { getPatients } from "../../../../lib/services/patientService";
import { getAppointments } from "../../../../lib/services/appointmentService";
import { getInvoices } from "../../../../lib/services/invoiceService";
import { getAllEncounters, getFollowUpsDueThisWeek } from "../../../../lib/services/patientService";

// Helper to format currency
function formatINR(val: number) {
  if (isNaN(val)) return "0";
  return val.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function todayStr(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function formatDateDisplay(dateStr?: string) {
  if (!dateStr) return "—";
  if (dateStr.includes("-")) {
    const [y, m, d] = dateStr.split("-");
    if (y && m && d) return `${d}/${m}/${y}`;
  }
  return dateStr;
}

export function AnalyticsPageContent() {
  const { sidebarOpen, setSidebarOpen } = useSidebarStore();

  const today = todayStr();

  // Queries for real data
  const { data: patients = [], isLoading: loadingPatients } = useQuery({
    queryKey: queryKeys.patients.all,
    queryFn: getPatients,
    staleTime: 60_000,
  });

  const { data: appointments = [], isLoading: loadingAppointments } = useQuery({
    queryKey: queryKeys.appointments.all,
    queryFn: () => getAppointments("all"),
    staleTime: 60_000,
  });

  const { data: encounters = [], isLoading: loadingEncounters } = useQuery({
    queryKey: ["allEncounters"],
    queryFn: () => getAllEncounters(300),
    staleTime: 60_000,
  });

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: queryKeys.invoices.all,
    queryFn: getInvoices,
    staleTime: 60_000,
  });

  const { data: followUps = [], isLoading: loadingFollowUps } = useQuery({
    queryKey: queryKeys.encounters.followUpsDue,
    queryFn: getFollowUpsDueThisWeek,
    staleTime: 60_000,
  });

  const isLoading = loadingPatients || loadingAppointments || loadingEncounters || loadingInvoices || loadingFollowUps;

  // Patient ID -> Name lookup map
  const patientMap = useMemo(() => {
    const map = new Map<string, string>();
    patients.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [patients]);

  // ── Calculated Analytics Data ──

  // 1. Appointments Summary
  const todayAppointments = useMemo(
    () => appointments.filter((a) => a.date === today),
    [appointments, today]
  );

  const appointmentStats = useMemo(() => {
    let completed = 0;
    let scheduled = 0;
    let cancelled = 0;
    let inProgress = 0;

    appointments.forEach((a) => {
      const st = (a.status || "Scheduled").toLowerCase();
      if (st.includes("completed") || st.includes("done")) completed++;
      else if (st.includes("cancel") || st.includes("no-show")) cancelled++;
      else if (st.includes("progress")) inProgress++;
      else scheduled++;
    });

    return { completed, scheduled, cancelled, inProgress, total: appointments.length };
  }, [appointments]);

  // 2. Treatments Summary
  const { allTreatments, completedTreatmentsCount, pendingTreatmentsCount, topProcedures } = useMemo(() => {
    const list: Array<{ id: string; name: string; status: string; fee: number; date: string }> = [];
    const procedureMap = new Map<string, number>();

    let compCount = 0;
    let pendCount = 0;

    encounters.forEach((enc) => {
      if (enc.toothTreatments && enc.toothTreatments.length > 0) {
        enc.toothTreatments.forEach((tt) => {
          const st = enc.status === "Completed" ? "Completed" : tt.treatmentStatus || tt.status || "Planned";
          const isComp = st === "Completed";
          if (isComp) compCount++;
          else pendCount++;

          const name = tt.treatmentName || "General Consultation";
          procedureMap.set(name, (procedureMap.get(name) || 0) + 1);

          list.push({
            id: tt.id,
            name,
            status: st,
            fee: tt.fee || 0,
            date: tt.date || enc.visitDate,
          });
        });
      } else if (enc.treatments && enc.treatments.length > 0) {
        enc.treatments.forEach((tName, idx) => {
          const st = enc.status === "Completed" ? "Completed" : "Planned";
          if (st === "Completed") compCount++;
          else pendCount++;

          procedureMap.set(tName, (procedureMap.get(tName) || 0) + 1);

          list.push({
            id: `${enc.id}-${idx}`,
            name: tName,
            status: st,
            fee: 0,
            date: enc.visitDate,
          });
        });
      }
    });

    const topProcs = Array.from(procedureMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      allTreatments: list,
      completedTreatmentsCount: compCount,
      pendingTreatmentsCount: pendCount,
      topProcedures: topProcs,
    };
  }, [encounters]);

  // 3. Billing & Revenue Summary
  const billingStats = useMemo(() => {
    let totalBilled = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let paidInvoicesCount = 0;
    let pendingInvoicesCount = 0;
    let todayRevenue = 0;

    invoices.forEach((inv) => {
      const invTotal = inv.total || inv.amount || 0;
      const paid = inv.paidAmount || (inv.paymentStatus === "Paid" || inv.paymentStatus === "PAID" ? invTotal : 0);
      const remaining = Math.max(0, invTotal - paid);

      totalBilled += invTotal;
      totalCollected += paid;
      totalPending += remaining;

      if (inv.paymentStatus === "Paid" || inv.paymentStatus === "PAID" || remaining === 0) {
        paidInvoicesCount++;
      } else {
        pendingInvoicesCount++;
      }

      if (inv.invoiceDate === today || inv.dueDate === today) {
        todayRevenue += paid;
      }
    });

    const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100;

    return {
      totalBilled,
      totalCollected,
      totalPending,
      paidInvoicesCount,
      pendingInvoicesCount,
      todayRevenue,
      collectionRate,
    };
  }, [invoices, today]);

  // 4. Follow-up Analytics
  const followUpStats = useMemo(() => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    let overdueCount = 0;
    let dueTodayCount = 0;
    let dueThisWeekCount = 0;

    followUps.forEach((enc) => {
      if (!enc.followUpDate) return;
      const fDate = new Date(enc.followUpDate);
      fDate.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil((fDate.getTime() - todayDate.getTime()) / (1000 * 3600 * 24));

      if (diffDays < 0) overdueCount++;
      else if (diffDays === 0) dueTodayCount++;
      else if (diffDays <= 7) dueThisWeekCount++;
    });

    return {
      total: followUps.length,
      overdueCount,
      dueTodayCount,
      dueThisWeekCount,
    };
  }, [followUps]);

  return (
    <div className="min-h-screen flex bg-[#f8fafc] font-sans text-on-surface">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[200px] shrink-0 border-r border-outline-variant/20 sticky top-0 h-screen shadow-sm flex-col">
        <Sidebar currentPage="analytics" />
      </aside>

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[220px] shadow-level-2 transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar currentPage="analytics" onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b border-outline-variant/20 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-surface-variant text-primary shrink-0 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Activity className="w-5.5 h-5.5 text-primary" />
              <div>
                <h1 className="text-base md:text-lg font-bold text-primary font-sans leading-tight">
                  Clinical Analytics
                </h1>
                <p className="text-[11px] text-on-surface-variant hidden sm:block">
                  Dental practice activity, patient load, treatment insights, and billing collections
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" /> Clinic Active
            </span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-grow p-4 md:p-6 lg:p-8 space-y-6">
          {isLoading ? (
            <div className="py-20 text-center text-on-surface-variant">
              <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm font-bold">Loading Clinical Analytics...</p>
              <p className="text-xs text-on-surface-variant/70 mt-1">Aggregating real-time patient, treatment &amp; billing metrics</p>
            </div>
          ) : (
            <>
              {/* ── SECTION 1: TOP KPI CARDS ── */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 md:gap-4">
                {/* 1. Total Patients */}
                <div className="bg-white rounded-2xl border border-outline-variant/15 p-4 shadow-xs hover:border-primary/30 transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider">Patients</span>
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-xl md:text-2xl font-extrabold text-on-surface font-sans block">{patients.length}</span>
                    <span className="text-[10px] font-semibold text-emerald-600 block mt-0.5">Active Records</span>
                  </div>
                </div>

                {/* 2. Today's Appointments */}
                <div className="bg-white rounded-2xl border border-outline-variant/15 p-4 shadow-xs hover:border-primary/30 transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider">Today's Visits</span>
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-xl md:text-2xl font-extrabold text-on-surface font-sans block">{todayAppointments.length}</span>
                    <span className="text-[10px] font-semibold text-amber-600 block mt-0.5">Scheduled Today</span>
                  </div>
                </div>

                {/* 3. Completed Treatments */}
                <div className="bg-white rounded-2xl border border-outline-variant/15 p-4 shadow-xs hover:border-primary/30 transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider">Completed</span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-xl md:text-2xl font-extrabold text-emerald-700 font-sans block">{completedTreatmentsCount}</span>
                    <span className="text-[10px] font-semibold text-emerald-600 block mt-0.5">Done Procedures</span>
                  </div>
                </div>

                {/* 4. Pending Treatments */}
                <div className="bg-white rounded-2xl border border-outline-variant/15 p-4 shadow-xs hover:border-primary/30 transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider">Pending Tx</span>
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-xl md:text-2xl font-extrabold text-indigo-700 font-sans block">{pendingTreatmentsCount}</span>
                    <span className="text-[10px] font-semibold text-indigo-600 block mt-0.5">Planned / In Progress</span>
                  </div>
                </div>

                {/* 5. Today's Revenue */}
                <div className="bg-white rounded-2xl border border-outline-variant/15 p-4 shadow-xs hover:border-primary/30 transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider">Today's Cash</span>
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                      <IndianRupee className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-xl md:text-2xl font-extrabold text-teal-700 font-mono block">₹{formatINR(billingStats.todayRevenue)}</span>
                    <span className="text-[10px] font-semibold text-teal-600 block mt-0.5">Collected Today</span>
                  </div>
                </div>

                {/* 6. Pending Payments */}
                <div className="bg-white rounded-2xl border border-outline-variant/15 p-4 shadow-xs hover:border-primary/30 transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider">Pending Dues</span>
                    <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-xl md:text-2xl font-extrabold text-rose-600 font-mono block">₹{formatINR(billingStats.totalPending)}</span>
                    <span className="text-[10px] font-semibold text-rose-500 block mt-0.5">{billingStats.pendingInvoicesCount} Invoices Due</span>
                  </div>
                </div>

                {/* 7. Follow-ups Due */}
                <div className="bg-white rounded-2xl border border-outline-variant/15 p-4 shadow-xs hover:border-primary/30 transition-all flex flex-col justify-between col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider">Recall Due</span>
                    <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Phone className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-xl md:text-2xl font-extrabold text-purple-700 font-sans block">{followUpStats.total}</span>
                    <span className="text-[10px] font-semibold text-purple-600 block mt-0.5">Due This Week</span>
                  </div>
                </div>
              </div>

              {/* ── SECTION 2 & 3: APPOINTMENT LOAD & TREATMENT ANALYTICS ── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Appointment Load Breakdown (7 cols) */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-outline-variant/15 p-5 md:p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                        <CalendarDays className="w-4.5 h-4.5 text-primary" />
                        Appointment Load &amp; Status Trends
                      </h3>
                      <p className="text-xs text-on-surface-variant">Breakdown of scheduled patient appointments</p>
                    </div>
                    <Link href="/admin/calendar" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                      Calendar <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* Status Progress Bars */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-on-surface mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Completed Visits
                        </span>
                        <span>{appointmentStats.completed} ({appointmentStats.total > 0 ? Math.round((appointmentStats.completed / appointmentStats.total) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${appointmentStats.total > 0 ? (appointmentStats.completed / appointmentStats.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-on-surface mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Scheduled / Upcoming
                        </span>
                        <span>{appointmentStats.scheduled} ({appointmentStats.total > 0 ? Math.round((appointmentStats.scheduled / appointmentStats.total) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all"
                          style={{ width: `${appointmentStats.total > 0 ? (appointmentStats.scheduled / appointmentStats.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-on-surface mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Cancelled / No-show
                        </span>
                        <span>{appointmentStats.cancelled} ({appointmentStats.total > 0 ? Math.round((appointmentStats.cancelled / appointmentStats.total) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all"
                          style={{ width: `${appointmentStats.total > 0 ? (appointmentStats.cancelled / appointmentStats.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Today's Schedule Quick Table */}
                  <div className="pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2.5">
                      Today's Patient Schedule ({todayAppointments.length})
                    </h4>
                    {todayAppointments.length === 0 ? (
                      <div className="p-4 text-center text-xs text-on-surface-variant/70 italic bg-surface-container-lowest rounded-xl border border-outline-variant/10">
                        No appointments scheduled for today.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1 font-sans">
                        {todayAppointments.map((app) => (
                          <div key={app.id} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/10 hover:border-outline-variant/25 transition-colors">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                                {app.patientName ? app.patientName[0].toUpperCase() : "P"}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-on-surface leading-tight">{app.patientName}</p>
                                <p className="text-[10px] text-on-surface-variant">{app.service || "General Checkup"}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[11px] font-bold text-on-surface block font-mono">{app.time}</span>
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                app.status === "Completed" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                              }`}>
                                {app.status || "Scheduled"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Treatment Analytics (5 cols) */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-outline-variant/15 p-5 md:p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                        <Stethoscope className="w-4.5 h-4.5 text-primary" />
                        Top Clinical Procedures
                      </h3>
                      <p className="text-xs text-on-surface-variant">Most frequent dental treatments performed</p>
                    </div>
                  </div>

                  {topProcedures.length === 0 ? (
                    <div className="p-8 text-center text-xs text-on-surface-variant/70 italic bg-surface-container-lowest rounded-xl border border-outline-variant/10">
                      No treatment logs recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {topProcedures.map((proc) => {
                        const percentage = allTreatments.length > 0 ? Math.round((proc.count / allTreatments.length) * 100) : 0;
                        return (
                          <div key={proc.name} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-on-surface">
                              <span className="truncate pr-2 font-bold">{proc.name}</span>
                              <span className="text-on-surface-variant shrink-0 font-mono text-[11px]">{proc.count} cases ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-primary h-full rounded-full transition-all"
                                style={{ width: `${Math.max(8, percentage)}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Planned vs Completed Summary Card */}
                  <div className="p-3.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Clinical Completion Rate</span>
                      <span className="text-base font-extrabold text-emerald-700">
                        {allTreatments.length > 0 ? Math.round((completedTreatmentsCount / allTreatments.length) * 100) : 0}% Done
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-on-surface block">{completedTreatmentsCount} Completed</span>
                      <span className="text-[10px] font-medium text-on-surface-variant block">{pendingTreatmentsCount} Planned</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SECTION 4 & 5: BILLING COLLECTION & RECALL FOLLOW-UPS ── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Billing & Collection Efficiency (6 cols) */}
                <div className="lg:col-span-6 bg-white rounded-2xl border border-outline-variant/15 p-5 md:p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                        <CreditCard className="w-4.5 h-4.5 text-primary" />
                        Billing Collection &amp; Efficiency
                      </h3>
                      <p className="text-xs text-on-surface-variant">Operational billing totals and collection performance</p>
                    </div>
                    <Link href="/admin/billing" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                      Billing <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Billed</span>
                      <span className="text-sm md:text-base font-extrabold text-slate-900 font-mono block mt-1">₹{formatINR(billingStats.totalBilled)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase block">Cash Received</span>
                      <span className="text-sm md:text-base font-extrabold text-emerald-800 font-mono block mt-1">₹{formatINR(billingStats.totalCollected)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80">
                      <span className="text-[10px] font-bold text-rose-700 uppercase block">Outstanding</span>
                      <span className="text-sm md:text-base font-extrabold text-rose-800 font-mono block mt-1">₹{formatINR(billingStats.totalPending)}</span>
                    </div>
                  </div>

                  {/* Collection Rate Meter */}
                  <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-on-surface">Clinic Collection Efficiency</span>
                      <span className="font-extrabold text-teal-600 font-mono text-sm">{billingStats.collectionRate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, billingStats.collectionRate)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-on-surface-variant font-medium pt-1">
                      <span>{billingStats.paidInvoicesCount} Paid Invoices</span>
                      <span>{billingStats.pendingInvoicesCount} Unpaid / Partial</span>
                    </div>
                  </div>
                </div>

                {/* Follow-up & Recall Analytics (6 cols) */}
                <div className="lg:col-span-6 bg-white rounded-2xl border border-outline-variant/15 p-5 md:p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                        <Phone className="w-4.5 h-4.5 text-primary" />
                        Patient Recall &amp; Follow-ups
                      </h3>
                      <p className="text-xs text-on-surface-variant">Scheduled clinical checkups and post-treatment recalls</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-purple-50 border border-purple-200/80">
                      <span className="text-[10px] font-bold text-purple-700 uppercase block">Due This Week</span>
                      <span className="text-base font-extrabold text-purple-900 font-sans block mt-1">{followUpStats.total}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80">
                      <span className="text-[10px] font-bold text-rose-700 uppercase block">Overdue</span>
                      <span className="text-base font-extrabold text-rose-900 font-sans block mt-1">{followUpStats.overdueCount}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80">
                      <span className="text-[10px] font-bold text-amber-700 uppercase block">Due Today</span>
                      <span className="text-base font-extrabold text-amber-900 font-sans block mt-1">{followUpStats.dueTodayCount}</span>
                    </div>
                  </div>

                  {/* Follow-up List Preview */}
                  {followUps.length === 0 ? (
                    <div className="p-4 text-center text-xs text-on-surface-variant/70 italic bg-surface-container-lowest rounded-xl border border-outline-variant/10">
                      No upcoming recall follow-ups scheduled for this week.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {followUps.slice(0, 4).map((enc) => (
                        <div key={enc.id} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/10 text-xs">
                          <div>
                            <span className="font-bold text-on-surface block">{patientMap.get(enc.patientId) || "Patient"}</span>
                            <span className="text-[10px] text-on-surface-variant">{enc.notes || "Clinical Checkup Follow-up"}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-[10px] text-primary font-bold block">{formatDateDisplay(enc.followUpDate)}</span>
                            <span className="text-[9px] font-semibold text-purple-700">Scheduled</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── SECTION 6: RECENT CLINICAL ACTIVITY FEED ── */}
              <div className="bg-white rounded-2xl border border-outline-variant/15 p-5 md:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
                  <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <Activity className="w-4.5 h-4.5 text-primary" />
                    Recent Clinical Activity Stream
                  </h3>
                  <span className="text-xs text-on-surface-variant font-medium">Live Activity Feed</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Recent Encounters */}
                  <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10 space-y-3">
                    <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                      <FileText className="w-3.5 h-3.5 text-primary" /> Recent Encounters
                    </h4>
                    {encounters.length === 0 ? (
                      <p className="text-xs text-on-surface-variant/70 italic">No recent encounters.</p>
                    ) : (
                      <div className="space-y-2">
                        {encounters.slice(0, 3).map((e) => (
                          <div key={e.id} className="text-xs border-b border-outline-variant/10 pb-1.5 last:border-b-0">
                            <span className="font-bold text-on-surface block truncate">{patientMap.get(e.patientId) || "Patient"}</span>
                            <span className="text-[10px] text-on-surface-variant flex justify-between">
                              <span>{formatDateDisplay(e.visitDate)}</span>
                              <span className="font-semibold text-emerald-600">{e.status}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Invoices */}
                  <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10 space-y-3">
                    <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                      <CreditCard className="w-3.5 h-3.5 text-primary" /> Recent Invoices
                    </h4>
                    {invoices.length === 0 ? (
                      <p className="text-xs text-on-surface-variant/70 italic">No recent invoices.</p>
                    ) : (
                      <div className="space-y-2">
                        {invoices.slice(0, 3).map((inv) => (
                          <div key={inv.id} className="text-xs border-b border-outline-variant/10 pb-1.5 last:border-b-0">
                            <span className="font-bold text-on-surface block truncate">{inv.patientName}</span>
                            <span className="text-[10px] text-on-surface-variant flex justify-between font-mono">
                              <span>₹{formatINR(inv.total || inv.amount)}</span>
                              <span className="font-semibold text-indigo-600">{inv.paymentStatus || "UNPAID"}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Registered Patients */}
                  <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10 space-y-3">
                    <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                      <Users className="w-3.5 h-3.5 text-primary" /> New Registered Patients
                    </h4>
                    {patients.length === 0 ? (
                      <p className="text-xs text-on-surface-variant/70 italic">No patients registered.</p>
                    ) : (
                      <div className="space-y-2">
                        {patients.slice(0, 3).map((p) => (
                          <div key={p.id} className="text-xs border-b border-outline-variant/10 pb-1.5 last:border-b-0 flex justify-between items-center">
                            <div>
                              <span className="font-bold text-on-surface block truncate">{p.name}</span>
                              <span className="text-[10px] text-on-surface-variant">{p.phone}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500">{p.gender || "Patient"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AdminAuthGuard>
      <AnalyticsPageContent />
    </AdminAuthGuard>
  );
}
