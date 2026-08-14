"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Gift,
  Copy,
  Check,
  Plus,
  Users,
  Clock,
  Award,
  CalendarCheck,
  ExternalLink,
  Menu,
  X,
  Trash2,
  ChevronRight,
  Sparkles,
  Link2,
  Mail,
  Building2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { AdminAuthGuard } from "../../../components/auth/AdminAuthGuard";
import { useAuth } from "../../../lib/context/AuthContext";
import { useSidebarStore } from "../../../lib/store/useSidebarStore";
import { Sidebar } from "../../../components/admin/Sidebar";
import { queryKeys } from "../../../lib/query/queryKeys";
import {
  getOrCreateReferralConfig,
  getReferrals,
  addReferral,
  updateReferralStatus,
  deleteReferral,
  isDuplicateReferral,
  getSubscriptionInfo,
  getReferralDashboardStats,
} from "../../../lib/services/referEarnService";
import type { ClinicReferral, ClinicReferralStatus } from "../../../lib/types";

const REFERRAL_LINK_BASE = "https://app.dentapure.com/signup?ref=";

/* ─── Status badge config ─── */
const STATUS_CONFIG: Record<ClinicReferralStatus, { bg: string; text: string; dot: string }> = {
  Pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  Successful: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  "Reward Applied": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  Expired: { bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
};

function StatusBadge({ status }: { status: ClinicReferralStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

/* ─── Copy button with feedback ─── */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${
        copied
          ? "bg-emerald-100 text-emerald-700"
          : "bg-primary/10 text-primary hover:bg-primary/20"
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : label}
    </button>
  );
}

/* ─── Format date helper ─── */
function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * MAIN PAGE
 * ═══════════════════════════════════════════════════════════════════════════ */

function ReferEarnPage() {
  const { user } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useSidebarStore();
  const queryClient = useQueryClient();

  // ── Modal state ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ clinicName: "", email: "" });
  const [formError, setFormError] = useState("");

  // ── Toast ──
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Queries ──
  const { data: config } = useQuery({
    queryKey: queryKeys.clinicReferrals.config,
    queryFn: () => getOrCreateReferralConfig("clinic-1"),
    staleTime: 5 * 60_000,
  });

  const { data: referrals = [], isLoading: referralsLoading } = useQuery({
    queryKey: queryKeys.clinicReferrals.all,
    queryFn: getReferrals,
    staleTime: 30_000,
  });

  const { data: subInfo } = useQuery({
    queryKey: queryKeys.clinicReferrals.subscription,
    queryFn: () => getSubscriptionInfo("clinic-1"),
    staleTime: 60_000,
  });

  const { data: stats } = useQuery({
    queryKey: [...queryKeys.clinicReferrals.all, "stats"],
    queryFn: getReferralDashboardStats,
    staleTime: 30_000,
  });

  // ── Mutations ──
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.clinicReferrals.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.clinicReferrals.subscription });
  };

  const addMutation = useMutation({
    mutationFn: addReferral,
    onSuccess: () => {
      invalidateAll();
      setIsModalOpen(false);
      setFormData({ clinicName: "", email: "" });
      setFormError("");
      showToast("Referral added successfully!");
    },
    onError: (err: Error) => {
      showToast(err.message || "Failed to add referral.", "error");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ClinicReferralStatus }) =>
      updateReferralStatus(id, status),
    onSuccess: () => {
      invalidateAll();
      showToast("Referral status updated!");
    },
    onError: () => showToast("Failed to update status.", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReferral,
    onSuccess: () => {
      invalidateAll();
      showToast("Referral removed.");
    },
    onError: () => showToast("Failed to delete referral.", "error"),
  });

  // ── Form submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const name = formData.clinicName.trim();
    const email = formData.email.trim().toLowerCase();

    if (!name || !email) {
      setFormError("Please fill in all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    // Self-referral check
    if (user?.email && email === user.email.toLowerCase()) {
      setFormError("You cannot refer your own clinic.");
      return;
    }

    // Duplicate check
    const isDuplicate = await isDuplicateReferral(email);
    if (isDuplicate) {
      setFormError("This clinic has already been referred.");
      return;
    }

    addMutation.mutate({
      referredClinicName: name,
      referredClinicEmail: email,
    });
  };

  const referralCode = config?.referralCode || "—";
  const referralLink = config?.referralCode ? `${REFERRAL_LINK_BASE}${config.referralCode}` : "";

  return (
    <div className="min-h-screen flex bg-[#f2f5f8] font-sans">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[200px] shrink-0 border-r border-outline-variant/20 sticky top-0 h-screen shadow-sm flex-col">
        <Sidebar currentPage="refer-earn" />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[240px] bg-white shadow-lg transform transition-transform md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar currentPage="refer-earn" onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 px-4 md:px-8 py-6">
        {/* Mobile Header */}
        <div className="flex items-center gap-3 mb-6 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl bg-white shadow-sm border border-outline-variant/20 cursor-pointer"
          >
            <Menu className="w-5 h-5 text-on-surface-variant" />
          </button>
          <h1 className="text-lg font-extrabold text-on-surface">Refer & Earn</h1>
        </div>

        {/* Page Header */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Refer & Earn</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Refer other clinics and earn free subscription months for both of you.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl text-sm font-bold shadow-level-1 hover:shadow-level-2 transition-all cursor-pointer border-none active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Add Referral
          </button>
        </div>

        {/* ══════════ Referral Code & Link Card ══════════ */}
        <div className="bg-gradient-to-br from-primary via-[#0077c8] to-[#0091e6] rounded-2xl p-6 md:p-8 text-white mb-6 shadow-level-2 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5" />
              <h2 className="text-base font-bold opacity-90">Your Referral Code</h2>
            </div>

            <div className="flex flex-col md:flex-row md:items-end gap-6">
              {/* Referral Code */}
              <div className="flex-1">
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-4 inline-block mb-3">
                  <span className="text-3xl md:text-4xl font-black tracking-[0.15em] font-mono">
                    {referralCode}
                  </span>
                </div>
                <p className="text-sm text-white/70 mb-3 max-w-md">
                  Share this code with other dental clinics. When they sign up and subscribe, you both earn
                  <span className="text-white font-bold"> 1 month free</span>!
                </p>
                <div className="flex flex-wrap gap-2">
                  <CopyButton text={referralCode} label="Copy Code" />
                  {referralLink && <CopyButton text={referralLink} label="Copy Link" />}
                </div>
              </div>

              {/* Referral Link Preview */}
              {referralLink && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-2 max-w-full overflow-hidden">
                  <Link2 className="w-4 h-4 shrink-0 text-white/60" />
                  <span className="text-xs text-white/70 truncate font-mono">{referralLink}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════ Stats Row ══════════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          {[
            {
              label: "Total Referrals",
              value: stats?.totalReferrals ?? 0,
              icon: <Users className="w-5 h-5" />,
              color: "text-primary",
              bg: "bg-primary/10",
            },
            {
              label: "Successful",
              value: stats?.successfulReferrals ?? 0,
              icon: <CheckCircle2 className="w-5 h-5" />,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "Pending",
              value: stats?.pendingReferrals ?? 0,
              icon: <Clock className="w-5 h-5" />,
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              label: "Free Months Earned",
              value: stats?.freeMonthsEarned ?? 0,
              icon: <Award className="w-5 h-5" />,
              color: "text-purple-600",
              bg: "bg-purple-50",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-4 md:p-5 shadow-level-1 border border-outline-variant/10"
            >
              <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
                {stat.icon}
              </div>
              <p className="text-2xl md:text-3xl font-black text-on-surface">{stat.value}</p>
              <p className="text-[11px] text-on-surface-variant font-semibold mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ══════════ Reward Summary Card ══════════ */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-level-1 border border-outline-variant/10 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="text-base font-bold text-on-surface">Reward Summary</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl bg-surface-container-low">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/50 mb-1">
                Current Plan
              </p>
              <p className="text-sm font-extrabold text-on-surface">{subInfo?.planName || "Free"}</p>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/50 mb-1">
                Subscription Expiry
              </p>
              <p className="text-sm font-extrabold text-on-surface">
                {subInfo?.expiryDate ? formatDate(subInfo.expiryDate) : "N/A"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/50 mb-1">
                Free Months Earned
              </p>
              <p className="text-sm font-extrabold text-purple-600">{subInfo?.freeMonthsEarned || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/50 mb-1">
                Next Reward
              </p>
              <p className="text-sm font-extrabold text-emerald-600">+1 Month Free</p>
            </div>
          </div>
        </div>

        {/* ══════════ Referral History Table ══════════ */}
        <div className="bg-white rounded-2xl shadow-level-1 border border-outline-variant/10 overflow-hidden">
          <div className="px-5 md:px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between">
            <h3 className="text-base font-bold text-on-surface">Referral History</h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="md:hidden flex items-center gap-1.5 bg-primary text-on-primary px-3 py-2 rounded-lg text-xs font-bold cursor-pointer border-none"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>

          {referralsLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-on-surface-variant font-medium">Loading referrals…</p>
            </div>
          ) : referrals.length === 0 ? (
            /* Empty State */
            <div className="p-12 md:p-16 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-4">
                <Gift className="w-10 h-10 text-primary/30" />
              </div>
              <h4 className="text-lg font-bold text-on-surface mb-2">No Referrals Yet</h4>
              <p className="text-sm text-on-surface-variant max-w-sm mx-auto mb-5">
                Start sharing your referral code with other dental clinics. Both you and the referred clinic will earn
                1 free month when they subscribe!
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl text-sm font-bold shadow-level-1 hover:shadow-level-2 transition-all cursor-pointer border-none"
              >
                <Plus className="w-4 h-4" />
                Add Your First Referral
              </button>
            </div>
          ) : (
            /* Referral Table */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/10 bg-surface-container-lowest">
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/50">
                      Clinic Name
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/50 hidden md:table-cell">
                      Email
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/50">
                      Referred On
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/50 hidden md:table-cell">
                      Activated On
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/50">
                      Reward
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/50">
                      Status
                    </th>
                    <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/50">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((ref) => (
                    <tr
                      key={ref.id}
                      className="border-b border-outline-variant/5 hover:bg-surface-container-low/50 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-sm font-bold text-on-surface">{ref.referredClinicName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-xs text-on-surface-variant font-medium">{ref.referredClinicEmail}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-on-surface-variant font-medium">{formatDate(ref.referredAt)}</span>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-xs text-on-surface-variant font-medium">
                          {formatDate(ref.activatedAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                          +{ref.rewardMonths} Month
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={ref.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          {ref.status === "Pending" && (
                            <button
                              onClick={() =>
                                statusMutation.mutate({ id: ref.id, status: "Successful" })
                              }
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors cursor-pointer border-none bg-transparent"
                              title="Mark Successful"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {ref.status === "Successful" && (
                            <button
                              onClick={() =>
                                statusMutation.mutate({ id: ref.id, status: "Reward Applied" })
                              }
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-500 transition-colors cursor-pointer border-none bg-transparent"
                              title="Apply Reward"
                            >
                              <Award className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm("Delete this referral?")) {
                                deleteMutation.mutate(ref.id);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors cursor-pointer border-none bg-transparent"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ══════════ How It Works Section ══════════ */}
        <div className="mt-6 bg-white rounded-2xl p-5 md:p-6 shadow-level-1 border border-outline-variant/10">
          <h3 className="text-base font-bold text-on-surface mb-4">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: "1", title: "Share Your Code", desc: "Send your unique referral code or link to other dental clinics.", icon: <Link2 className="w-5 h-5" /> },
              { step: "2", title: "Clinic Registers", desc: "The new clinic enters your code during their registration.", icon: <Building2 className="w-5 h-5" /> },
              { step: "3", title: "They Subscribe", desc: "When they purchase a paid plan, the referral is confirmed.", icon: <CalendarCheck className="w-5 h-5" /> },
              { step: "4", title: "Both Earn Rewards", desc: "You both receive 1 extra month added to your subscription!", icon: <Gift className="w-5 h-5" /> },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center p-4 rounded-xl bg-surface-container-low">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                  {item.icon}
                </div>
                <div className="text-[10px] font-extrabold text-primary mb-1">STEP {item.step}</div>
                <h4 className="text-sm font-bold text-on-surface mb-1">{item.title}</h4>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ══════════ Add Referral Modal ══════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-level-2 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface">Add New Referral</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setFormData({ clinicName: "", email: "" });
                  setFormError("");
                }}
                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Enter the details of the clinic you are referring. They will receive your referral code, and once they subscribe, you both earn a free month.
              </p>

              {formError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  Clinic Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40" />
                  <input
                    type="text"
                    value={formData.clinicName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, clinicName: e.target.value }))}
                    placeholder="e.g., Smile Dental Clinic"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  Clinic Email <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g., info@smiledental.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormData({ clinicName: "", email: "" });
                    setFormError("");
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-outline-variant/30 text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-level-1 hover:shadow-level-2 transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addMutation.isPending ? "Adding…" : "Add Referral"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ Toast ══════════ */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] px-5 py-3 rounded-xl shadow-level-2 text-sm font-bold flex items-center gap-2 animate-[slideUp_0.3s_ease-out] ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default function ReferEarnPageWrapper() {
  return (
    <AdminAuthGuard>
      <ReferEarnPage />
    </AdminAuthGuard>
  );
}
