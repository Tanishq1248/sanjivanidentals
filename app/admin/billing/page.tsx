"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "../../../lib/hooks/useDebounce";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  CalendarDays,
  Users,
  Search,
  MoreVertical,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  CheckCircle2,
  Activity,
  CreditCard,
  IndianRupee,
  Printer,
  ArrowRight,
  Filter,
} from "lucide-react";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { COLLECTIONS } from "../../../lib/services/firestoreConfig";
import { AdminAuthGuard } from "../../../components/auth/AdminAuthGuard";
import { useAuth } from "../../../lib/context/AuthContext";
import { getPatientByPhone, getPatients } from "../../../lib/services/patientService";
import { getInvoices } from "../../../lib/services/invoiceService";
import { PatientDetailsModal } from "../../../components/admin/PatientDetailsModal";
import { queryKeys } from "../../../lib/query/queryKeys";
import { TableSkeleton, CardListSkeleton, StatsCardSkeleton, useDelayLoading } from "../../../components/ui/Skeletons";
import type {
  Patient,
  Invoice,
} from "../../../lib/types";
import { useSidebarStore } from "../../../lib/store/useSidebarStore";
import { usePatientStore } from "../../../lib/store/usePatientStore";
import { useDashboardStore } from "../../../lib/store/useDashboardStore";

/* ─── Status Styles ─── */
const statusStyles: Record<string, string> = {
  Confirmed: "bg-blue-50 text-blue-700 border border-blue-200",
  Pending: "bg-amber-50 text-amber-700 border border-amber-200",
  "In Progress": "bg-amber-50 text-amber-700 border border-amber-200",
  Completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Partial: "bg-amber-50 text-amber-700 border border-amber-200",
  Cancelled: "bg-red-50 text-red-600 border border-red-200",
  Failed: "bg-red-50 text-red-600 border border-red-200",
};

const invoiceStatusOptions = ["Paid", "Pending", "Partial"];

function formatINR(amount: any): string {
  const val = Number(amount || 0);
  const hasPaise = val % 1 !== 0;
  return val.toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

/* ─── Helper to get initials ─── */
function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ─── Avatar color from name hash ─── */
const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-indigo-500",
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* ─── Sidebar component ─── */
function Sidebar({
  currentPage,
  onClose,
  onLogout,
  pendingBillingCount = 0,
}: {
  currentPage: "appointments" | "patients" | "billing";
  onClose?: () => void;
  onLogout: () => void;
  pendingBillingCount?: number;
}) {
  return (
    <aside className="w-full h-full bg-white flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-outline-variant/20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" onClick={onClose}>
          <Stethoscope className="w-6 h-6 text-primary" />
          <div>
            <p className="font-bold text-base text-primary leading-tight">
              DentaPure
            </p>
            <p className="text-[10px] text-on-surface-variant font-medium leading-tight">
              Clinical Excellence
            </p>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 px-3 py-6 flex-grow">
        <Link
          href="/admin"
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentPage === "appointments"
              ? "bg-secondary-container text-primary"
              : "text-secondary hover:bg-surface-container-low hover:text-on-surface"
            }`}
        >
          <CalendarDays className="w-4 h-4 shrink-0" />
          Dashboard
        </Link>
        <Link
          href="/admin/patients"
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentPage === "patients"
              ? "bg-secondary-container text-primary"
              : "text-secondary hover:bg-surface-container-low hover:text-on-surface"
            }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          Patients
        </Link>
        <Link
          href="/admin/billing"
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentPage === "billing"
              ? "bg-secondary-container text-primary"
              : "text-secondary hover:bg-surface-container-low hover:text-on-surface"
            }`}
        >
          <CreditCard className="w-4 h-4 shrink-0" />
          <span className="flex-1">Billing</span>
          {pendingBillingCount > 0 && (
            <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold leading-none flex items-center justify-center">
              {pendingBillingCount > 99 ? "99+" : pendingBillingCount}
            </span>
          )}
        </Link>
      </nav>

      {/* Logout */}
      <div className="px-3 py-5 border-t border-outline-variant/20">
        <button
          onClick={onLogout}
          className="w-full bg-red-50 text-red-600 text-sm font-semibold py-2.5 px-4 rounded-lg hover:bg-red-100 transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}

/* ─── WhatsApp SVG Icon ─── */
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45l.007-.001c5.441 0 9.859-4.417 9.863-9.864.002-2.637-1.023-5.118-2.887-6.98-1.864-1.865-4.343-2.891-6.974-2.892-5.445 0-9.866 4.418-9.87 9.866-.001 1.902.485 3.511 1.453 5.122l-.953 3.478 3.567-.935zM17.48 14.86c-.08-.13-.294-.21-.62-.37-.326-.16-1.925-.95-2.222-1.06-.297-.11-.513-.16-.73.16-.216.32-.838 1.06-1.028 1.28-.19.22-.38.24-.706.08-.326-.16-1.378-.508-2.625-1.62-1.018-.91-1.705-2.03-1.905-2.38-.2-.35-.02-.54.143-.7.147-.14.326-.38.489-.57.16-.19.216-.32.326-.54.11-.22.05-.41-.025-.57-.075-.16-.62-1.5-.85-2.05-.224-.54-.45-.47-.62-.48-.16-.01-.346-.01-.532-.01-.187 0-.49.07-.747.35-.257.28-.983.96-.983 2.34 0 1.38 1.002 2.71 1.143 2.9.14.19 1.972 3.01 4.777 4.22.667.29 1.188.46 1.594.59.67.21 1.28.18 1.76.11.536-.08 1.646-.67 1.877-1.32.23-.65.23-1.2.16-1.32z" />
  </svg>
);

