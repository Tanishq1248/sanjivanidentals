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
  ChevronDown,
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
  AlertCircle,
  AlertTriangle,
  Clock,
  FileText,
  ExternalLink,
  Receipt,
  Plus,
  Mail,
  RefreshCw,
} from "lucide-react";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { COLLECTIONS } from "../../../lib/services/firestoreConfig";
import { AdminAuthGuard } from "../../../components/auth/AdminAuthGuard";
import { useAuth } from "../../../lib/context/AuthContext";
import { getPatientByPhone, getPatients } from "../../../lib/services/patientService";
import { getInvoices, getInvoiceStatusDetails, getInvoiceStatus } from "../../../lib/services/invoiceService";
import { PatientDetailsModal } from "../../../components/admin/PatientDetailsModal";
import { PaymentDialog } from "../../../components/admin/PaymentDialog";
import { queryKeys } from "../../../lib/query/queryKeys";
import { TableSkeleton, CardListSkeleton, StatsCardSkeleton, useDelayLoading } from "../../../components/ui/Skeletons";
import type { Patient, Invoice } from "../../../lib/types";
import { useSidebarStore } from "../../../lib/store/useSidebarStore";
import { usePatientStore } from "../../../lib/store/usePatientStore";
import { useDashboardStore } from "../../../lib/store/useDashboardStore";
import { Sidebar } from "../../../components/admin/Sidebar";

/* ─── Status Styles ─── */
const statusStyles: Record<string, string> = {
  Confirmed: "bg-blue-50 text-blue-700 border border-blue-200",
  Pending: "bg-amber-50 text-amber-700 border border-amber-200",
  "In Progress": "bg-amber-50 text-amber-700 border border-amber-200",
  Completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Partial: "bg-blue-50 text-blue-700 border border-blue-200",
  Cancelled: "bg-red-50 text-red-600 border border-red-200",
  Failed: "bg-red-50 text-red-600 border border-red-200",
  PAID: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  PARTIAL: "bg-blue-50 text-blue-700 border border-blue-200",
  PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
  UNPAID: "bg-red-50 text-red-600 border border-red-200",
};

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
  const amountDue = inv.remainingAmount !== undefined ? inv.remainingAmount : (inv.total || inv.amount || 0);
  const invIdShort = inv.id.slice(0, 8).toUpperCase();
  const invStatus = inv.status || inv.paymentStatus || "Pending";
  const dateStr = inv.dueDate || inv.invoiceDate;
  
  const message = encodeURIComponent(
    `Hello ${name}! 👋 This is Sanjivani Dental Clinic. A friendly reminder regarding your invoice #${invIdShort} with remaining due ₹${formatINR(amountDue)} dated ${dateStr}.\n\n` +
    `Status: *${invStatus}*\n\n` +
    `You can pay using Cash, Card, or UPI during your visit. If you have already paid, please ignore this message. Thank you! 😊\n\n` +
    `– Sanjivani Dental Clinic`
  );
  return `https://wa.me/${digits}?text=${message}`;
}

