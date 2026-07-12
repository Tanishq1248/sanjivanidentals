"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Stethoscope,
  CalendarDays,
  Users,
  CreditCard,
  Menu,
  X,
  LogOut,
  TrendingUp,
  Award,
  Share2,
  Calendar,
  Layers,
} from "lucide-react";
import { AdminAuthGuard } from "../../../components/auth/AdminAuthGuard";
import { useAuth } from "../../../lib/context/AuthContext";
import { useSidebarStore } from "../../../lib/store/useSidebarStore";
import { getReferralStats } from "../../../lib/services/patientService";
import { getInvoices } from "../../../lib/services/invoiceService";
import { queryKeys } from "../../../lib/query/queryKeys";
import { useMemo } from "react";

import { Sidebar } from "../../../components/admin/Sidebar";

/* ─── Main Referrals Page ─── */
function ReferralsPage() {
  const { logout, user } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useSidebarStore();

  /* ── Stats & Data queries ── */
  const { data: stats, isLoading } = useQuery({
    queryKey: queryKeys.referrals.stats,
    queryFn: getReferralStats,
    staleTime: 30_000,
  });

  /* Maximum count for source distribution scale */
  const maxSourceCount = useMemo(() => {
    if (!stats?.sourceDistribution || stats.sourceDistribution.length === 0) return 1;
    return Math.max(...stats.sourceDistribution.map((s) => s.count));
  }, [stats]);

  return (
    <div className="min-h-screen flex bg-[#f2f5f8] font-sans">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[200px] shrink-0 border-r border-outline-variant/20 sticky top-0 h-screen shadow-sm flex-col">
        <Sidebar currentPage="referrals" />
      </aside>

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[220px] shadow-level-2 transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          currentPage="referrals"
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b border-outline-variant/20 px-4 md:px-6 py-4 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-surface-variant text-primary shrink-0 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-primary font-sans leading-tight">Patient Referral Tracking</h1>
          </div>
          <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-secondary-container shrink-0 bg-primary flex items-center justify-center ml-auto">
            <span className="text-white font-bold text-sm">{user?.email?.[0]?.toUpperCase() || "A"}</span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-grow p-4 md:p-8 space-y-6">
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 bg-white rounded-xl border border-outline-variant/10 shadow-sm" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 h-80 bg-white rounded-xl border border-outline-variant/10 shadow-sm" />
                <div className="lg:col-span-4 h-80 bg-white rounded-xl border border-outline-variant/10 shadow-sm" />
              </div>
            </div>
          ) : !stats ? (
            <div className="py-16 text-center bg-white rounded-xl border border-outline-variant/10 shadow-sm">
              <p className="text-sm font-semibold text-on-surface-variant">No referral statistics available.</p>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Total Referrals */}
                <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] text-on-surface-variant/75 font-semibold uppercase tracking-wider block">Total Referrals</span>
                    <span className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight block">
                      {stats.totalReferrals}
                    </span>
                    <span className="text-[10px] font-semibold text-primary block uppercase">Patients joined via referrers</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Share2 className="w-5 h-5 text-primary" />
                  </div>
                </div>

                {/* KPI 2: Referred This Month */}
                <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] text-on-surface-variant/75 font-semibold uppercase tracking-wider block">Referred This Month</span>
                    <span className="text-2xl md:text-3xl font-extrabold text-teal-600 tracking-tight block">
                      {stats.thisMonthReferrals}
                    </span>
                    <span className="text-[10px] font-semibold text-on-surface-variant/50 block">Added in current calendar month</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-teal-600" />
                  </div>
                </div>

                {/* KPI 3: Top Referrer */}
                <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-5 flex items-center justify-between">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[11px] text-on-surface-variant/75 font-semibold uppercase tracking-wider block">Top Referrer</span>
                    <span className="text-base font-extrabold text-on-surface truncate block">
                      {stats.topReferrer ? stats.topReferrer.referrerName : "None yet"}
                    </span>
                    <span className="text-[10px] font-semibold text-amber-600 block uppercase">
                      {stats.topReferrer ? `${stats.topReferrer.count} Patients Referred` : "No referrals recorded"}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-amber-500" />
                  </div>
                </div>

                {/* KPI 4: Most Effective Source */}
                <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-5 flex items-center justify-between">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[11px] text-on-surface-variant/75 font-semibold uppercase tracking-wider block">Top Channel</span>
                    <span className="text-base font-extrabold text-purple-700 truncate block">
                      {stats.topSource || "None"}
                    </span>
                    <span className="text-[10px] font-semibold text-on-surface-variant/50 block uppercase">Most patients acquired via</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Top Referrers Leaderboard (8 Cols) */}
                <div className="lg:col-span-8 bg-white rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden flex flex-col">
                  <div className="px-5 py-4 border-b border-outline-variant/10">
                    <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" />
                      Top Referrers Leaderboard
                    </h2>
                  </div>

                  {stats.leaderboard.length === 0 ? (
                    <div className="py-16 text-center text-on-surface-variant/60 flex-grow">
                      <p className="text-xs font-semibold">No referrals recorded yet.</p>
                      <p className="text-[10px] mt-1">Referred patients will appear here when added via form.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead>
                          <tr className="border-b border-outline-variant/10 bg-surface-container-low/50">
                            <th className="px-5 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider w-16 text-center">Rank</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Referrer</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Contact</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider text-right w-36">Total Referrals</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.leaderboard.map((entry, index) => (
                            <tr key={entry.referrerId} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-low/30 transition-colors">
                              <td className="px-5 py-4 text-center">
                                <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-extrabold ${
                                  index === 0 ? "bg-amber-100 text-amber-800" :
                                  index === 1 ? "bg-slate-200 text-slate-800" :
                                  index === 2 ? "bg-amber-500/10 text-amber-900" :
                                  "bg-surface-container text-on-surface-variant"
                                }`}>
                                  {index + 1}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg ${entry.referrerAvatarColor || "bg-primary"} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                                    {entry.referrerName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                                  </div>
                                  <Link
                                    href={`/admin/patients/${entry.referrerId}`}
                                    className="font-bold text-on-surface hover:text-primary hover:underline"
                                  >
                                    {entry.referrerName}
                                  </Link>
                                </div>
                              </td>
                              <td className="px-5 py-4 font-mono text-xs text-on-surface-variant">
                                {entry.referrerPhone}
                              </td>
                              <td className="px-5 py-4 text-right font-extrabold text-on-surface pr-10 text-base">
                                {entry.count}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Right: Referral Source Analytics (4 Cols) */}
                <div className="lg:col-span-4 bg-white rounded-xl border border-outline-variant/10 shadow-sm p-5 space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      Acquisition Channels
                    </h2>
                    <p className="text-[10px] text-on-surface-variant/70 mt-1">Source distribution of acquired patients</p>
                  </div>

                  {stats.sourceDistribution.length === 0 ? (
                    <div className="py-16 text-center text-on-surface-variant/60">
                      <p className="text-xs font-semibold">No channels populated.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stats.sourceDistribution.map(({ source, count }) => {
                        const pct = (count / maxSourceCount) * 100;
                        return (
                          <div key={source} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-bold text-on-surface">
                              <span>{source}</span>
                              <span className="text-primary">{count} Patient{count !== 1 ? "s" : ""}</span>
                            </div>
                            <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-outline-variant/20 px-4 md:px-8 py-3 mt-auto">
          <p className="text-xs text-on-surface-variant text-center">© 2024 Sanjivani Dentals. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default function AdminReferralsPage() {
  return (
    <AdminAuthGuard>
      <ReferralsPage />
    </AdminAuthGuard>
  );
}