function buildInvoiceWhatsAppUrl(phone: string, name: string, inv: any) {
  const digits = phone.replace(/\D/g, "");
  const amountDue = inv.total || inv.amount || 0;
  const invIdShort = inv.id.slice(0, 8).toUpperCase();
  const invStatus = inv.status || inv.paymentStatus || "Pending";
  const dateStr = inv.invoiceDate;
  
  const message = encodeURIComponent(
    `Hello ${name}! 👋 This is Sanjivani Dental Clinic. A friendly reminder regarding your invoice #${invIdShort} of amount ₹${formatINR(amountDue)} dated ${dateStr}.\n\n` +
    `Status: *${invStatus}*\n\n` +
    `You can pay using Cash, Card, or UPI during your visit. If you have already paid, please ignore this message. Thank you! 😊\n\n` +
    `– Sanjivani Dental Clinic`
  );
  return `https://wa.me/${digits}?text=${message}`;
}

export function getInvoiceUrgency(invoiceDateStr: string, status: string) {
  if (status === "Paid") {
    return {
      label: "Paid",
      bgClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dotClass: "bg-emerald-500",
      urgencyWeight: 4,
    };
  }

  // Calculate local day differences to prevent timezone shifting
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [dYear, dMonth, dDay] = invoiceDateStr.split("-").map(Number);
  const due = new Date(dYear, dMonth - 1, dDay);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const days = Math.abs(diffDays);
    return {
      label: `Overdue • ${days} ${days === 1 ? "day" : "days"}`,
      bgClass: "bg-red-50 text-red-700 border-red-200 font-bold",
      dotClass: "bg-red-500",
      urgencyWeight: 1,
    };
  } else if (diffDays <= 7) {
    return {
      label: "Due This Week",
      bgClass: "bg-amber-50 text-amber-700 border-amber-200 font-semibold",
      dotClass: "bg-amber-500",
      urgencyWeight: 2,
    };
  } else {
    return {
      label: "Upcoming",
      bgClass: "bg-slate-50 text-slate-600 border-slate-200 font-medium",
      dotClass: "bg-slate-400",
      urgencyWeight: 3,
    };
  }
}

