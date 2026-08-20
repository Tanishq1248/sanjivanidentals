"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "../../lib/hooks/useDebounce";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  CalendarDays,
  Users,
  Search,
  Phone,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  CheckCircle2,
  Activity,
  CreditCard,
  Clock,
  RefreshCw,
  ExternalLink,
  Plus,
  UserPlus,
  FileText,
  DollarSign,
  Share2,
  Armchair,
  Check,
  AlertTriangle,
  ArrowRight,
  Filter,
  Layers,
  Sparkles,
} from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { COLLECTIONS } from "../../lib/services/firestoreConfig";
import { AdminAuthGuard } from "../../components/auth/AdminAuthGuard";
import { useAuth } from "../../lib/context/AuthContext";
import {
  getAppointments,
  updateAppointmentStatus,
  deleteAppointment,
  getAppointmentsByDateRange,
} from "../../lib/services/appointmentService";
import { getInvoices } from "../../lib/services/invoiceService";
import {
  getPatientByPhone,
  getPatients,
  getFollowUpsDueThisWeek,
} from "../../lib/services/patientService";
import {
  getClinicResources,
  getClinicInfo,
} from "../../lib/services/settingsService";
import { PatientDetailsModal } from "../../components/admin/PatientDetailsModal";
import { NewPatientModal } from "../../components/admin/NewPatientModal";
import { CollectPaymentModal } from "../../components/admin/CollectPaymentModal";
import { NewAppointmentModal } from "../../components/calendar/NewAppointmentModal";
import { queryKeys } from "../../lib/query/queryKeys";
import {
  TableSkeleton,
  CardListSkeleton,
  StatsCardSkeleton,
  useDelayLoading,
} from "../../components/ui/Skeletons";
import type {
  Patient,
  Appointment,
  AppointmentStatus,
  PatientEncounter,
  Invoice,
  ClinicResourcesData,
  ClinicBasicInfo,
} from "../../lib/types";
import { useSidebarStore } from "../../lib/store/useSidebarStore";
import { usePatientStore } from "../../lib/store/usePatientStore";
import { useDashboardStore } from "../../lib/store/useDashboardStore";
import { Sidebar } from "../../components/admin/Sidebar";

