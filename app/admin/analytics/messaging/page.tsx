"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Mail,
  RefreshCw,
  Search,
  Filter,
  X,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Menu,
  FileText,
  Receipt,
  Calendar,
  User,
  Info,
} from "lucide-react";
import { AdminAuthGuard } from "../../../../components/auth/AdminAuthGuard";
import { Sidebar } from "../../../../components/admin/Sidebar";
import {
  getMessagingAnalyticsStats,
  getPaginatedMessageLogs,
  type MessagingStats,
} from "../../../../lib/services/messagingAnalyticsService";
import type { MessageLogEntry, WhatsAppDeliveryStatus } from "../../../../lib/types";

function formatTimestamp(ts?: any): string {
  if (!ts) return "—";
  try {
    const seconds = typeof ts.seconds === "number" ? ts.seconds : null;
    const date = seconds ? new Date(seconds * 1000) : new Date(ts);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function MessagingAnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MessageLogEntry | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<"all" | "whatsapp" | "email">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // React Query: Stats & Logs
  const {
    data: stats,
    isLoading: isStatsLoading,
    refetch: refetchStats,
    isRefetching,
  } = useQuery<MessagingStats>({
    queryKey: ["messaging-analytics-stats"],
    queryFn: getMessagingAnalyticsStats,
    staleTime: 30 * 1000,
  });

  const { data: logsData, isLoading: isLogsLoading } = useQuery({
    queryKey: ["messaging-analytics-logs"],
    queryFn: () => getPaginatedMessageLogs(100),
    staleTime: 30 * 1000,
  });

  const rawLogs = logsData?.logs || [];

  // Filtered Activity Logs
  const filteredLogs = useMemo(() => {
    return rawLogs.filter((log) => {
      // Channel Filter
      if (channelFilter === "whatsapp" && log.recipient?.includes("@")) return false;
      if (channelFilter === "email" && !log.recipient?.includes("@")) return false;

      // Status Filter
      if (statusFilter !== "all" && log.status !== statusFilter) return false;

      // Type Filter
      if (typeFilter !== "all" && log.messageType !== typeFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const patientMatch = (log.patientId || "").toLowerCase().includes(q);
        const recipientMatch = (log.recipient || "").toLowerCase().includes(q);
        const typeMatch = (log.messageType || "").toLowerCase().includes(q);
        const encMatch = (log.encounterId || "").toLowerCase().includes(q);
        const invMatch = (log.invoiceId || "").toLowerCase().includes(q);
        return patientMatch || recipientMatch || typeMatch || encMatch || invMatch;
      }

      return true;
    });
  }, [rawLogs, channelFilter, statusFilter, typeFilter, searchQuery]);

  // Quota Metrics
  const quotaUsed = stats?.whatsAppSentMonth || 0;
  const quotaLimit = stats?.whatsAppLimit || 500;
  const quotaRemaining = stats?.whatsAppRemainingMonth || 500;
  const quotaPct = Math.min(100, Math.round((quotaUsed / quotaLimit) * 100));

  const progressColorClass =
    quotaPct >= 90
      ? "bg-rose-500"
      : quotaPct >= 70
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <AdminAuthGuard>
      <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans text-slate-800">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex shrink-0 h-full sticky top-0 shadow-2xs z-30">
          <Sidebar currentPage="messaging-analytics" />
        </div>

        {/* Mobile Sidebar Modal */}
        <AnimatePresence>
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 md:hidden flex">
              <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="relative w-64 bg-white h-full shadow-2xl z-10">
                <Sidebar
                  currentPage="messaging-analytics"
                  onClose={() => setSidebarOpen(false)}
                />
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Top Bar Header */}
          <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-teal-600" />
                  Messaging Analytics
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Operational monitoring center for clinic WhatsApp &amp; Email communications
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => refetchStats()}
              disabled={isRefetching}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </header>

          {/* Scrollable Dashboard Body */}
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* ── SECTION 1: 6 KPI OVERVIEW CARDS ── */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Card 1 */}
              <div className="p-4.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  WhatsApp Sent
                </span>
                <span className="text-2xl font-black text-slate-900 block font-mono">
                  {isStatsLoading ? "—" : stats?.whatsAppSentMonth}
                </span>
                <span className="text-[10px] text-teal-600 font-bold block">Current Month</span>
              </div>

              {/* Card 2 */}
              <div className="p-4.5 bg-emerald-50/60 border border-emerald-100 rounded-2xl shadow-2xs space-y-1">
                <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">
                  WhatsApp Remaining
                </span>
                <span className="text-2xl font-black text-emerald-800 block font-mono">
                  {isStatsLoading ? "—" : quotaRemaining}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold block">Out of 500 Limit</span>
              </div>

              {/* Card 3 */}
              <div className="p-4.5 bg-sky-50/60 border border-sky-100 rounded-2xl shadow-2xs space-y-1">
                <span className="text-[10px] font-extrabold text-sky-700 uppercase tracking-wider block">
                  Emails Sent
                </span>
                <span className="text-2xl font-black text-sky-800 block font-mono">
                  {isStatsLoading ? "—" : stats?.emailsSentMonth}
                </span>
                <span className="text-[10px] text-sky-600 font-semibold block">Current Month</span>
              </div>

              {/* Card 4 */}
              <div className="p-4.5 bg-rose-50/60 border border-rose-100 rounded-2xl shadow-2xs space-y-1">
                <span className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider block">
                  Failed Messages
                </span>
                <span className="text-2xl font-black text-rose-800 block font-mono">
                  {isStatsLoading ? "—" : stats?.failedCount}
                </span>
                <span className="text-[10px] text-rose-600 font-semibold block">Email + WhatsApp</span>
              </div>

              {/* Card 5 */}
              <div className="p-4.5 bg-teal-50/60 border border-teal-100 rounded-2xl shadow-2xs space-y-1">
                <span className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wider block">
                  Delivery Success Rate
                </span>
                <span className="text-2xl font-black text-teal-900 block font-mono">
                  {isStatsLoading ? "—" : `${stats?.successRate}%`}
                </span>
                <span className="text-[10px] text-teal-600 font-semibold block">Overall Reliability</span>
              </div>

              {/* Card 6 */}
              <div className="p-4.5 bg-amber-50/60 border border-amber-100 rounded-2xl shadow-2xs space-y-1">
                <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">
                  Pending Deliveries
                </span>
                <span className="text-2xl font-black text-amber-900 block font-mono">
                  {isStatsLoading ? "—" : stats?.pendingCount}
                </span>
                <span className="text-[10px] text-amber-600 font-semibold block">Queued / Sending</span>
              </div>
            </div>

            {/* ── SECTION 2 & 3: MONTHLY QUOTA & DELIVERY BREAKDOWN ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Monthly WhatsApp Quota Card (6 cols) */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Send className="w-4.5 h-4.5 text-teal-600" />
                    <h3 className="text-sm font-bold text-slate-900">Monthly WhatsApp Quota Usage</h3>
                  </div>
                  {quotaPct >= 90 && (
                    <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold border border-rose-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      Nearing Limit ({quotaPct}%)
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end text-xs font-bold">
                    <span className="text-slate-600">
                      Messages Sent: <span className="text-slate-900 font-mono">{quotaUsed}</span> / {quotaLimit}
                    </span>
                    <span className="text-slate-500">
                      Remaining: <span className="text-teal-700 font-mono">{quotaRemaining}</span>
                    </span>
                  </div>

                  {/* Horizontal Progress Bar */}
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${progressColorClass}`}
                      style={{ width: `${quotaPct}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                    <span>Usage: <strong className="text-slate-800 font-mono">{quotaPct}%</strong></span>
                    <span>Last Updated: {stats?.lastUpdated || "Just now"}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Analytics Grid (6 cols) */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-teal-600" />
                    Delivery Status Breakdown
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-0.5">
                    <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">Delivered</span>
                    <span className="text-lg font-black text-emerald-900 font-mono block">
                      {stats?.statusCounts?.delivered || 0}
                    </span>
                  </div>

                  <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl space-y-0.5">
                    <span className="text-[10px] font-extrabold text-teal-800 uppercase block">Sent</span>
                    <span className="text-lg font-black text-teal-900 font-mono block">
                      {stats?.statusCounts?.sent || 0}
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl space-y-0.5">
                    <span className="text-[10px] font-extrabold text-amber-800 uppercase block">Queued</span>
                    <span className="text-lg font-black text-amber-900 font-mono block">
                      {stats?.statusCounts?.queued || 0}
                    </span>
                  </div>

                  <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-xl space-y-0.5">
                    <span className="text-[10px] font-extrabold text-sky-800 uppercase block">Sending</span>
                    <span className="text-lg font-black text-sky-900 font-mono block">
                      {stats?.statusCounts?.sending || 0}
                    </span>
                  </div>

                  <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl space-y-0.5">
                    <span className="text-[10px] font-extrabold text-rose-800 uppercase block">Failed</span>
                    <span className="text-lg font-black text-rose-900 font-mono block">
                      {stats?.statusCounts?.failed || 0}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-100/80 border border-slate-200 rounded-xl space-y-0.5">
                    <span className="text-[10px] font-extrabold text-slate-600 uppercase block">Quota Exceeded</span>
                    <span className="text-lg font-black text-slate-800 font-mono block">
                      {stats?.statusCounts?.quotaExceeded || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION 4: FEATURE BREAKDOWN ── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Message Breakdown by Feature</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Prescription */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-teal-600" /> Prescriptions
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {stats?.featureBreakdown?.prescription?.sent || 0} Sent
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-0.5 font-medium">
                    <p>Delivered: <strong className="text-emerald-700 font-mono">{stats?.featureBreakdown?.prescription?.delivered || 0}</strong></p>
                    <p>Failed: <strong className="text-rose-700 font-mono">{stats?.featureBreakdown?.prescription?.failed || 0}</strong></p>
                  </div>
                </div>

                {/* Invoice */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-sky-600" /> Invoices
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {stats?.featureBreakdown?.invoice?.sent || 0} Sent
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-0.5 font-medium">
                    <p>Delivered: <strong className="text-emerald-700 font-mono">{stats?.featureBreakdown?.invoice?.delivered || 0}</strong></p>
                    <p>Failed: <strong className="text-rose-700 font-mono">{stats?.featureBreakdown?.invoice?.failed || 0}</strong></p>
                  </div>
                </div>

                {/* Appointment Reminder */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-purple-600" /> Reminders
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {stats?.featureBreakdown?.appointment_reminder?.sent || 0} Sent
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-0.5 font-medium">
                    <p>Delivered: <strong className="text-emerald-700 font-mono">{stats?.featureBreakdown?.appointment_reminder?.delivered || 0}</strong></p>
                    <p>Failed: <strong className="text-rose-700 font-mono">{stats?.featureBreakdown?.appointment_reminder?.failed || 0}</strong></p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION 5, 7, 8: RECENT MESSAGE ACTIVITY TABLE & FILTERS ── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Recent Message Activity</h3>

                {/* Search Bar */}
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search patient, phone, ID..."
                    className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500/20 outline-none"
                  />
                </div>
              </div>

              {/* Filter Controls Bar */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500">Channel:</span>
                  <select
                    value={channelFilter}
                    onChange={(e: any) => setChannelFilter(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="all">All Channels</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="delivered">Delivered</option>
                    <option value="sent">Sent</option>
                    <option value="queued">Queued</option>
                    <option value="sending">Sending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500">Feature:</span>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="all">All Features</option>
                    <option value="prescription">Prescription</option>
                    <option value="invoice">Invoice</option>
                    <option value="appointment_reminder">Appointment Reminder</option>
                  </select>
                </div>
              </div>

              {/* Activity Table */}
              {isLogsLoading ? (
                <div className="p-12 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">Loading message activity logs...</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">No communication activity available matching filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                        <th className="p-3">Date &amp; Time</th>
                        <th className="p-3">Patient ID</th>
                        <th className="p-3">Feature</th>
                        <th className="p-3">Channel</th>
                        <th className="p-3">Recipient</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Attempts</th>
                        <th className="p-3 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredLogs.map((log) => {
                        const isEmail = log.recipient?.includes("@");
                        const status = (log.status || "").toLowerCase();

                        const statusBadge =
                          status === "delivered"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : status === "sent"
                            ? "bg-teal-50 text-teal-700 border-teal-200"
                            : status === "queued" || status === "sending"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200";

                        return (
                          <tr
                            key={log.id}
                            onClick={() => setSelectedLog(log)}
                            className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                          >
                            <td className="p-3 text-slate-600">
                              {formatTimestamp(log.createdAt)}
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-800">
                              {log.patientId ? `#${log.patientId.slice(0, 8)}` : "—"}
                            </td>
                            <td className="p-3 text-slate-800 capitalize">
                              {log.messageType?.replace("_", " ") || "General"}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${isEmail ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                                {isEmail ? "Email" : "WhatsApp"}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-slate-700">
                              {log.recipient || "—"}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${statusBadge}`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="p-3 text-center font-bold text-slate-600">
                              {log.attemptCount || 1}
                            </td>
                            <td className="p-3 text-right">
                              <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </main>
        </div>

        {/* ── SECTION 6: MESSAGE DETAILS SIDE DRAWER ── */}
        <AnimatePresence>
          {selectedLog && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
                onClick={() => setSelectedLog(null)}
              />

              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col font-sans"
              >
                {/* Drawer Header */}
                <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-teal-600" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Message Log Details</h3>
                      <p className="text-[11px] text-slate-500">ID: {selectedLog.id}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedLog(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Delivery Status</span>
                      <span className="px-2.5 py-0.5 rounded-full font-bold capitalize border bg-teal-50 text-teal-800 border-teal-200">
                        {selectedLog.status}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">CHANNEL</span>
                        <span className="font-bold">{selectedLog.recipient?.includes("@") ? "Email" : "WhatsApp"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">RECIPIENT</span>
                        <span className="font-mono font-semibold">{selectedLog.recipient}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Patient ID</span>
                      <span className="font-bold text-slate-900 font-mono">{selectedLog.patientId || "N/A"}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Feature / Type</span>
                      <span className="font-bold text-slate-900 capitalize">{selectedLog.messageType?.replace("_", " ") || "General"}</span>
                    </div>

                    {selectedLog.encounterId && (
                      <div>
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Encounter ID</span>
                        <span className="font-mono text-slate-800">{selectedLog.encounterId}</span>
                      </div>
                    )}

                    {selectedLog.invoiceId && (
                      <div>
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Invoice ID</span>
                        <span className="font-mono text-slate-800">{selectedLog.invoiceId}</span>
                      </div>
                    )}

                    {selectedLog.appointmentId && (
                      <div>
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Appointment ID</span>
                        <span className="font-mono text-slate-800">{selectedLog.appointmentId}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Created Time</span>
                        <span className="text-slate-700">{formatTimestamp(selectedLog.createdAt)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Delivered / Updated</span>
                        <span className="text-slate-700">{formatTimestamp(selectedLog.deliveredAt || selectedLog.updatedAt)}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Attempt Count</span>
                      <span className="font-bold text-slate-800">{selectedLog.attemptCount || 1} Attempt(s)</span>
                    </div>

                    {selectedLog.twilioMessageSid && (
                      <div>
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Twilio Message SID (Admin)</span>
                        <span className="font-mono text-[11px] text-slate-600 select-all block bg-slate-100 p-2 rounded-lg break-all">
                          {selectedLog.twilioMessageSid}
                        </span>
                      </div>
                    )}

                    {selectedLog.errorMessage && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                        <span className="text-[10px] font-extrabold text-rose-700 uppercase block">Error Details</span>
                        <p className="text-rose-900 font-mono text-[11px]">{selectedLog.errorMessage}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setSelectedLog(null)}
                    className="w-full py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors"
                  >
                    Close Details
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminAuthGuard>
  );
}