function getDiffDays(dateStr?: string, todayDate?: Date): number {
  if (!dateStr || !todayDate) return 0;
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return 0;
  const target = new Date(year, month - 1, day);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - todayDate.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

function getInvoicePaymentMethod(inv: Invoice): string {
  const history = inv.paymentHistory || [];
  const validHistory = history.filter((p) => p.paymentType !== "Generated" && p.paymentMethod && p.paymentMethod !== "None");
  if (validHistory.length > 0) {
    const methods = Array.from(new Set(validHistory.map((p) => p.paymentMethod)));
    if (methods.length === 1) return methods[0];
    if (methods.length > 1) return "Multiple";
  }
  if ((inv as any).paymentMethod) return (inv as any).paymentMethod;
  return "—";
}

type FilterTab = "All" | "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "DUE_TODAY" | "DUE_THIS_WEEK";

/* ─── Billing Page Component ─── */
function BillingPageContent() {
  const { logout, user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Zustand Store UI states
  const { sidebarOpen, setSidebarOpen } = useSidebarStore();
  const { selectedPatient, isModalOpen, openPatientDetails, closePatientDetails } = usePatientStore();
  const { toast, showToast } = useDashboardStore();

  // Payment Modal states
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Search & Filter Tabs
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const debouncedInvoiceSearch = useDebounce(invoiceSearch, 300);
  const [activeStatusFilter, setActiveStatusFilter] = useState<FilterTab>("All");

  // Pagination for Invoice Registry
  const [invoicePage, setInvoicePage] = useState(1);
  const pageSize = 12;

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

  // ── Date Computations ──
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  const todayDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // ── Queries ──
  const { data: patients = [], isLoading: isPatientsLoading } = useQuery<Patient[]>({
    queryKey: queryKeys.patients.all,
    queryFn: getPatients,
    staleTime: 5 * 60 * 1000,
  });

  const { data: invoices = [], isLoading: isInvoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices", "all"],
    queryFn: getInvoices,
    staleTime: 60 * 1000,
  });

  // ── Memoized Operational Statistics ──
  const stats = useMemo(() => {
    let todayRevenue = 0;
    let todayPaidCount = 0;
    let pendingPaymentsCount = 0;
    let pendingPaymentsAmount = 0;
    let dueTodayCount = 0;
    let dueTodayAmount = 0;
    let overdueCount = 0;
    let overdueAmount = 0;

    invoices.forEach((inv) => {
      const history = inv.paymentHistory || [];
      const status = getInvoiceStatus(inv);
      const isPaid = status === "PAID";
      const net = inv.total || inv.amount || 0;
      const paid = inv.paidAmount || 0;
      const remaining = inv.remainingAmount !== undefined ? inv.remainingAmount : Math.max(0, net - paid);
      const dueDateStr = inv.dueDate || inv.invoiceDate;
      const diffDays = getDiffDays(dueDateStr, todayDate);

      // Today's Collection (cash received today)
      if (history.length > 0) {
        history.forEach((pay) => {
          if (pay.paymentType !== "Generated" && pay.amountReceived > 0) {
            if (pay.paymentDate === todayStr) {
              todayRevenue += pay.amountReceived;
              todayPaidCount++;
            }
          }
        });
      } else if (isPaid && inv.invoiceDate === todayStr) {
        todayRevenue += net;
        todayPaidCount++;
      }

      // Operational metrics for active unpaid/partially paid invoices
      if (!isPaid) {
        pendingPaymentsCount++;
        pendingPaymentsAmount += remaining;

        if (diffDays === 0) {
          dueTodayCount++;
          dueTodayAmount += remaining;
        }

        if (diffDays < 0) {
          overdueCount++;
          overdueAmount += remaining;
        }
      }
    });

    return {
      todayRevenue,
      todayPaidCount,
      pendingPaymentsCount,
      pendingPaymentsAmount,
      dueTodayCount,
      dueTodayAmount,
      overdueCount,
      overdueAmount,
    };
  }, [invoices, todayStr, todayDate]);

  // ── Filtered & Searched Master Invoice Registry List ──
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const patientObj = patients.find((p) => p.id === inv.patientId);
      const patientName = patientObj ? patientObj.name.toLowerCase() : (inv.patientName?.toLowerCase() || "");
      const patientPhone = patientObj ? patientObj.phone.toLowerCase() : "";
      const invoiceIdShort = inv.id.toLowerCase();
      const searchLower = debouncedInvoiceSearch.toLowerCase();

      const matchesSearch =
        patientName.includes(searchLower) ||
        patientPhone.includes(searchLower) ||
        invoiceIdShort.includes(searchLower);

      const status = getInvoiceStatus(inv);
      const isPaid = status === "PAID";
      const dueDateStr = inv.dueDate || inv.invoiceDate;
      const diffDays = getDiffDays(dueDateStr, todayDate);

      let matchesStatus = true;
      if (activeStatusFilter === "PENDING") {
        matchesStatus = status === "PENDING" || status === "UNPAID";
      } else if (activeStatusFilter === "PARTIAL") {
        matchesStatus = status === "PARTIAL";
      } else if (activeStatusFilter === "PAID") {
        matchesStatus = isPaid;
      } else if (activeStatusFilter === "OVERDUE") {
        matchesStatus = !isPaid && diffDays < 0;
      } else if (activeStatusFilter === "DUE_TODAY") {
        matchesStatus = !isPaid && diffDays === 0;
      } else if (activeStatusFilter === "DUE_THIS_WEEK") {
        matchesStatus = !isPaid && diffDays >= 0 && diffDays <= 7;
      }

      return matchesSearch && matchesStatus;
    });
  }, [invoices, patients, debouncedInvoiceSearch, activeStatusFilter, todayDate]);

  // Paginated Invoices Slice
  const paginatedInvoices = useMemo(() => {
    const start = (invoicePage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, invoicePage, pageSize]);

  const hasNextPage = invoicePage * pageSize < filteredInvoices.length;

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
          notes: "Patient profile loaded from invoice records.",
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
      <div className="hidden md:flex shrink-0 sticky top-0 h-screen shadow-2xs z-30">
        <Sidebar currentPage="billing" />
      </div>

      {/* ── Mobile Sidebar Drawer ── */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[220px] shadow-level-2 transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar currentPage="billing" onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ═══ MAIN WORKSPACE AREA ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-outline-variant/20 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-surface-variant text-primary shrink-0 cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-primary flex items-center gap-2 font-sans">
                <Receipt className="w-5 h-5 text-primary" /> Billing & Collections Workspace
              </h1>
              <p className="text-xs text-on-surface-variant hidden sm:block">
                Collect payments, track outstanding dues, and issue invoice receipts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-on-surface leading-tight">
                {user?.email || "Admin"}
              </p>
              <p className="text-xs text-on-surface-variant font-medium">Logged in Clinician</p>
            </div>
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-secondary-container shrink-0 bg-primary flex items-center justify-center text-white font-bold text-sm">
              {user?.email?.[0]?.toUpperCase() || "A"}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 space-y-6">
          {showSkeleton ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
              </div>
              <TableSkeleton columns={8} rows={8} />
            </div>
          ) : (
            <>
              {/* ── 1. OPERATIONAL BILLING KPI CARDS (4 Cards Only) ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Today's Collection */}
                <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm p-5 flex items-center justify-between transition-all hover:border-outline-variant/30">
                  <div className="space-y-1">
                    <span className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider block">Today's Collection</span>
                    <span className="text-2xl font-bold font-mono text-emerald-600 block">
                      ₹{formatINR(stats.todayRevenue)}
                    </span>
                    <div className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {stats.todayPaidCount} payments today
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm">
                    <IndianRupee className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>

                {/* 2. Pending Amount */}
                <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm p-5 flex items-center justify-between transition-all hover:border-outline-variant/30">
                  <div className="space-y-1">
                    <span className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider block">Pending Amount</span>
                    <span className="text-2xl font-bold font-mono text-amber-600 block">
                      ₹{formatINR(stats.pendingPaymentsAmount)}
                    </span>
                    <div className="text-[11px] font-medium text-amber-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {stats.pendingPaymentsCount} outstanding invoices
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 shadow-sm">
                    <CreditCard className="w-5 h-5 text-amber-600" />
                  </div>
                </div>

                {/* 3. Invoices Due Today */}
                <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm p-5 flex items-center justify-between transition-all hover:border-outline-variant/30">
                  <div className="space-y-1">
                    <span className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider block">Invoices Due Today</span>
                    <span className="text-2xl font-bold font-mono text-blue-600 block">
                      ₹{formatINR(stats.dueTodayAmount)}
                    </span>
                    <div className="text-[11px] font-medium text-blue-700 flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {stats.dueTodayCount} due today
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-blue-600" />
                  </div>
                </div>

                {/* 4. Overdue Payments */}
                <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm p-5 flex items-center justify-between transition-all hover:border-outline-variant/30">
                  <div className="space-y-1">
                    <span className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider block">Overdue Payments</span>
                    <span className="text-2xl font-black font-mono text-red-600 block">
                      ₹{formatINR(stats.overdueAmount)}
                    </span>
                    <div className="text-[11px] font-semibold text-red-700 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {stats.overdueCount} overdue invoices
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0 shadow-sm">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </div>

              {/* ── 2. MASTER INVOICE REGISTRY WORKSPACE (Full Width) ── */}
              <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm overflow-hidden space-y-0">
                
                {/* Search & Filter Header Bar */}
                <div className="p-5 border-b border-outline-variant/10 space-y-4 bg-white">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-on-surface flex items-center gap-2 font-sans">
                        <CreditCard className="w-5 h-5 text-primary" />
                        Master Invoice Registry
                      </h2>
                      <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold font-sans">
                        {filteredInvoices.length} Invoices Found
                      </span>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full md:w-80">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                      <input
                        type="text"
                        value={invoiceSearch}
                        onChange={(e) => {
                          setInvoiceSearch(e.target.value);
                          setInvoicePage(1);
                        }}
                        placeholder="Search patient name, phone, invoice ID..."
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-outline-variant/30 bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface"
                      />
                      {invoiceSearch && (
                        <button
                          onClick={() => setInvoiceSearch("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-0.5 rounded-full"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 7 Operational Filter Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-outline-variant/10 pt-3">
                    {[
                      { id: "All", label: "All Invoices", count: invoices.length },
                      { id: "PENDING", label: "Pending", count: stats.pendingPaymentsCount },
                      { id: "PARTIAL", label: "Partial", count: invoices.filter(i => getInvoiceStatus(i) === "PARTIAL").length },
                      { id: "PAID", label: "Paid", count: invoices.filter(i => getInvoiceStatus(i) === "PAID").length },
                      { id: "OVERDUE", label: "Overdue", count: stats.overdueCount, isAlert: stats.overdueCount > 0 },
                      { id: "DUE_TODAY", label: "Due Today", count: stats.dueTodayCount },
                      { id: "DUE_THIS_WEEK", label: "Due This Week" },
                    ].map((tab) => {
                      const isActive = activeStatusFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveStatusFilter(tab.id as FilterTab);
                            setInvoicePage(1);
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                            isActive
                              ? "bg-primary text-white border-primary shadow-sm"
                              : tab.isAlert
                              ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                              : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/20 hover:bg-surface-container"
                          }`}
                        >
                          <span>{tab.label}</span>
                          {tab.count !== undefined && (
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                isActive
                                  ? "bg-white/20 text-white"
                                  : tab.isAlert
                                  ? "bg-red-200 text-red-800"
                                  : "bg-surface-container text-on-surface-variant"
                              }`}
                            >
                              {tab.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Table View / Empty States ── */}
                {filteredInvoices.length === 0 ? (
                  <div className="py-16 text-center bg-white p-8">
                    <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center mx-auto mb-3 text-on-surface-variant/40">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-on-surface">No invoices available.</h3>
                    <p className="text-xs text-on-surface-variant mt-1 mb-6 max-w-sm mx-auto">
                      Generate invoices from the Patient Clinical Workspace or adjust your active search and filter criteria.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {activeStatusFilter !== "All" || invoiceSearch ? (
                        <button
                          onClick={() => {
                            setActiveStatusFilter("All");
                            setInvoiceSearch("");
                          }}
                          className="px-4 py-2 text-xs font-semibold rounded-xl border border-outline-variant/30 text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                        >
                          Clear Filters & Search
                        </button>
                      ) : null}
                      <Link
                        href="/admin/patients"
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Users className="w-4 h-4" /> Go to Patients Directory
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container-lowest border-b border-outline-variant/15 text-[11px] uppercase font-bold text-on-surface-variant">
                          <th className="px-4 py-4 w-10 text-center">
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
                          <th className="px-2 py-4 w-8"></th>
                          <th className="px-4 py-4">Invoice ID</th>
                          <th className="px-4 py-4">Patient</th>
                          <th className="px-4 py-4 text-center">Date</th>
                          <th className="px-4 py-4 text-right">Gross Amount</th>
                          <th className="px-4 py-4 text-right font-bold text-emerald-700">Paid Amount</th>
                          <th className="px-4 py-4 text-right font-bold text-red-600">Remaining</th>
                          <th className="px-4 py-4 text-center">Status</th>
                          <th className="px-4 py-4 text-center">Due Date</th>
                          <th className="px-4 py-4 text-center">Payment Method</th>
                          <th className="px-4 py-4 text-right min-w-[200px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {paginatedInvoices.map((inv) => {
                          const patientObj = patients.find((p) => p.id === inv.patientId);
                          const patientPhone = patientObj ? patientObj.phone : "";
                          const patientName = patientObj ? patientObj.name : (inv.patientName || "Unknown Patient");
                          const invStatus = getInvoiceStatus(inv);
                          const statusDetails = getInvoiceStatusDetails(inv);
                          const isExpanded = !!expandedInvoices[inv.id];

                          const gross = inv.subtotal !== undefined ? inv.subtotal : (inv.grossAmount || inv.total || inv.amount || 0);
                          const net = inv.total !== undefined ? inv.total : (inv.netAmount || inv.amount || 0);
                          const paidAmt = inv.paidAmount || 0;
                          const remAmt = inv.remainingAmount !== undefined ? inv.remainingAmount : Math.max(0, net - paidAmt);
                          const dueDateStr = inv.dueDate || inv.invoiceDate;
                          const diffDays = getDiffDays(dueDateStr, todayDate);
                          const paymentMethodStr = getInvoicePaymentMethod(inv);

                          return (
                            <React.Fragment key={inv.id}>
                              <tr
                                className={`hover:bg-surface-container-low/30 transition-colors border-b border-outline-variant/10 cursor-pointer ${
                                  isExpanded ? "bg-slate-50/80" : ""
                                }`}
                                onClick={() => toggleInvoiceExpand(inv.id)}
                              >
                                <td className="px-4 py-5 text-center" onClick={(e) => e.stopPropagation()}>
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
                                <td className="px-2 py-5 text-center">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleInvoiceExpand(inv.id);
                                    }}
                                    className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant transition-transform duration-200 cursor-pointer flex items-center justify-center"
                                    style={{ transform: isExpanded ? "rotate(90deg)" : "none" }}
                                    title="Toggle Details"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                </td>
                                <td className="px-4 py-5 font-mono text-xs font-bold text-on-surface-variant whitespace-nowrap">
                                  #{inv.id.slice(0, 8).toUpperCase()}
                                </td>
                                <td className="px-4 py-5 font-bold text-on-surface min-w-[180px]">
                                  {patientPhone ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenPatientDetails(patientPhone, patientName);
                                      }}
                                      className="hover:underline text-left cursor-pointer font-bold text-sm text-on-surface border-none bg-transparent block"
                                    >
                                      <span>{patientName}</span>
                                      <span className="text-[11px] text-on-surface-variant font-mono block font-normal">
                                        {patientPhone}
                                      </span>
                                    </button>
                                  ) : (
                                    <div>
                                      <span className="text-sm font-bold block">{patientName}</span>
                                      <span className="text-[11px] text-on-surface-variant font-normal">No phone</span>
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-5 text-center text-xs text-on-surface-variant whitespace-nowrap font-medium">
                                  {inv.invoiceDate}
                                </td>
                                <td className="px-4 py-5 text-right font-mono text-xs font-semibold text-on-surface">
                                  ₹{formatINR(gross)}
                                </td>
                                <td className="px-4 py-5 text-right font-mono text-xs font-extrabold text-emerald-600">
                                  ₹{formatINR(paidAmt)}
                                </td>
                                <td className="px-4 py-5 text-right font-mono text-xs font-extrabold text-red-600">
                                  ₹{formatINR(remAmt)}
                                </td>
                                <td className="px-4 py-5 text-center whitespace-nowrap">
                                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusDetails.bgClass}`}>
                                    {statusDetails.label}
                                  </span>
                                </td>
                                <td className="px-4 py-5 text-center text-xs whitespace-nowrap">
                                  <span className="font-medium text-on-surface-variant block">{dueDateStr}</span>
                                  {invStatus !== "PAID" && diffDays < 0 && (
                                    <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                                      Overdue {Math.abs(diffDays)}d
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-5 text-center text-xs font-medium text-on-surface-variant whitespace-nowrap">
                                  {paymentMethodStr}
                                </td>
                                <td className="px-4 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1.5">
                                    {/* Primary CTA: Collect Payment */}
                                    {invStatus !== "PAID" && (
                                      <button
                                        onClick={() => {
                                          setPaymentInvoice(inv);
                                          setIsPaymentOpen(true);
                                        }}
                                        className="h-8 px-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer border-none flex items-center gap-1 shrink-0"
                                        title="Collect Payment"
                                      >
                                        <CreditCard className="w-3.5 h-3.5" />
                                        Collect Payment
                                      </button>
                                    )}

                                    {/* Send WhatsApp Reminder */}
                                    {patientPhone && invStatus !== "PAID" && (
                                      <a
                                        href={buildInvoiceWhatsAppUrl(patientPhone, patientName, inv)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-8 h-8 rounded-lg hover:bg-emerald-50 text-emerald-600 flex items-center justify-center cursor-pointer transition-colors border border-outline-variant/20 bg-white"
                                        title="Send WhatsApp Reminder"
                                      >
                                        <WhatsAppIcon className="w-4 h-4 fill-current" />
                                      </a>
                                    )}

                                    {/* Print invoice button */}
                                    <button
                                      onClick={() => handlePrintInvoice(inv.id)}
                                      className="w-8 h-8 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary flex items-center justify-center cursor-pointer border border-outline-variant/20 bg-white"
                                      title="Print / Download Invoice PDF"
                                    >
                                      <Printer className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Expandable breakdown row */}
                              {isExpanded && (
                                <tr className="bg-slate-50/90 animate-in fade-in duration-200">
                                  <td colSpan={12} className="px-6 py-5 border-b border-outline-variant/15">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                      {/* Column 1: Financial & Patient Summary */}
                                      <div className="lg:col-span-6 bg-white border border-outline-variant/15 rounded-xl p-5 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
                                          <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                                            <Receipt className="w-4 h-4" /> Invoice Financial Breakdown
                                          </span>
                                          <span className="font-mono text-[10px] text-on-surface-variant">
                                            ID: #{inv.id}
                                          </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-y-2.5 text-xs font-medium text-on-surface-variant">
                                          <div>Gross Subtotal:</div>
                                          <div className="text-right font-mono font-bold text-on-surface">
                                            ₹{formatINR(gross)}
                                          </div>

                                          <div>Discount Applied:</div>
                                          <div className="text-right font-mono font-bold text-red-500">
                                            -₹{formatINR(inv.discount !== undefined ? inv.discount : (inv.discountAmount || 0))}
                                          </div>

                                          <div>Tax (18% GST):</div>
                                          <div className="text-right font-mono font-bold text-on-surface">
                                            ₹{formatINR(inv.tax !== undefined ? inv.tax : (inv.taxAmount || 0))}
                                          </div>

                                          <div className="border-t border-outline-variant/10 pt-2 font-bold text-on-surface text-sm">
                                            Net Invoice Total:
                                          </div>
                                          <div className="border-t border-outline-variant/10 pt-2 text-right font-mono font-extrabold text-base text-primary">
                                            ₹{formatINR(net)}
                                          </div>

                                          <div className="border-t border-outline-variant/10 pt-2 text-[11px] text-emerald-600 font-semibold">
                                            Amount Paid:
                                          </div>
                                          <div className="border-t border-outline-variant/10 pt-2 text-right font-mono font-bold text-emerald-600 text-sm">
                                            ₹{formatINR(paidAmt)}
                                          </div>

                                          <div className="border-t border-outline-variant/10 pt-2 text-[11px] text-red-600 font-bold">
                                            Remaining Balance Due:
                                          </div>
                                          <div className="border-t border-outline-variant/10 pt-2 text-right font-mono font-black text-red-600 text-base">
                                            ₹{formatINR(remAmt)}
                                          </div>
                                        </div>

                                        {/* Action buttons inside drawer */}
                                        <div className="pt-3 border-t border-outline-variant/10 flex flex-wrap gap-2">
                                          {invStatus !== "PAID" && (
                                            <button
                                              onClick={() => {
                                                setPaymentInvoice(inv);
                                                setIsPaymentOpen(true);
                                              }}
                                              className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                                            >
                                              <CreditCard className="w-3.5 h-3.5" /> Collect Payment
                                            </button>
                                          )}
                                          <button
                                            onClick={() => handlePrintInvoice(inv.id)}
                                            className="px-3 py-2 border border-outline-variant/30 text-on-surface rounded-xl text-xs font-semibold hover:bg-surface-container transition-colors flex items-center gap-1.5 cursor-pointer bg-white"
                                          >
                                            <Printer className="w-3.5 h-3.5" /> Download / Print PDF
                                          </button>
                                          {patientPhone && (
                                            <a
                                              href={buildInvoiceWhatsAppUrl(patientPhone, patientName, inv)}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="px-3 py-2 border border-green-200 text-green-800 bg-green-50 rounded-xl text-xs font-semibold hover:bg-green-100 transition-colors flex items-center gap-1.5"
                                            >
                                              <WhatsAppIcon className="w-3.5 h-3.5 text-green-600 fill-current" /> WhatsApp Reminder
                                            </a>
                                          )}
                                        </div>
                                      </div>

                                      {/* Column 2: Payment History Timeline */}
                                      <div className="lg:col-span-6 bg-white border border-outline-variant/15 rounded-xl p-5 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
                                          <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                                            <Clock className="w-4 h-4" /> Payment History Timeline
                                          </span>
                                          <span className="text-[10px] text-on-surface-variant font-medium">
                                            Due: {dueDateStr}
                                          </span>
                                        </div>

                                        <div className="space-y-3 relative before:content-[''] before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/20 max-h-52 overflow-y-auto pr-1">
                                          {(() => {
                                            const history = inv.paymentHistory || [];
                                            const timeline = [...history];
                                            if (timeline.length === 0) {
                                              timeline.push({
                                                paymentDate: inv.invoiceDate,
                                                paymentMethod: "None",
                                                amountReceived: 0,
                                                paymentType: "Generated",
                                                notes: "Invoice Generated",
                                              });
                                            }
                                            return timeline.map((pay, idx) => (
                                              <div key={idx} className="relative pl-6 text-xs">
                                                <div
                                                  className={`absolute left-0 top-1 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${
                                                    pay.paymentType === "Generated"
                                                      ? "bg-slate-400"
                                                      : pay.paymentType === "Paid"
                                                      ? "bg-emerald-500"
                                                      : pay.paymentType === "Partial"
                                                      ? "bg-blue-500"
                                                      : "bg-amber-500"
                                                  }`}
                                                />
                                                <div className="flex justify-between items-start">
                                                  <span className="font-semibold text-on-surface">
                                                    {pay.paymentType === "Generated"
                                                      ? "Invoice Generated"
                                                      : `Received ₹${formatINR(pay.amountReceived)} via ${pay.paymentMethod}`}
                                                  </span>
                                                  <span className="text-[10px] text-on-surface-variant font-medium whitespace-nowrap">
                                                    {pay.paymentDate}
                                                  </span>
                                                </div>
                                                {pay.notes && (
                                                  <p className="text-[10px] text-on-surface-variant italic mt-0.5 font-normal">
                                                    Note: {pay.notes}
                                                  </p>
                                                )}
                                              </div>
                                            ));
                                          })()}
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

                {/* Pagination Controls */}
                {filteredInvoices.length > pageSize && (
                  <div className="px-6 py-4 border-t border-outline-variant/10 flex items-center justify-between gap-3 bg-surface-container-lowest">
                    <p className="text-xs text-on-surface-variant font-medium">
                      Showing Page <span className="font-semibold text-on-surface">{invoicePage}</span> · Invoices{" "}
                      {pageSize * (invoicePage - 1) + 1}–{pageSize * (invoicePage - 1) + paginatedInvoices.length} of{" "}
                      {filteredInvoices.length}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setInvoicePage((p) => Math.max(1, p - 1))}
                        disabled={invoicePage === 1}
                        className="p-1.5 rounded-lg border border-outline-variant/30 hover:bg-surface-container text-on-surface-variant disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer flex items-center justify-center bg-white"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setInvoicePage((p) => p + 1)}
                        disabled={!hasNextPage}
                        className="p-1.5 rounded-lg border border-outline-variant/30 hover:bg-surface-container text-on-surface-variant disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer flex items-center justify-center bg-white"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-outline-variant/20 px-4 md:px-8 py-4 mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
            <p>© 2024 Sanjivani Dentals. All rights reserved.</p>
            <div className="flex items-center gap-4 font-medium">
              <Link href="/#privacy" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/#hipaa" className="hover:text-primary transition-colors">
                HIPAA Compliance
              </Link>
              <Link href="/#accessibility" className="hover:text-primary transition-colors">
                Accessibility
              </Link>
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
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-on-surface">
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

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="bg-emerald-50/50 border border-emerald-100/50 p-4 rounded-xl text-xs text-emerald-800 space-y-1">
                <p className="font-bold flex items-center gap-1">💡 Tip for bulk sending</p>
                <p>
                  To send to multiple patients at once, allow pop-ups in your browser or click "Send" next to each patient row.
                </p>
              </div>

              <div className="border border-outline-variant/10 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-[10px] uppercase font-bold text-on-surface-variant border-b border-outline-variant/10">
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3 text-right">Remaining Due</th>
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
                      const invStatus = getInvoiceStatus(inv);
                      const amount = inv.remainingAmount !== undefined ? inv.remainingAmount : (inv.total || inv.amount || 0);
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
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                invStatus === "PAID"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : "bg-amber-50 text-amber-700 border border-amber-100"
                              }`}
                            >
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
            {Object.keys(selectedInvoiceIds).length}{" "}
            {Object.keys(selectedInvoiceIds).length === 1 ? "invoice" : "invoices"} selected
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

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-4 md:right-6 z-50 bg-on-surface text-surface text-sm font-medium px-4 py-3 rounded-xl shadow-level-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {toast}
        </div>
      )}

      {/* Payment Dialog */}
      <PaymentDialog
        invoice={paymentInvoice}
        isOpen={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false);
          setPaymentInvoice(null);
        }}
      />
    </div>
  );
}

export default function BillingPage() {
  return (
    <AdminAuthGuard>
      <BillingPageContent />
    </AdminAuthGuard>
  );
}