/* ─── Invoice Status Dropdown ─── */
function InvoiceStatusDropdown({
  currentStatus,
  onStatusChange,
  openUp = false,
}: {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  openUp?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer flex items-center justify-center border-none bg-transparent"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className={`absolute right-0 ${openUp ? "bottom-11" : "top-11"} z-40 bg-white rounded-lg shadow-lg border border-outline-variant/20 py-1.5 w-40`}>
            {invoiceStatusOptions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  onStatusChange(s);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-surface-container-low transition-colors ${s === currentStatus
                    ? "text-primary bg-secondary-container/30"
                    : "text-on-surface"
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Billing Page Component ─── */
function BillingPageContent() {
  const { logout, user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  // ── Zustand Store UI states ───────────────────────────────────────────────
  const { sidebarOpen, setSidebarOpen } = useSidebarStore();
  const { selectedPatient, isModalOpen, openPatientDetails, closePatientDetails } = usePatientStore();
  const { toast, showToast } = useDashboardStore();

  // Invoice-specific filters and search
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const debouncedInvoiceSearch = useDebounce(invoiceSearch, 300);
  const [activeStatusFilter, setActiveStatusFilter] = useState<"All" | "Paid" | "Pending" | "Partial">("All");

  // Pagination for Invoice Registry
  const [invoicePage, setInvoicePage] = useState(1);
  const pageSize = 10;

  // Collapsible Invoice breakdown state
  const [expandedInvoices, setExpandedInvoices] = useState<Record<string, boolean>>({});
  const toggleInvoiceExpand = (id: string) => {
    setExpandedInvoices((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Bulk selection and reminder states
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Record<string, boolean>>({});
  const [bulkReminderInvoiceIds, setBulkReminderInvoiceIds] = useState<string[]>([]);
  const [isBulkReminderOpen, setIsBulkReminderOpen] = useState(false);
  const [sentInvoices, setSentInvoices] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSelectedInvoiceIds({});
  }, [debouncedInvoiceSearch, activeStatusFilter, invoicePage]);

  // ── Date Computations ──────────────────────────────────────────────────────
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  const currentMonthPrefix = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  // ── Queries ──────────────────────────────────────────────────────────────
  // 1. Patients Registry
  const { data: patients = [], isLoading: isPatientsLoading } = useQuery<Patient[]>({
    queryKey: queryKeys.patients.all,
    queryFn: getPatients,
    staleTime: 5 * 60 * 1000,
  });

  // 2. Invoices
  const { data: invoices = [], isLoading: isInvoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices", "all"],
    queryFn: getInvoices,
    staleTime: 60 * 1000,
  });

  // Pending/Failed invoices count for sidebar badge
  const pendingBillingCount = useMemo(
    () => invoices.filter((inv) => (inv.status || inv.paymentStatus) === "Pending" || (inv.status || inv.paymentStatus) === "Failed").length,
    [invoices]
  );

  // ── Memoized Aggregations ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    // Today's Revenue
    const todayPaidInvoices = invoices.filter(
      (inv) => (inv.status === "Paid" || inv.paymentStatus === "Paid") && inv.invoiceDate === todayStr
    );
    const todayRevenue = todayPaidInvoices.reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0);
    const todayPaidCount = todayPaidInvoices.length;

    // Monthly Revenue
    const monthlyInvoices = invoices.filter(inv => inv.invoiceDate.startsWith(currentMonthPrefix));
    const countGenerated = monthlyInvoices.length;
    const paidInvoicesMonth = monthlyInvoices.filter(inv => (inv.status || inv.paymentStatus) === "Paid");
    const countPaid = paidInvoicesMonth.length;
    const countPending = countGenerated - countPaid;
    const sumRevenueMonth = paidInvoicesMonth.reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0);

    // Total Revenue (All-Time)
    const allPaidInvoices = invoices.filter(inv => (inv.status || inv.paymentStatus) === "Paid");
    const sumTotalRevenue = allPaidInvoices.reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0);

    // Pending Payments
    const unpaidInvoices = invoices.filter(
      (inv) => (inv.status || inv.paymentStatus) !== "Paid"
    );
    const pendingPaymentsCount = unpaidInvoices.length;
    const pendingPaymentsAmount = unpaidInvoices.reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0);

    return {
      todayRevenue,
      todayPaidCount,
      sumRevenueMonth,
      countGenerated,
      countPaid,
      countPending,
      sumTotalRevenue,
      pendingPaymentsCount,
      pendingPaymentsAmount,
    };
  }, [invoices, todayStr, currentMonthPrefix]);

  // Pending Payments list (Sorted by urgency first, then oldest due date first)
  const pendingPaymentsList = useMemo(() => {
    const list: Array<{
      patientName: string;
      invoiceNo: string;
      dueAmount: number;
      status: string;
      bgClass: string;
      dotClass: string;
      urgencyWeight: number;
      dueDate: string;
      patientId: string;
      patientPhone: string;
      invoiceId: string;
    }> = [];

    invoices.forEach((inv) => {
      const invStatus = inv.status || inv.paymentStatus || "Pending";
      if (invStatus !== "Paid") {
        const patientObj = patients.find(p => p.id === inv.patientId);
        const patientName = patientObj ? patientObj.name : (inv.patientName || "Unknown Patient");
        const patientPhone = patientObj ? patientObj.phone : "";

        const urgency = getInvoiceUrgency(inv.invoiceDate, invStatus);

        list.push({
          invoiceId: inv.id,
          patientName,
          invoiceNo: inv.id.slice(0, 8).toUpperCase(),
          dueAmount: inv.total || inv.amount || 0,
          status: urgency.label,
          bgClass: urgency.bgClass,
          dotClass: urgency.dotClass || "bg-amber-500",
          urgencyWeight: urgency.urgencyWeight,
          dueDate: inv.invoiceDate,
          patientId: inv.patientId,
          patientPhone,
        });
      }
    });

    // Sort by urgencyWeight ascending (highest urgency first), then by dueDate ascending (oldest first)
    return list.sort((a, b) => {
      if (a.urgencyWeight !== b.urgencyWeight) {
        return a.urgencyWeight - b.urgencyWeight;
      }
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [invoices, patients]);

  // Recently Paid Invoices Summary (Latest 5 paid)
  const recentlyPaidInvoices = useMemo(() => {
    const list = invoices
      .filter((inv) => (inv.status === "Paid" || inv.paymentStatus === "Paid"))
      .map((inv) => {
        const patientObj = patients.find(p => p.id === inv.patientId);
        const patientName = patientObj ? patientObj.name : (inv.patientName || "Unknown Patient");
        return {
          id: inv.id,
          patientName,
          total: inv.total || inv.amount || 0,
          date: inv.invoiceDate,
        };
      });
    return list.slice(0, 5);
  }, [invoices, patients]);

  // Invoice Mutation for changing payment status
  const invoiceMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const ref = doc(db, COLLECTIONS.INVOICES, id);
      await updateDoc(ref, {
        status,
        paymentStatus: status,
      });
      return { id, status };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", "all"] });
    },
    onSuccess: (data) => {
      showToast(`Invoice status updated to ${data.status}`);
    },
    onError: (err) => {
      console.error(err);
      showToast("Failed to update status");
    },
  });

  const handleInvoiceStatusChange = (id: string, status: string) => {
    invoiceMutation.mutate({ id, status });
  };

  // Filtered and searched list of all invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const patientObj = patients.find(p => p.id === inv.patientId);
      const patientName = patientObj ? patientObj.name.toLowerCase() : (inv.patientName?.toLowerCase() || "");
      const invoiceIdShort = inv.id.toLowerCase();

      const matchesSearch =
        patientName.includes(debouncedInvoiceSearch.toLowerCase()) ||
        invoiceIdShort.includes(debouncedInvoiceSearch.toLowerCase());

      const status = inv.status || inv.paymentStatus || "Pending";
      const matchesStatus =
        activeStatusFilter === "All" || status === activeStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, patients, debouncedInvoiceSearch, activeStatusFilter]);

  // Paginated Invoices Slice
  const paginatedInvoices = useMemo(() => {
    const start = (invoicePage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, invoicePage]);

  const hasNextPage = invoicePage * pageSize < filteredInvoices.length;

  // Open patient detail modal
  const handleOpenPatientDetails = async (phone: string, name: string) => {
    try {
      const found = await queryClient.fetchQuery({
        queryKey: queryKeys.patients.byPhone(phone),
        queryFn: () => getPatientByPhone(phone),
        staleTime: 5 * 60 * 1000,
      });
      if (found) {
        openPatientDetails(found);
      } else {
        openPatientDetails({
          id: "Unregistered",
          name,
          phone,
          email: "",
          age: "",
          lastVisit: "",
          condition: "",
          notes: "This patient requested a booking online but has not been added to the registry yet.",
          avatarColor: "bg-gray-500",
          createdAt: null as any,
          updatedAt: null as any,
          gender: "",
          diseases: "",
          bloodType: "",
          allergies: "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch patient:", err);
      showToast("Error loading patient profile");
    }
  };

  const handlePrintInvoice = (id: string) => {
    window.open(`/admin/invoices/${id}/print`, "_blank");
  };

  const handleSendAll = () => {
    const toSend = bulkReminderInvoiceIds
      .map((id) => {
        const inv = invoices.find((i) => i.id === id);
        if (!inv) return null;
        const patientObj = patients.find((p) => p.id === inv.patientId);
        const phone = patientObj ? patientObj.phone : "";
        const name = patientObj ? patientObj.name : inv.patientName || "Unknown Patient";
        return { id, phone, name, inv };
      })
      .filter((x) => x && x.phone);

    if (toSend.length === 0) return;

    toSend.forEach((item, index) => {
      if (item) {
        setTimeout(() => {
          const url = buildInvoiceWhatsAppUrl(item.phone, item.name, item.inv);
          window.open(url, "_blank");
          setSentInvoices((prev) => ({ ...prev, [item.id]: true }));
        }, index * 400);
      }
    });

    showToast(`Opening ${toSend.length} WhatsApp chats. Please allow pop-ups!`);
  };

  const isLoading = isPatientsLoading || isInvoicesLoading;
  const showSkeleton = useDelayLoading(isLoading, 300);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen flex bg-[#f2f5f8] font-sans">
      {/* ── Mobile Sidebar Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-[200px] shrink-0 border-r border-outline-variant/20 sticky top-0 h-screen shadow-sm flex-col">
        <Sidebar
          currentPage="billing"
          onLogout={handleLogout}
          pendingBillingCount={pendingBillingCount}
        />
      </aside>

      {/* ── Mobile Sidebar Drawer ── */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[220px] shadow-level-2 transition-transform duration-300 md:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <Sidebar
          currentPage="billing"
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
          pendingBillingCount={pendingBillingCount}
        />
      </div>

      {/* ═══ MAIN AREA ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-outline-variant/20 px-4 md:px-8 py-4 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-surface-variant text-primary shrink-0 cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-lg md:text-xl font-bold text-primary shrink-0 font-sans">
            Billing & Revenue
          </h1>

          {/* Profile */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-auto">
            <div className="text-right hidden lg:block">
              <p className="text-sm font-semibold text-on-surface leading-tight">
                {user?.email || "Admin"}
              </p>
              <p className="text-xs text-on-surface-variant">
                Clinic Administrator
              </p>
            </div>
            <div className="relative w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-secondary-container shrink-0 bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {user?.email?.[0]?.toUpperCase() || "A"}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 space-y-6">
          {showSkeleton ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-8 space-y-6">
                  <TableSkeleton columns={6} rows={5} />
                </div>
                <div className="xl:col-span-4 space-y-6">
                  <CardListSkeleton count={4} />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ── SECTION 1: REVENUE KPI CARDS ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Today's Revenue */}
                <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-5 flex items-center justify-between transition-transform hover:scale-[1.01]">
                  <div className="space-y-1">
                    <span className="text-xs text-on-surface-variant font-medium block">Today's Revenue</span>
                    <span className="text-2xl md:text-3xl font-bold font-mono text-emerald-600 block">
                      ₹{formatINR(stats.todayRevenue)}
                    </span>
                    <div className="text-[10px] font-semibold text-emerald-600 uppercase">
                      {stats.todayPaidCount} paid invoices today
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <IndianRupee className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>

                {/* 2. Month's Revenue */}
                <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-5 flex items-center justify-between transition-transform hover:scale-[1.01]">
                  <div className="space-y-1">
                    <span className="text-xs text-on-surface-variant font-medium block">Month's Revenue</span>
                    <span className="text-2xl md:text-3xl font-bold font-mono text-emerald-600 block">
                      ₹{formatINR(stats.sumRevenueMonth)}
                    </span>
                    <div className="text-[10px] font-semibold text-emerald-600 uppercase">
                      {stats.countPaid} paid this month
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>

                {/* 3. Total Revenue */}
                <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-5 flex items-center justify-between transition-transform hover:scale-[1.01]">
                  <div className="space-y-1">
                    <span className="text-xs text-on-surface-variant font-medium block">Total Revenue</span>
                    <span className="text-2xl md:text-3xl font-bold font-mono text-emerald-700 block">
                      ₹{formatINR(stats.sumTotalRevenue)}
                    </span>
                    <div className="text-[10px] font-semibold text-emerald-700 uppercase">
                      All-time collected
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <IndianRupee className="w-5 h-5 text-emerald-700" />
                  </div>
                </div>

                {/* 4. Pending Payments */}
                <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-5 flex items-center justify-between transition-transform hover:scale-[1.01]">
                  <div className="space-y-1">
                    <span className="text-xs text-on-surface-variant font-medium block">Pending Payments</span>
                    <span className="text-2xl md:text-3xl font-bold font-mono text-amber-600 block">
                      ₹{formatINR(stats.pendingPaymentsAmount)}
                    </span>
                    <div className="text-[10px] font-semibold text-amber-600 uppercase">
                      {stats.pendingPaymentsCount} outstanding invoices
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </div>

              {/* ── MAIN CONTENT GRID ── */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                {/* LEFT COLUMN: Tables (col-span-8) */}
                <div className="xl:col-span-8 space-y-6">

                  {/* PENDING PAYMENTS TABLE */}
                  <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-outline-variant/10 flex items-center justify-between">
                      <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2 font-sans">
                        <IndianRupee className="w-4 h-4 text-amber-600" />
                        Pending Payments Table
                      </h2>
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        {pendingPaymentsList.length} Invoices
                      </span>
                    </div>

                    {pendingPaymentsList.length === 0 ? (
                      <div className="py-12 text-center text-on-surface-variant">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400 opacity-60" />
                        <p className="text-xs font-semibold">No pending payments outstanding</p>
                        <p className="text-[10px] mt-0.5 text-on-surface-variant/75">
                          Excellent! All invoices have been paid in full
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="w-full text-sm text-left border-collapse">
                          <thead>
                            <tr className="bg-surface-container border-b border-outline-variant/15 text-[11px] uppercase font-bold text-on-surface-variant">
                              <th className="px-5 py-4">Patient</th>
                              <th className="px-5 py-4 text-center">Invoice No.</th>
                              <th className="px-5 py-4 text-right">Due Amount</th>
                              <th className="px-5 py-4">Status</th>
                              <th className="px-5 py-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/10">
                            {pendingPaymentsList.map((inv, idx) => (
                              <tr key={idx} className="hover:bg-surface-container-low/20 transition-colors">
                                <td className="px-5 py-5 font-bold text-on-surface">
                                  {inv.patientPhone ? (
                                    <button
                                      onClick={() => handleOpenPatientDetails(inv.patientPhone, inv.patientName)}
                                      className="hover:underline text-left cursor-pointer font-bold text-sm text-on-surface"
                                    >
                                      {inv.patientName}
                                    </button>
                                  ) : (
                                    inv.patientName
                                  )}
                                </td>
                                <td className="px-5 py-5 text-center text-on-surface-variant font-semibold font-mono">
                                  #{inv.invoiceNo}
                                </td>
                                <td className="px-5 py-5 text-right font-bold text-red-600 font-mono text-sm">
                                  ₹{formatINR(inv.dueAmount)}
                                </td>
                                <td className="px-5 py-5">
                                  <div className="flex flex-col gap-1 items-start">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border ${inv.bgClass}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${inv.dotClass}`} />
                                      <span>{inv.status}</span>
                                    </span>
                                    <span className="text-[10px] text-on-surface-variant font-medium">
                                      Due: {inv.dueDate}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-5 py-5 text-right">
                                  <button
                                    onClick={() => showToast(`Initiated payment collection of ₹${formatINR(inv.dueAmount)} for ${inv.patientName}`)}
                                    className="h-12 px-6 text-xs font-black uppercase tracking-wider rounded-xl bg-primary hover:bg-primary-container text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer flex items-center justify-center ml-auto"
                                    title="Collect Payment"
                                  >
                                    Collect Payment
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* INVOICE REGISTRY LIST (SEARCH / FILTER) */}
                  <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-outline-variant/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2 font-sans">
                        <CreditCard className="w-4 h-4 text-primary" />
                        Invoice Registry
                      </h2>
                      <span className="text-xs font-semibold text-on-surface-variant bg-surface-container px-2.5 py-0.5 rounded-full font-sans">
                        {filteredInvoices.length} Invoices Found
                      </span>
                    </div>

                    {/* Filter controls */}
                    <div className="p-4 bg-surface-container/30 border-b border-outline-variant/10 flex flex-col sm:flex-row gap-3">
                      {/* Search Bar */}
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                        <input
                          type="text"
                          value={invoiceSearch}
                          onChange={(e) => {
                            setInvoiceSearch(e.target.value);
                            setInvoicePage(1);
                          }}
                          placeholder="Search by patient name or invoice ID..."
                          className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-outline-variant/40 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      {/* Status filter tabs */}
                      <div className="flex gap-1 bg-surface-container-low rounded-lg p-1 self-start sm:self-auto">
                        {(["All", "Paid", "Pending", "Partial"] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => {
                              setActiveStatusFilter(status);
                              setInvoicePage(1);
                            }}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                              activeStatusFilter === status
                                ? "bg-white text-primary shadow-sm"
                                : "text-secondary hover:text-on-surface"
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>

                    {filteredInvoices.length === 0 ? (
                      <div className="py-12 text-center text-on-surface-variant">
                        <Search className="w-8 h-8 mx-auto mb-2 text-on-surface-variant/60" />
                        <p className="text-xs font-semibold">No invoices matched your filters</p>
                        <p className="text-[10px] mt-0.5 text-on-surface-variant/75">
                          Try searching for a different keyword or resetting filters
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                              <thead>
                                <tr className="bg-surface-container border-b border-outline-variant/15 text-[11px] uppercase font-bold text-on-surface-variant">
                                  <th className="px-5 py-4 w-10 text-center">
                                    <input
                                      type="checkbox"
                                      checked={
                                        paginatedInvoices.length > 0 &&
                                        paginatedInvoices.every((inv) => !!selectedInvoiceIds[inv.id])
                                      }
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setSelectedInvoiceIds((prev) => {
                                          const next = { ...prev };
                                          paginatedInvoices.forEach((inv) => {
                                            if (checked) {
                                              next[inv.id] = true;
                                            } else {
                                              delete next[inv.id];
                                            }
                                          });
                                          return next;
                                        });
                                      }}
                                      className="rounded border-outline-variant/40 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                    />
                                  </th>
                                  <th className="px-5 py-4 w-10"></th>
                                  <th className="px-5 py-4">Patient</th>
                                  <th className="px-5 py-4 text-right">Amount Due</th>
                                  <th className="px-5 py-4">Status</th>
                                  <th className="px-5 py-4">Due Date</th>
                                  <th className="px-5 py-4 text-right w-40">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-outline-variant/10">
                                {paginatedInvoices.map((inv, index) => {
                                  const patientObj = patients.find(p => p.id === inv.patientId);
                                  const patientPhone = patientObj ? patientObj.phone : "";
                                  const patientName = patientObj ? patientObj.name : (inv.patientName || "Unknown Patient");
                                  const invStatus = inv.status || inv.paymentStatus || "Pending";
                                  const urgency = getInvoiceUrgency(inv.invoiceDate, invStatus);
                                  const isExpanded = !!expandedInvoices[inv.id];

                                  return (
                                    <React.Fragment key={inv.id}>
                                      <tr className="hover:bg-surface-container-low/20 transition-colors border-b border-outline-variant/10">
                                        <td className="px-5 py-5 text-center">
                                          <input
                                            type="checkbox"
                                            checked={!!selectedInvoiceIds[inv.id]}
                                            onChange={(e) => {
                                              const checked = e.target.checked;
                                              setSelectedInvoiceIds((prev) => {
                                                const next = { ...prev };
                                                if (checked) {
                                                  next[inv.id] = true;
                                                } else {
                                                  delete next[inv.id];
                                                }
                                                return next;
                                              });
                                            }}
                                            className="rounded border-outline-variant/40 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                          />
                                        </td>
                                        <td className="px-5 py-5 text-center">
                                          <button
                                            onClick={() => toggleInvoiceExpand(inv.id)}
                                            className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-transform duration-200 cursor-pointer flex items-center justify-center"
                                            style={{ transform: isExpanded ? "rotate(90deg)" : "none" }}
                                            title="Toggle Breakdown Details"
                                          >
                                            <ChevronRight className="w-4 h-4" />
                                          </button>
                                        </td>
                                        <td className="px-5 py-5 font-bold text-on-surface">
                                          <div className="flex flex-col">
                                            {patientPhone ? (
                                              <button
                                                onClick={() => handleOpenPatientDetails(patientPhone, patientName)}
                                                className="hover:underline text-left cursor-pointer font-bold text-sm text-on-surface"
                                              >
                                                {patientName}
                                              </button>
                                            ) : (
                                              <span className="text-sm">{patientName}</span>
                                            )}
                                            <span className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                                              #{inv.id.slice(0, 8).toUpperCase()}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-5 py-5 text-right font-bold text-on-surface font-mono text-sm">
                                          ₹{formatINR(inv.total || inv.amount)}
                                        </td>
                                        <td className="px-5 py-5">
                                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs border ${urgency.bgClass}`}>
                                            {urgency.label}
                                          </span>
                                        </td>
                                        <td className="px-5 py-5 text-on-surface-variant font-semibold text-sm whitespace-nowrap">
                                          {inv.invoiceDate}
                                        </td>
                                        <td className="px-5 py-5 text-right">
                                          <div className="flex items-center justify-end gap-2">
                                            {/* Send WhatsApp Reminder */}
                                            {patientPhone && invStatus !== "Paid" && (
                                              <a
                                                href={buildInvoiceWhatsAppUrl(patientPhone, patientName, inv)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 rounded-xl hover:bg-surface-container text-emerald-600 flex items-center justify-center cursor-pointer transition-colors"
                                                title="Send WhatsApp Reminder"
                                              >
                                                <WhatsAppIcon className="w-5 h-5 fill-current" />
                                              </a>
                                            )}
                                            {/* Print invoice button */}
                                            <button
                                              onClick={() => handlePrintInvoice(inv.id)}
                                              className="w-10 h-10 rounded-xl hover:bg-surface-container text-primary flex items-center justify-center cursor-pointer border-none bg-transparent"
                                              title="Print Invoice PDF"
                                            >
                                              <Printer className="w-5 h-5" />
                                            </button>
                                            {/* Change status action */}
                                            <InvoiceStatusDropdown
                                              currentStatus={invStatus}
                                              onStatusChange={(s) => handleInvoiceStatusChange(inv.id, s)}
                                              openUp={index >= paginatedInvoices.length - 2}
                                            />
                                          </div>
                                        </td>
                                      </tr>

                                      {/* Expandable breakdown row */}
                                      {isExpanded && (
                                        <tr className="bg-surface-container-lowest/40">
                                          <td colSpan={7} className="px-10 py-4 border-b border-outline-variant/10">
                                            <div className="max-w-md bg-white border border-outline-variant/15 rounded-xl p-5 shadow-sm space-y-3">
                                              <p className="text-xs font-bold text-primary uppercase tracking-wider border-b border-outline-variant/10 pb-2 flex items-center justify-between">
                                                <span>Invoice Breakdown</span>
                                                <span className="font-mono text-[10px] text-on-surface-variant lowercase">id: #{inv.id}</span>
                                              </p>
                                              <div className="grid grid-cols-2 gap-y-2 text-xs font-medium text-on-surface-variant">
                                                <div>Subtotal / Gross Amount:</div>
                                                <div className="text-right font-mono font-bold text-on-surface">₹{formatINR(inv.subtotal || inv.grossAmount || 0)}</div>

                                                <div>Tax (18%):</div>
                                                <div className="text-right font-mono font-bold text-on-surface">₹{formatINR(inv.tax || inv.taxAmount || 0)}</div>

                                                <div>Discount:</div>
                                                <div className="text-right font-mono font-bold text-red-500">-₹{formatINR(inv.discount || inv.discountAmount || 0)}</div>

                                                <div className="border-t border-outline-variant/10 pt-2 font-bold text-on-surface">Grand Total:</div>
                                                <div className="border-t border-outline-variant/10 pt-2 text-right font-mono font-extrabold text-sm text-primary">
                                                  ₹{formatINR(inv.total || inv.amount || 0)}
                                                </div>
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          
                        )}

                        {/* Pagination */}
                        {filteredInvoices.length > pageSize && (
                          <div className="px-5 py-3 border-t border-outline-variant/10 flex items-center justify-between gap-3 bg-surface-container-lowest">
                            <p className="text-xs text-on-surface-variant font-medium">
                              Showing Page <span className="font-semibold text-on-surface">{invoicePage}</span> · Invoices {pageSize * (invoicePage - 1) + 1}–{pageSize * (invoicePage - 1) + paginatedInvoices.length} of {filteredInvoices.length}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setInvoicePage(p => Math.max(1, p - 1))}
                                disabled={invoicePage === 1}
                                className="p-1.5 rounded-lg border border-outline-variant/30 hover:bg-surface-container text-on-surface-variant disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer flex items-center justify-center bg-white"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setInvoicePage(p => p + 1)}
                                disabled={!hasNextPage}
                                className="p-1.5 rounded-lg border border-outline-variant/30 hover:bg-surface-container text-on-surface-variant disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer flex items-center justify-center bg-white"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      
                      
                      
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Sidebar Insights (col-span-4) */}
                    <div className="xl:col-span-4 space-y-6">

                      {/* REVENUE ANALYTICS */}
                      <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-5 space-y-4">
                        <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2 font-sans">
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                          Revenue Analytics
                        </h2>

                        <div className="bg-emerald-50/55 p-4 rounded-xl border border-emerald-100/50 text-center space-y-1">
                          <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Revenue This Month</span>
                          <span className="text-3xl font-extrabold text-emerald-600 font-mono block">
                            ₹{formatINR(stats.sumRevenueMonth)}
                          </span>
                        </div>

                        <div className="divide-y divide-outline-variant/10 text-xs">
                          <div className="py-2.5 flex justify-between items-center text-on-surface-variant">
                            <span>Total Revenue (All-Time)</span>
                            <span className="font-bold font-mono text-on-surface">₹{formatINR(stats.sumTotalRevenue)}</span>
                          </div>
                          <div className="py-2.5 flex justify-between items-center text-on-surface-variant">
                            <span>Invoices Generated (Month)</span>
                            <span className="font-bold text-on-surface">{stats.countGenerated}</span>
                          </div>
                          <div className="py-2.5 flex justify-between items-center text-on-surface-variant">
                            <span>Paid Invoices (Month)</span>
                            <span className="font-bold text-emerald-600">{stats.countPaid}</span>
                          </div>
                          <div className="py-2.5 flex justify-between items-center text-on-surface-variant">
                            <span>Pending Invoices (Month)</span>
                            <span className="font-bold text-amber-600">{stats.countPending}</span>
                          </div>
                        </div>

                        {/* Paid Progress bar */}
                        {(() => {
                          const totalCount = stats.countGenerated;
                          const paidCount = stats.countPaid;
                          const pct = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
                          return (
                            <div className="space-y-1.5 pt-2">
                              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                                <span>Paid Invoices Progress</span>
                                <span className="text-primary font-mono">{pct.toFixed(0)}%</span>
                              </div>
                              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* PAID INVOICE LOGSUMMARY */}
                      <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-outline-variant/10 flex items-center justify-between">
                          <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2 font-sans">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Recently Paid Invoices
                          </h2>
                        </div>

                        {recentlyPaidInvoices.length === 0 ? (
                          <div className="py-8 text-center text-on-surface-variant">
                            <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-xs font-semibold">No paid invoices recorded yet</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-outline-variant/10">
                            {recentlyPaidInvoices.map((inv) => (
                              <div
                                key={inv.id}
                                className="p-3.5 flex items-center justify-between hover:bg-surface-container-low/40 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs font-bold text-on-surface block truncate">
                                    {inv.patientName}
                                  </span>
                                  <span className="text-[9px] text-on-surface-variant font-medium">
                                    Paid on: {inv.date} · #{inv.id.slice(0, 8).toUpperCase()}
                                  </span>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-xs font-bold text-emerald-600 block font-mono">
                                    ₹{formatINR(inv.total)}
                                  </span>
                                  <span className="inline-flex px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded">
                                    Paid
                                  </span>
                                </div>
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

              {/* Footer */}
              <footer className="bg-white border-t border-outline-variant/20 px-4 md:px-8 py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
                  <p>© 2024 Sanjivani Dentals. All rights reserved.</p>
                  <div className="flex items-center gap-4 font-medium">
                    <Link href="/#privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                    <Link href="/#hipaa" className="hover:text-primary transition-colors">HIPAA Compliance</Link>
                    <Link href="/#accessibility" className="hover:text-primary transition-colors">Accessibility</Link>
                  </div>
                </div>
              </footer>
            </div>

          {/* Patient Details Modal */}
          <PatientDetailsModal
            patient={selectedPatient}
            isOpen={isModalOpen}
            onClose={closePatientDetails}
          />

          {/* Bulk WhatsApp Reminder Modal */}
          {isBulkReminderOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 text-on-surface">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2 font-sans">
                    <WhatsAppIcon className="w-5 h-5 text-emerald-600 fill-current" />
                    Send WhatsApp Reminders
                  </h3>
                  <button
                    onClick={() => setIsBulkReminderOpen(false)}
                    className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-4">
                  <div className="bg-emerald-50/50 border border-emerald-100/50 p-4 rounded-xl text-xs text-emerald-800 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      💡 Tip for bulk sending
                    </p>
                    <p>
                      To send to multiple patients at once, you will need to allow your browser to open multiple tabs/pop-ups. Alternatively, you can click the "Send" button next to each patient row.
                    </p>
                  </div>

                  <div className="border border-outline-variant/10 rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container-low text-[10px] uppercase font-bold text-on-surface-variant border-b border-outline-variant/10">
                          <th className="px-4 py-3">Patient</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-right w-24">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {bulkReminderInvoiceIds.map((id) => {
                          const inv = invoices.find((i) => i.id === id);
                          if (!inv) return null;
                          const patientObj = patients.find((p) => p.id === inv.patientId);
                          const patientName = patientObj ? patientObj.name : inv.patientName || "Unknown Patient";
                          const patientPhone = patientObj ? patientObj.phone : "";
                          const invStatus = inv.status || inv.paymentStatus || "Pending";
                          const amount = inv.total || inv.amount || 0;
                          const isSent = !!sentInvoices[id];

                          return (
                            <tr key={id} className="hover:bg-surface-container-lowest/50 transition-colors">
                              <td className="px-4 py-3.5 font-semibold text-on-surface">
                                <div className="flex flex-col">
                                  <span>{patientName}</span>
                                  <span className="text-[9px] text-on-surface-variant font-mono mt-0.5">
                                    #{id.slice(0, 8).toUpperCase()}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono font-bold text-on-surface">
                                ₹{formatINR(amount)}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                  invStatus === "Paid" 
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                    : "bg-amber-50 text-amber-700 border border-amber-100"
                                }`}>
                                  {invStatus}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                {patientPhone ? (
                                  <button
                                    onClick={() => {
                                      const url = buildInvoiceWhatsAppUrl(patientPhone, patientName, inv);
                                      window.open(url, "_blank");
                                      setSentInvoices((prev) => ({ ...prev, [id]: true }));
                                    }}
                                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer inline-flex items-center gap-1 ${
                                      isSent
                                        ? "bg-slate-50 text-slate-500 border-slate-200"
                                        : "bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                    }`}
                                  >
                                    {isSent ? (
                                      <>
                                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                        Sent
                                      </>
                                    ) : (
                                      "Send"
                                    )}
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-[10px]">No Phone</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-outline-variant/10 bg-surface-container-lowest flex justify-between items-center text-xs">
                  <button
                    onClick={() => {
                      setSelectedInvoiceIds({});
                      setIsBulkReminderOpen(false);
                    }}
                    className="text-on-surface-variant hover:text-on-surface text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Reset Selection & Close
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsBulkReminderOpen(false)}
                      className="bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleSendAll}
                      disabled={bulkReminderInvoiceIds.every((id) => {
                        const inv = invoices.find((i) => i.id === id);
                        if (!inv) return true;
                        const pObj = patients.find((p) => p.id === inv.patientId);
                        return !pObj || !pObj.phone;
                      })}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                      Send All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Floating Bulk Action Bar */}
          {Object.keys(selectedInvoiceIds).length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-6 border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <span className="text-xs font-semibold">
                {Object.keys(selectedInvoiceIds).length} {Object.keys(selectedInvoiceIds).length === 1 ? "invoice" : "invoices"} selected
              </span>
              <div className="h-4 w-px bg-slate-800" />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const selectedIds = Object.keys(selectedInvoiceIds);
                    setBulkReminderInvoiceIds(selectedIds);
                    setSentInvoices({});
                    setIsBulkReminderOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border-none"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                  Send WhatsApp Reminders
                </button>
                
                <button
                  onClick={() => {
                    setSelectedInvoiceIds({});
                  }}
                  className="text-slate-400 hover:text-white text-xs font-medium px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Toast */}
          {toast && (
            <div className="fixed bottom-6 right-4 md:right-6 z-50 bg-on-surface text-surface text-sm font-medium px-4 py-3 rounded-xl shadow-level-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {toast}
            </div>
          )}
      </div>
      );
}

      /* ─── Page component export with Guard ─── */
      export default function BillingPage() {
  return (
      <AdminAuthGuard>
        <BillingPageContent />
      </AdminAuthGuard>
      );
}