/* ─── Helpers ─── */
function formatINR(amount: any): string {
  const val = Number(amount || 0);
  const hasPaise = val % 1 !== 0;
  return val.toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-indigo-600",
  "bg-purple-600",
  "bg-emerald-600",
  "bg-teal-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-sky-600",
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* ─── Follow-up Urgency Helper ─── */
type FollowUpUrgency = "overdue" | "today" | "tomorrow" | "upcoming";

function getFollowUpUrgency(followUpDate: string): {
  label: string;
  urgency: FollowUpUrgency;
  daysAway: number;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = followUpDate.split("-").map(Number);
  const fDate = new Date(y, m - 1, d);
  fDate.setHours(0, 0, 0, 0);
  const diffMs = fDate.getTime() - today.getTime();
  const daysAway = Math.round(diffMs / 86_400_000);

  if (daysAway < 0)
    return {
      label: `Overdue by ${Math.abs(daysAway)}d`,
      urgency: "overdue",
      daysAway,
    };
  if (daysAway === 0) return { label: "Due Today", urgency: "today", daysAway };
  if (daysAway === 1) return { label: "Tomorrow", urgency: "tomorrow", daysAway };
  return { label: `In ${daysAway} days`, urgency: "upcoming", daysAway };
}

const URGENCY_BADGES: Record<FollowUpUrgency, string> = {
  overdue: "bg-rose-50 text-rose-700 border-rose-200 font-bold",
  today: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
  tomorrow: "bg-amber-50 text-amber-700 border-amber-200 font-semibold",
  upcoming: "bg-blue-50 text-blue-700 border-blue-200 font-medium",
};

/* ─── Main Admin Dashboard ─── */
function AdminDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Zustand Store UI states
  const { sidebarOpen, setSidebarOpen } = useSidebarStore();
  const { selectedPatient, isModalOpen, openPatientDetails, closePatientDetails } =
    usePatientStore();
  const { toast, showToast } = useDashboardStore();

  // Selected Date Filter for Queue (defaults to today)
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [chairFilter, setChairFilter] = useState<string>("ALL");
  const [queueSearch, setQueueSearch] = useState<string>("");
  const debouncedQueueSearch = useDebounce(queueSearch, 300);

  // Quick Action Modal States
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [isNewApptOpen, setIsNewApptOpen] = useState(false);
  const [isCollectPaymentOpen, setIsCollectPaymentOpen] = useState(false);

  // ── 1. Fetch Clinic Settings & Resources ────────────────────────────────
  const { data: clinicResources } = useQuery<ClinicResourcesData>({
    queryKey: queryKeys.settings.clinicResources,
    queryFn: getClinicResources,
    staleTime: 5 * 60 * 1000,
  });

  const { data: clinicInfo } = useQuery<ClinicBasicInfo>({
    queryKey: queryKeys.settings.clinicInfo,
    queryFn: getClinicInfo,
    staleTime: 10 * 60 * 1000,
  });

  // ── 2. Fetch Patients ──────────────────────────────────────────────────
  const { data: patients = [], isLoading: isPatientsLoading } = useQuery<Patient[]>({
    queryKey: queryKeys.patients.all,
    queryFn: getPatients,
    staleTime: 2 * 60 * 1000,
  });

  // Patient Map for fast O(1) lookups
  const patientMap = useMemo(() => {
    const map = new Map<string, Patient>();
    patients.forEach((p) => {
      map.set(p.id, p);
      if (p.phone) map.set(p.phone.replace(/\D/g, ""), p);
    });
    return map;
  }, [patients]);

  // ── 3. Fetch Appointments for Selected Date & Today ────────────────────
  const { data: dayAppointments = [], isLoading: isApptsLoading } = useQuery<Appointment[]>({
    queryKey: ["appointments", "date", selectedDate],
    queryFn: () => getAppointmentsByDateRange(selectedDate, selectedDate),
    staleTime: 20 * 1000,
  });

  // Today's appointments (for top KPI counts regardless of selected date)
  const { data: todayAppointments = [] } = useQuery<Appointment[]>({
    queryKey: ["appointments", "today"],
    queryFn: () => getAppointments("today"),
    staleTime: 20 * 1000,
  });

  // ── 4. Fetch Invoices for Revenue & Dues ────────────────────────────────
  const { data: invoices = [], isLoading: isInvoicesLoading } = useQuery<Invoice[]>({
    queryKey: queryKeys.invoices.all,
    queryFn: getInvoices,
    staleTime: 30 * 1000,
  });

  // ── 5. Fetch Follow-Ups Due ───────────────────────────────────────────
  const { data: followUpEncounters = [] } = useQuery<PatientEncounter[]>({
    queryKey: queryKeys.encounters.followUpsDue,
    queryFn: getFollowUpsDueThisWeek,
    staleTime: 2 * 60 * 1000,
  });

  // ── Appointment Status Mutation ─────────────────────────────────────────
  const statusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: AppointmentStatus | "__delete__";
    }) => {
      if (status === "__delete__") {
        await deleteAppointment(id);
      } else {
        await updateAppointmentStatus(id, status);
      }
      return { id, status };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.appointmentCounts() });
    },
    onSuccess: (data) => {
      showToast(
        data.status === "__delete__"
          ? "Appointment deleted."
          : `Status updated to ${data.status}`
      );
    },
    onError: () => {
      showToast("Failed to update status.");
    },
  });

  // ── KPI Metrics Calculations ────────────────────────────────────────────
  // 1. Today's Appointments Counts
  const todayCounts = useMemo(() => {
    const total = todayAppointments.length;
    const checkedIn = todayAppointments.filter((a) => a.status === "Checked In").length;
    const inChair = todayAppointments.filter((a) => a.status === "In Progress").length;
    const completed = todayAppointments.filter((a) => a.status === "Completed").length;
    const pending = todayAppointments.filter(
      (a) => a.status === "Pending" || a.status === "Confirmed"
    ).length;
    return { total, checkedIn, inChair, completed, pending };
  }, [todayAppointments]);

  // 2. Chair Occupancy Status
  const chairOccupancy = useMemo(() => {
    const activeChairsList = (clinicResources?.chairs || [
      { id: "chair-1", name: "Chair 1", active: true },
    ]).filter((c) => c.active);

    const totalActive = activeChairsList.length || 1;

    // Determine occupied chairs from today's active appointments ("In Progress" or "Checked In")
    const occupiedChairsMap = new Map<string, Appointment>();
    todayAppointments.forEach((apt) => {
      if (apt.status === "In Progress" || apt.status === "Checked In") {
        const chairName = apt.chair || "Chair 1";
        if (!occupiedChairsMap.has(chairName)) {
          occupiedChairsMap.set(chairName, apt);
        }
      }
    });

    const occupiedCount = occupiedChairsMap.size;

    const chairBadges = activeChairsList.map((chair) => {
      const activeApt = occupiedChairsMap.get(chair.name);
      const isOccupied = !!activeApt;
      return {
        id: chair.id,
        name: chair.name,
        isOccupied,
        status: isOccupied
          ? `${activeApt.status === "In Progress" ? "In Chair" : "Checked In"}: ${activeApt.patientName}`
          : "Available",
        doctor: activeApt?.doctorName,
        patientName: activeApt?.patientName,
      };
    });

    return {
      occupiedCount,
      totalActive,
      chairBadges,
    };
  }, [clinicResources, todayAppointments]);

  // 3. Daily Revenue & Outstanding Dues
  const revenueMetrics = useMemo(() => {
    let todayCollected = 0;
    let monthCollected = 0;
    let totalOutstandingDues = 0;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    invoices.forEach((inv) => {
      const total = inv.total ?? inv.netAmount ?? inv.amount ?? 0;
      const paid = inv.paidAmount || 0;
      const balance = Math.max(0, total - paid);

      if (balance > 0 && inv.paymentStatus !== "Paid") {
        totalOutstandingDues += balance;
      }

      // Check payment history for collections
      if (inv.paymentHistory && Array.isArray(inv.paymentHistory)) {
        inv.paymentHistory.forEach((ph) => {
          if (ph.paymentDate) {
            const pDate = new Date(ph.paymentDate);
            if (ph.paymentDate.startsWith(todayStr)) {
              todayCollected += ph.amountReceived || 0;
            }
            if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
              monthCollected += ph.amountReceived || 0;
            }
          }
        });
      } else if (inv.paidAmount && inv.paidAmount > 0) {
        if (inv.invoiceDate?.startsWith(todayStr) || inv.visitDate?.startsWith(todayStr)) {
          todayCollected += inv.paidAmount;
        }
        monthCollected += inv.paidAmount;
      }
    });

    return {
      todayCollected,
      monthCollected,
      totalOutstandingDues,
    };
  }, [invoices, todayStr]);

  // ── Filtered Timeline Queue ─────────────────────────────────────────────
  const filteredQueue = useMemo(() => {
    let list = [...dayAppointments];

    // Status filter
    if (statusFilter !== "ALL") {
      if (statusFilter === "ARRIVED") {
        list = list.filter((a) => a.status === "Checked In");
      } else if (statusFilter === "IN_CHAIR") {
        list = list.filter((a) => a.status === "In Progress");
      } else if (statusFilter === "COMPLETED") {
        list = list.filter((a) => a.status === "Completed");
      } else if (statusFilter === "PENDING") {
        list = list.filter((a) => a.status === "Pending" || a.status === "Confirmed");
      }
    }

    // Chair filter
    if (chairFilter !== "ALL") {
      list = list.filter((a) => (a.chair || "Chair 1") === chairFilter);
    }

    // Search query
    const q = debouncedQueueSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((a) => {
        return (
          a.patientName?.toLowerCase().includes(q) ||
          a.patientPhone?.includes(q) ||
          a.service?.toLowerCase().includes(q) ||
          a.doctorName?.toLowerCase().includes(q)
        );
      });
    }

    // Sort by time
    return list.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [dayAppointments, statusFilter, chairFilter, debouncedQueueSearch]);

  // ── Actionable Follow-ups List ──────────────────────────────────────────
  const actionableFollowUps = useMemo(() => {
    return followUpEncounters
      .filter((e) => e.followUpDate && e.followUpDate.length === 10)
      .map((e) => {
        const p = patientMap.get(e.patientId);
        const urgencyInfo = getFollowUpUrgency(e.followUpDate!);
        const lastTreatment =
          e.treatments?.at(-1) || e.toothTreatments?.at(-1)?.treatmentName || "Dental Treatment";
        return {
          encounter: e,
          patient: p,
          urgencyInfo,
          lastTreatment,
        };
      })
      .sort((a, b) => a.encounter.followUpDate!.localeCompare(b.encounter.followUpDate!))
      .slice(0, 8);
  }, [followUpEncounters, patientMap]);

  // ── Outstanding Dues List ───────────────────────────────────────────────
  const actionableDues = useMemo(() => {
    return invoices
      .filter((inv) => {
        const total = inv.total ?? inv.netAmount ?? inv.amount ?? 0;
        const paid = inv.paidAmount || 0;
        return total - paid > 0 && inv.paymentStatus !== "Paid";
      })
      .map((inv) => {
        const total = inv.total ?? inv.netAmount ?? inv.amount ?? 0;
        const paid = inv.paidAmount || 0;
        const balance = total - paid;
        return {
          invoice: inv,
          balance,
          total,
        };
      })
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 6);
  }, [invoices]);

  // ── 1-Click WhatsApp Handlers ──
  const handleSendWhatsAppRecall = (patientName: string, phone: string, procedure: string, date: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const msg = `Hello *${patientName}*! 👋\nThis is *${clinicInfo?.clinicName || "Sanjivani Dental Clinic"}*.\n\nYour clinical follow-up visit for *${procedure}* is scheduled for *${date}*.\n\nPlease reply to this message to confirm or choose a convenient time slot.\n\nLooking forward to seeing you! 😊`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleSendWhatsAppPaymentReminder = (patientName: string, phone: string, invoiceNum: string, balance: number) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const msg = `Hello *${patientName}*! 👋\nGreetings from *${clinicInfo?.clinicName || "Sanjivani Dental Clinic"}*.\n\nThis is a friendly reminder regarding pending invoice *#${invoiceNum}* with an outstanding balance of *₹${formatINR(balance)}*.\n\nYou can settle this via UPI, NetBanking, or at the clinic front desk.\n\nThank you! ✨`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleDateShift = (days: number) => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    setSelectedDate(dateObj.toISOString().split("T")[0]);
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc] font-sans">
      {/* ── Mobile Sidebar Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Desktop Sidebar ── */}
      <div className="hidden md:flex shrink-0 sticky top-0 h-screen shadow-2xs z-30">
        <Sidebar currentPage="dashboard" />
      </div>

      {/* ── Mobile Sidebar Drawer ── */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[220px] shadow-2xl transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar currentPage="dashboard" onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ═══ MAIN COMMAND CENTER AREA ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Operational Header */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-700 shrink-0 cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-black text-slate-900 leading-tight">
                  Daily Operations Center
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5 hidden sm:block">
                {clinicInfo?.clinicName || "Sanjivani Dental Clinic"} • Command & Patient Flow Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsWalkInOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Walk-in Case Paper</span>
            </button>

            <button
              onClick={() => setIsNewApptOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book Appointment</span>
            </button>
          </div>
        </header>

        {/* ─── PAGE CONTENT CONTAINER ─── */}
        <main className="flex-1 p-4 md:p-6 space-y-6">
          
          {/* ═══════════ TOP COMMAND BAR (4 UNIFORM KPI METRIC CARDS) ═══════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            
            {/* 1. TODAY'S APPOINTMENTS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Today's Appointments
                  </span>
                  <span className="text-3xl font-black text-slate-900 tracking-tight mt-1 block">
                    {todayCounts.total}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1 pt-4 mt-2 border-t border-slate-100 text-center">
                <div className="bg-teal-50/70 p-1.5 rounded-lg">
                  <span className="block text-[10px] font-bold text-teal-800">Arrived</span>
                  <span className="text-xs font-black text-teal-700">{todayCounts.checkedIn}</span>
                </div>
                <div className="bg-purple-50/70 p-1.5 rounded-lg">
                  <span className="block text-[10px] font-bold text-purple-800">In Chair</span>
                  <span className="text-xs font-black text-purple-700">{todayCounts.inChair}</span>
                </div>
                <div className="bg-emerald-50/70 p-1.5 rounded-lg">
                  <span className="block text-[10px] font-bold text-emerald-800">Done</span>
                  <span className="text-xs font-black text-emerald-700">{todayCounts.completed}</span>
                </div>
                <div className="bg-amber-50/70 p-1.5 rounded-lg">
                  <span className="block text-[10px] font-bold text-amber-800">Pending</span>
                  <span className="text-xs font-black text-amber-700">{todayCounts.pending}</span>
                </div>
              </div>
            </div>

            {/* 2. CHAIR OCCUPANCY STATUS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Chair Occupancy
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      {chairOccupancy.occupiedCount}
                    </span>
                    <span className="text-sm font-bold text-slate-400">
                      / {chairOccupancy.totalActive} Active
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Armchair className="w-5 h-5" />
                </div>
              </div>

              {/* Dynamic Chair Badges */}
              <div className="pt-3 mt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                {chairOccupancy.chairBadges.map((chair) => (
                  <button
                    key={chair.id}
                    type="button"
                    onClick={() => {
                      setChairFilter(chairFilter === chair.name ? "ALL" : chair.name);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      chair.isOccupied
                        ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    } ${chairFilter === chair.name ? "ring-2 ring-indigo-500" : ""}`}
                    title={chair.status}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        chair.isOccupied ? "bg-purple-600 animate-ping" : "bg-emerald-500"
                      }`}
                    />
                    <span>{chair.name}: {chair.isOccupied ? "Occupied" : "Free"}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. DAILY COLLECTIONS & DUES */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Today's Collections
                  </span>
                  <span className="text-3xl font-black text-emerald-600 tracking-tight mt-1 block">
                    ₹{formatINR(revenueMetrics.todayCollected)}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>

              <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500">
                  Month: <strong className="text-slate-900 font-mono">₹{formatINR(revenueMetrics.monthCollected)}</strong>
                </span>
                <Link
                  href="/admin/billing"
                  className="text-rose-600 hover:underline flex items-center gap-1 font-mono text-[11px] font-bold"
                  title="View Outstanding Invoices"
                >
                  ₹{formatINR(revenueMetrics.totalOutstandingDues)} Dues →
                </Link>
              </div>
            </div>

            {/* 4. QUICK ACTIONS HUB */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-5 rounded-2xl text-white shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Quick Actions Hub
                </span>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Instant clinical & desk shortcuts
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setIsNewPatientOpen(true)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-[11px] font-bold text-white transition-all cursor-pointer flex items-center gap-1.5 border border-white/10"
                >
                  <UserPlus className="w-3.5 h-3.5 text-indigo-300" />
                  <span>+ Patient</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsNewApptOpen(true)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-[11px] font-bold text-white transition-all cursor-pointer flex items-center gap-1.5 border border-white/10"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-indigo-300" />
                  <span>+ Book</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsWalkInOpen(true)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-[11px] font-bold text-white transition-all cursor-pointer flex items-center gap-1.5 border border-white/10"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-300" />
                  <span>+ Case Paper</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCollectPaymentOpen(true)}
                  className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-xl text-[11px] font-bold text-emerald-300 transition-all cursor-pointer flex items-center gap-1.5 border border-emerald-400/20"
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+ Pay</span>
                </button>
              </div>
            </div>

          </div>

          {/* ═══════════ MAIN OPERATIONAL GRID (65% / 35% SPLIT) ═══════════ */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* ─── LEFT COLUMN (65%): TODAY'S LIVE CLINIC QUEUE & CHAIR SCHEDULE ─── */}
            <div className="xl:col-span-8 space-y-4">
              
              {/* Queue Controls Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                
                {/* Top Row: Date navigation & Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Date Switcher */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDateShift(-1)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                      title="Previous Day"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDate(todayStr)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        selectedDate === todayStr
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Today
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDateShift(1)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                      title="Next Day"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Native Date Picker */}
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Search within queue */}
                  <div className="relative flex-1 max-w-xs">
                    <input
                      type="text"
                      value={queueSearch}
                      onChange={(e) => setQueueSearch(e.target.value)}
                      placeholder="Search queue by patient, phone..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                {/* Bottom Row: Status Filter Chips & Chair Filters */}
                <div className="flex items-center justify-between gap-2 overflow-x-auto pt-2 border-t border-slate-100 flex-wrap">
                  
                  {/* Status Filters */}
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {[
                      { key: "ALL", label: "All Visits", count: dayAppointments.length },
                      {
                        key: "ARRIVED",
                        label: "Arrived",
                        count: dayAppointments.filter((a) => a.status === "Checked In").length,
                      },
                      {
                        key: "IN_CHAIR",
                        label: "In Chair",
                        count: dayAppointments.filter((a) => a.status === "In Progress").length,
                      },
                      {
                        key: "COMPLETED",
                        label: "Completed",
                        count: dayAppointments.filter((a) => a.status === "Completed").length,
                      },
                      {
                        key: "PENDING",
                        label: "Pending",
                        count: dayAppointments.filter(
                          (a) => a.status === "Pending" || a.status === "Confirmed"
                        ).length,
                      },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setStatusFilter(item.key)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          statusFilter === item.key
                            ? "bg-slate-900 text-white shadow-2xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {item.label} ({item.count})
                      </button>
                    ))}
                  </div>

                  {/* Chair Filter Dropdown */}
                  {clinicResources?.chairs && clinicResources.chairs.length > 1 && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-slate-400 text-[11px] font-bold">Chair:</span>
                      <select
                        value={chairFilter}
                        onChange={(e) => setChairFilter(e.target.value)}
                        className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="ALL">All Chairs</option>
                        {clinicResources.chairs
                          .filter((c) => c.active)
                          .map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* ─── LIVE PATIENT QUEUE TIMELINE ─── */}
              <div className="space-y-3">
                {isApptsLoading ? (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-2xs text-center space-y-2">
                    <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">Loading clinic schedule...</p>
                  </div>
                ) : filteredQueue.length === 0 ? (
                  <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-2xs text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
                      <CalendarDays className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">No appointments in this view</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {queueSearch
                          ? "No appointments match your search criteria."
                          : `No appointments scheduled for ${selectedDate}.`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsNewApptOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-4 h-4" /> Book Appointment
                    </button>
                  </div>
                ) : (
                  filteredQueue.map((apt) => {
                    const patientObj =
                      patientMap.get(apt.patientId || "") ||
                      patientMap.get((apt.patientPhone || "").replace(/\D/g, ""));

                    const targetPatientId = patientObj?.id || apt.patientId;

                    return (
                      <div
                        key={apt.id}
                        className={`bg-white p-4 rounded-2xl border transition-all shadow-2xs hover:shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          apt.status === "In Progress"
                            ? "border-purple-300 ring-2 ring-purple-100 bg-purple-50/20"
                            : apt.status === "Checked In"
                            ? "border-teal-300 bg-teal-50/20"
                            : apt.status === "Completed"
                            ? "border-emerald-200 bg-emerald-50/10 opacity-80"
                            : "border-slate-200"
                        }`}
                      >
                        {/* Left: Patient Info, Time & Chair */}
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Avatar Badge */}
                          <div
                            className={`w-10 h-10 rounded-xl ${avatarColor(
                              apt.patientName
                            )} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs`}
                          >
                            {getInitials(apt.patientName)}
                          </div>

                          <div className="min-w-0">
                            {/* Time & Badges */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-extrabold font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                                🕒 {apt.time}
                              </span>
                              {apt.duration && (
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                  {apt.duration}m
                                </span>
                              )}
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                💺 {apt.chair || "Chair 1"}
                              </span>
                              {apt.doctorName && (
                                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                  👨‍⚕️ {apt.doctorName}
                                </span>
                              )}
                            </div>

                            {/* Patient Name & Phone */}
                            <div className="flex items-baseline gap-2 mt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (patientObj) openPatientDetails(patientObj);
                                  else if (targetPatientId) router.push(`/admin/patients/${targetPatientId}`);
                                }}
                                className="font-bold text-slate-900 text-sm hover:text-indigo-600 hover:underline transition-colors text-left truncate cursor-pointer"
                              >
                                {apt.patientName}
                              </button>
                              <span className="text-[11px] font-mono text-slate-400">
                                {apt.patientPhone}
                              </span>
                            </div>

                            {/* Service / Procedure Tag */}
                            <p className="text-xs font-semibold text-indigo-700 mt-0.5 truncate">
                              • {apt.service || "Consultation & Exam"}
                            </p>
                          </div>
                        </div>

                        {/* Right: Instant Status Switcher & Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                          
                          {/* Live Status Selector Pills */}
                          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-[11px] font-bold">
                            <button
                              type="button"
                              onClick={() => statusMutation.mutate({ id: apt.id, status: "Checked In" })}
                              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                apt.status === "Checked In"
                                  ? "bg-teal-600 text-white shadow-2xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                              title="Mark Patient as Arrived in Waiting Room"
                            >
                              Arrived
                            </button>

                            <button
                              type="button"
                              onClick={() => statusMutation.mutate({ id: apt.id, status: "In Progress" })}
                              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                apt.status === "In Progress"
                                  ? "bg-purple-600 text-white shadow-2xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                              title="Mark as Currently in Treatment Chair"
                            >
                              In Chair
                            </button>

                            <button
                              type="button"
                              onClick={() => statusMutation.mutate({ id: apt.id, status: "Completed" })}
                              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                apt.status === "Completed"
                                  ? "bg-emerald-600 text-white shadow-2xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                              title="Mark Visit as Completed"
                            >
                              Done
                            </button>
                          </div>

                          {/* Quick Clinical & Front-Desk Actions */}
                          <div className="flex items-center gap-1.5">
                            {/* Open Case Paper */}
                            {targetPatientId && (
                              <Link
                                href={`/admin/patients/${targetPatientId}?tab=case-paper`}
                                className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white text-xs font-bold transition-all flex items-center gap-1 border border-indigo-200"
                                title="Open Active Case Paper & Dental Chart"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Case Paper</span>
                              </Link>
                            )}

                            {/* 1-Click WhatsApp greeting */}
                            {apt.patientPhone && (
                              <button
                                type="button"
                                onClick={() => {
                                  const cleanPhone = apt.patientPhone.replace(/\D/g, "");
                                  const msg = `Hello *${apt.patientName}*! 👋\nThis is *${clinicInfo?.clinicName || "Sanjivani Dental Clinic"}* regarding your visit today at *${apt.time}* with *${apt.doctorName || "Dr. Rajesh"}*.\n\nPlease let us know if you need directions or require assistance! 😊`;
                                  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
                                }}
                                className="p-2 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white transition-colors border border-emerald-200 cursor-pointer"
                                title="Send WhatsApp Visit Message"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Bill / Invoice */}
                            <Link
                              href="/admin/billing"
                              className="p-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
                              title="Open Billing / Invoices"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

            {/* ─── RIGHT COLUMN (35%): RECALLS & COLLECTIONS ─── */}
            <div className="xl:col-span-4 space-y-6">
              
              {/* 1. ACTIVE WHATSAPP RECALL & FOLLOW-UP ENGINE */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      WhatsApp Recall & Follow-ups
                    </h2>
                  </div>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    {actionableFollowUps.length} Due
                  </span>
                </div>

                {actionableFollowUps.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">All follow-ups clear</p>
                    <p className="text-[11px] text-slate-400">
                      No patients are due for follow-up contact this week.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                    {actionableFollowUps.map(({ encounter, patient, urgencyInfo, lastTreatment }) => {
                      const displayName = patient?.name || `Patient #${encounter.patientId.slice(0, 6)}`;
                      const phone = patient?.phone || "";
                      const badgeClass = URGENCY_BADGES[urgencyInfo.urgency] || "bg-slate-100 text-slate-700";

                      return (
                        <div key={encounter.id} className="p-3.5 hover:bg-slate-50 transition-colors space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {displayName}
                              </p>
                              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                {lastTreatment}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                Follow-up: {encounter.followUpDate}
                              </p>
                            </div>

                            <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${badgeClass}`}>
                              {urgencyInfo.label}
                            </span>
                          </div>

                          {/* 1-Click WhatsApp Recall Action */}
                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (patient) openPatientDetails(patient);
                                else router.push(`/admin/patients/${encounter.patientId}`);
                              }}
                              className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                            >
                              View Chart →
                            </button>

                            {phone && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSendWhatsAppRecall(
                                    displayName,
                                    phone,
                                    lastTreatment,
                                    encounter.followUpDate || "soon"
                                  )
                                }
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-emerald-200 cursor-pointer flex items-center gap-1"
                              >
                                <Share2 className="w-3 h-3" />
                                <span>WhatsApp Recall</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. OUTSTANDING DUES ACTION LIST */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-rose-500" />
                    <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      Outstanding Dues Action List
                    </h2>
                  </div>
                  <Link
                    href="/admin/billing"
                    className="text-[11px] font-bold text-indigo-600 hover:underline"
                  >
                    View All →
                  </Link>
                </div>

                {actionableDues.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">Zero Outstanding Dues</p>
                    <p className="text-[11px] text-slate-400">
                      All clinic patient accounts are 100% settled.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                    {actionableDues.map(({ invoice, balance, total }) => {
                      const patientObj = patientMap.get(invoice.patientId);
                      const pName = invoice.patientName || patientObj?.name || "Patient";
                      const pPhone = patientObj?.phone || "";

                      return (
                        <div key={invoice.id} className="p-3.5 hover:bg-slate-50 transition-colors space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {pName}
                              </p>
                              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                                #{invoice.id.slice(0, 8)} {pPhone ? `• ${pPhone}` : ""}
                              </p>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-xs font-extrabold text-rose-600 font-mono block">
                                ₹{formatINR(balance)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                Total: ₹{formatINR(total)}
                              </span>
                            </div>
                          </div>

                          {/* WhatsApp Payment Reminder + Collect Button */}
                          <div className="flex items-center justify-between pt-1">
                            {pPhone ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSendWhatsAppPaymentReminder(
                                    pName,
                                    pPhone,
                                    invoice.id.slice(0, 8),
                                    balance
                                  )
                                }
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-emerald-200 cursor-pointer flex items-center gap-1"
                              >
                                <Share2 className="w-3 h-3" />
                                <span>Remind WhatsApp</span>
                              </button>
                            ) : (
                              <span />
                            )}

                            <button
                              type="button"
                              onClick={() => setIsCollectPaymentOpen(true)}
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-indigo-200 cursor-pointer"
                            >
                              Collect ₹ →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>

        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 px-4 md:px-8 py-3.5 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 {clinicInfo?.clinicName || "Sanjivani Dental Clinic"}. Operational Command Center.</p>
          <div className="flex items-center gap-4 font-medium">
            <Link href="/admin/calendar" className="hover:text-indigo-600">Calendar Planner</Link>
            <Link href="/admin/billing" className="hover:text-indigo-600">Billing & Ledger</Link>
            <Link href="/admin/settings" className="hover:text-indigo-600">Resource Settings</Link>
          </div>
        </footer>

      </div>

      {/* ═══ MODALS ═══ */}
      {/* 1. Patient Details Profile Modal */}
      <PatientDetailsModal
        patient={selectedPatient}
        isOpen={isModalOpen}
        onClose={closePatientDetails}
      />

      {/* 2. New Patient Registration Modal */}
      <NewPatientModal
        isOpen={isNewPatientOpen}
        onClose={() => setIsNewPatientOpen(false)}
        isWalkIn={false}
        onSuccess={() => showToast("New patient registered successfully!")}
      />

      {/* 3. Walk-in Registration & Case Paper Modal */}
      <NewPatientModal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        isWalkIn={true}
        onSuccess={() => showToast("Walk-in registered! Directing to Case Paper...")}
      />

      {/* 4. Book New Appointment Modal with Chair Assignment */}
      <NewAppointmentModal
        isOpen={isNewApptOpen}
        defaultDate={selectedDate}
        defaultTime="10:00 AM"
        onClose={() => setIsNewApptOpen(false)}
        onSuccess={() => {
          setIsNewApptOpen(false);
          queryClient.invalidateQueries({ queryKey: ["appointments"] });
          showToast("Appointment booked successfully!");
        }}
      />

      {/* 5. Collect Payment Modal */}
      <CollectPaymentModal
        isOpen={isCollectPaymentOpen}
        onClose={() => setIsCollectPaymentOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
          showToast("Payment collected successfully!");
        }}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-4 md:right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {toast}
        </div>
      )}
    </div>
  );
}

/* ─── Export wrapped with AuthGuard ─── */
export default function AdminPage() {
  return (
    <AdminAuthGuard>
      <AdminDashboard />
    </AdminAuthGuard>
  );
}
