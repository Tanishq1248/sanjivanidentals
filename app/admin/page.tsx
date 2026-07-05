"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "../../lib/hooks/useDebounce";
import Image from "next/image";
import Link from "next/link";
import {
  Stethoscope,
  CalendarDays,
  Users,
  Search,
  MoreVertical,
  TrendingUp,
  Clock,
  UserPlus,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  LogOut,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { AdminAuthGuard } from "../../components/auth/AdminAuthGuard";
import { useAuth } from "../../lib/context/AuthContext";
import {
  getAppointments,
  updateAppointmentStatus,
  deleteAppointment,
  getAppointmentsPaginated,
  getAppointmentsCount,
  PAGE_SIZE,
} from "../../lib/services/appointmentService";
import { getPatientByPhone, addPatient, getPatients, getPatientsCount } from "../../lib/services/patientService";
import { PatientDetailsModal } from "../../components/admin/PatientDetailsModal";
import { queryKeys } from "../../lib/query/queryKeys";
import { TableSkeleton, CardListSkeleton, StatsCardSkeleton, useDelayLoading } from "../../components/ui/Skeletons";
import type {
  Patient,
  Appointment,
  AppointmentStatus,
  PatientFormData,
  PaginatedResult,
} from "../../lib/types";
import { useSidebarStore } from "../../lib/store/useSidebarStore";
import { usePatientStore } from "../../lib/store/usePatientStore";
import { useDashboardStore } from "../../lib/store/useDashboardStore";

/* ─── Types ─── */
type TabKey = "Today" | "Upcoming" | "History";

const statusStyles: Record<string, string> = {
  Confirmed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "In Progress": "bg-blue-50 text-blue-700 border border-blue-200",
  Pending: "bg-gray-100 text-gray-600 border border-gray-200",
  Cancelled: "bg-red-50 text-red-600 border border-red-200",
  Completed: "bg-violet-50 text-violet-700 border border-violet-200",
};

const statusOptions: AppointmentStatus[] = [
  "Pending",
  "Confirmed",
  "In Progress",
  "Completed",
  "Cancelled",
];

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
}: {
  currentPage: "appointments" | "patients";
  onClose?: () => void;
  onLogout: () => void;
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
            className="md:hidden p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant"
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
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            currentPage === "appointments"
              ? "bg-secondary-container text-primary"
              : "text-secondary hover:bg-surface-container-low hover:text-on-surface"
          }`}
        >
          <CalendarDays className="w-4 h-4 shrink-0" />
          Appointments
        </Link>
        <Link
          href="/admin/patients"
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            currentPage === "patients"
              ? "bg-secondary-container text-primary"
              : "text-secondary hover:bg-surface-container-low hover:text-on-surface"
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          Patients
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

/* ─── Status dropdown ─── */
function StatusDropdown({
  currentStatus,
  onStatusChange,
  openUp = false,
}: {
  currentStatus: string;
  onStatusChange: (status: AppointmentStatus) => void;
  openUp?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className={`absolute right-0 ${openUp ? "bottom-8" : "top-8"} z-40 bg-white rounded-lg shadow-lg border border-outline-variant/20 py-1 w-40`}>
            {statusOptions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  onStatusChange(s);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-surface-container-low transition-colors ${
                  s === currentStatus
                    ? "text-primary bg-secondary-container/30"
                    : "text-on-surface"
                }`}
              >
                {s}
              </button>
            ))}
            <div className="border-t border-outline-variant/10 my-1" />
            <button
              onClick={() => {
                onStatusChange("__delete__" as AppointmentStatus);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Admin Page ─── */
function AdminDashboard() {
  const { logout, user } = useAuth();
  const queryClient = useQueryClient();

  // ── Zustand Store UI states ───────────────────────────────────────────────
  const { sidebarOpen, setSidebarOpen } = useSidebarStore();
  const { selectedPatient, isModalOpen, openPatientDetails, closePatientDetails } = usePatientStore();
  const { activeTab, setActiveTab, search, setSearch, toast, showToast } = useDashboardStore();

  const [patient, setPatient] = useState({ name: "", phone: "", email: "", notes: "" });
  const debouncedSearch = useDebounce(search, 400);

  // Pagination cursor state (cursors are not serializable, so they stay in local state)
  const [currentPage, setCurrentPage] = useState(1);
  const [startAfterHistory, setStartAfterHistory] = useState<Record<TabKey, (any | null)[]>>({
    Today: [null],
    Upcoming: [null],
    History: [null],
  });
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalTabCount, setTotalTabCount] = useState(0);

  const tabToFilter = { Today: "today", Upcoming: "upcoming", History: "history" } as const;

  // ── Stats Query 1: Patient count (staleTime 5 min) ────────────────────
  const { data: totalPatients = 0 } = useQuery({
    queryKey: queryKeys.patients.count(),
    queryFn: getPatientsCount,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // ── Stats Query 2: Appointment counts (staleTime 2 min) ────────────────
  // All three count queries are batched into one Promise.all to stay efficient.
  const { data: apptCounts } = useQuery({
    queryKey: queryKeys.dashboard.appointmentCounts(),
    queryFn: async () => {
      const [todayCount, upcomingCount, todayPendingCount] = await Promise.all([
        getAppointmentsCount("today"),
        getAppointmentsCount("upcoming"),
        getAppointmentsCount("today-pending"),
      ]);
      return { todayCount, upcomingCount, todayPendingCount };
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const totalAppointments = (apptCounts?.todayCount ?? 0) + (apptCounts?.upcomingCount ?? 0);
  const pendingCount = apptCounts?.todayPendingCount ?? 0;
  const todayTotalCount = apptCounts?.todayCount ?? 0;

  // ── Appointments List Query (staleTime 1 min) ─────────────────────────
  // Key includes [tab, page, search] so the correct cached slice is served
  // automatically when the user switches tabs or navigates pages.
  const {
    data: apptListResult,
    isLoading: isListLoading,
  } = useQuery({
    queryKey: queryKeys.appointments.list(activeTab, currentPage, debouncedSearch),
    queryFn: async () => {
      const filter = tabToFilter[activeTab];
      if (debouncedSearch.trim() !== "") {
        const allApts = await getAppointments(filter);
        return { data: allApts, hasNext: false, lastVisible: null, totalCount: allApts.length };
      }
      const cursor = startAfterHistory[activeTab][currentPage - 1] ?? null;
      const result = await getAppointmentsPaginated(filter, cursor, PAGE_SIZE);
      // Tab total count: for Today/Upcoming use cached apptCounts; History needs a separate call.
      const tabTotal =
        activeTab === "Today"
          ? (apptCounts?.todayCount ?? 0)
          : activeTab === "Upcoming"
          ? (apptCounts?.upcomingCount ?? 0)
          : await getAppointmentsCount("history");
      return { ...result, totalCount: tabTotal };
    },
    staleTime: 60 * 1000,
    gcTime: 3 * 60 * 1000,
  });

  // Sync cursor history and tab count from query result.
  useEffect(() => {
    if (!apptListResult) return;
    setHasNextPage(apptListResult.hasNext);
    setTotalTabCount(apptListResult.totalCount);
    if (apptListResult.lastVisible && debouncedSearch.trim() === "") {
      setStartAfterHistory((prev) => {
        const next = { ...prev };
        next[activeTab] = [...next[activeTab]];
        next[activeTab][currentPage] = apptListResult.lastVisible;
        return next;
      });
    }
  }, [apptListResult, activeTab, currentPage, debouncedSearch]);

  const appointments: Appointment[] = apptListResult?.data ?? [];

  // Reset page when tab or search changes.
  useEffect(() => {
    setCurrentPage(1);
    setStartAfterHistory((prev) => ({ ...prev, [activeTab]: [null] }));
  }, [activeTab, debouncedSearch]);

  const isLoading = isListLoading;
  const showSkeleton = useDelayLoading(isLoading, 300);

  // ── Patient details modal ───────────────────────────────────────────
  // Uses queryClient.fetchQuery so the cache is checked first before Firestore.
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

  const loadPage = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Changing currentPage updates the query key, which triggers React Query
    // to fetch the new page (or serve from cache if already visited).
  }, []);

  const handlePatientChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setPatient({ ...patient, [e.target.name]: e.target.value });

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient.name || !patient.phone) return;
    try {
      const data: PatientFormData = {
        name: patient.name,
        phone: patient.phone,
        email: patient.email,
        age: "",
        lastVisit: "",
        condition: "",
        notes: patient.notes,
      };
      await addPatient(data);
      setPatient({ name: "", phone: "", email: "", notes: "" });
      // Invalidate all patient queries (both counts and registry list caches).
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      showToast("Patient added successfully!");
    } catch (err) {
      console.error("Failed to add patient:", err);
      showToast("Failed to add patient.");
    }
  };

  const appointmentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus | "__delete__" }) => {
      if (status === "__delete__") {
        await deleteAppointment(id);
      } else {
        await updateAppointmentStatus(id, status);
      }
      return { id, status };
    },
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.appointments.list(activeTab, currentPage, debouncedSearch) });
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard.appointmentCounts() });

      // Snapshot the previous query states
      const previousList = queryClient.getQueryData<PaginatedResult<Appointment> & { totalCount: number }>(
        queryKeys.appointments.list(activeTab, currentPage, debouncedSearch)
      );
      const previousCounts = queryClient.getQueryData<{
        todayCount: number;
        upcomingCount: number;
        todayPendingCount: number;
      }>(queryKeys.dashboard.appointmentCounts());

      // Optimistically update the list
      const apptToUpdate = previousList?.data?.find((a: Appointment) => a.id === id);
      const oldStatus = apptToUpdate?.status;
      const apptDate = apptToUpdate?.date;

      if (previousList) {
        let newListData = [...previousList.data];
        let newTotalCount = previousList.totalCount;

        if (status === "__delete__") {
          newListData = newListData.filter((a: Appointment) => a.id !== id);
          newTotalCount = Math.max(0, newTotalCount - 1);
        } else {
          newListData = newListData.map((a: Appointment) =>
            a.id === id ? { ...a, status: status as AppointmentStatus } : a
          );
        }

        queryClient.setQueryData(
          queryKeys.appointments.list(activeTab, currentPage, debouncedSearch),
          {
            ...previousList,
            data: newListData,
            totalCount: newTotalCount,
          }
        );
      }

      // Optimistically update dashboard appointment counts
      if (previousCounts && apptToUpdate) {
        let { todayCount, upcomingCount, todayPendingCount } = previousCounts;
        const today = new Date().toISOString().split("T")[0];

        if (status === "__delete__") {
          if (apptDate === today) {
            todayCount = Math.max(0, todayCount - 1);
            if (oldStatus === "Pending") {
              todayPendingCount = Math.max(0, todayPendingCount - 1);
            }
          } else if (apptDate && apptDate > today) {
            upcomingCount = Math.max(0, upcomingCount - 1);
          }
        } else {
          // Status updated (e.g. Pending -> Confirmed/Cancelled/Completed)
          if (apptDate === today) {
            if (oldStatus === "Pending" && status !== "Pending") {
              todayPendingCount = Math.max(0, todayPendingCount - 1);
            } else if (oldStatus !== "Pending" && status === "Pending") {
              todayPendingCount = todayPendingCount + 1;
            }
          }
        }

        queryClient.setQueryData(queryKeys.dashboard.appointmentCounts(), {
          todayCount,
          upcomingCount,
          todayPendingCount,
        });
      }

      // Return context for rollback
      return { previousList, previousCounts };
    },
    onError: (err, variables, context) => {
      console.error("Mutation failed:", err);
      // Rollback to previous snapshot values
      if (context?.previousList) {
        queryClient.setQueryData(
          queryKeys.appointments.list(activeTab, currentPage, debouncedSearch),
          context.previousList
        );
      }
      if (context?.previousCounts) {
        queryClient.setQueryData(
          queryKeys.dashboard.appointmentCounts(),
          context.previousCounts
        );
      }
      showToast(variables.status === "__delete__" ? "Failed to delete appointment." : "Failed to update status.");
    },
    onSuccess: (data) => {
      showToast(data.status === "__delete__" ? "Appointment deleted." : `Status updated to ${data.status}`);
    },
    onSettled: () => {
      // Invalidate queries to ensure sync with database
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.appointmentCounts() });
    },
  });

  const handleStatusChange = (
    id: string,
    status: AppointmentStatus | "__delete__"
  ) => {
    appointmentMutation.mutate({ id, status });
  };

  const handleLogout = async () => {
    await logout();
  };

  const tabs: TabKey[] = ["Today", "Upcoming", "History"];

  // Filter the current page's appointments by the debounced search term
  // so the displayed list stays consistent with the active query.
  const filteredAppointments = appointments.filter(
    (a) =>
      a.patientName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      a.service.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

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
          currentPage="appointments"
          onLogout={handleLogout}
        />
      </aside>

      {/* ── Mobile Sidebar Drawer ── */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[220px] shadow-level-2 transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          currentPage="appointments"
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />
      </div>

      {/* ═══ MAIN AREA ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-outline-variant/20 px-4 md:px-8 py-4 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-surface-variant text-primary shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-lg md:text-xl font-bold text-primary shrink-0">
            Admin Dashboard
          </h1>

          {/* Search */}
          <div className="relative flex-1 max-w-sm hidden sm:block ml-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search appointments..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-outline-variant/40 bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-on-surface-variant/60"
            />
          </div>

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

        {/* Mobile Search Bar */}
        <div className="sm:hidden px-4 pt-3 pb-1 bg-[#f2f5f8]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search appointments..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-outline-variant/40 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-on-surface-variant/60"
            />
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8">
          {/* ── Stats Row ── */}
           {showSkeleton ? (
             <div className="grid grid-cols-2 gap-4 mb-6 md:mb-8">
               <StatsCardSkeleton />
               <StatsCardSkeleton />
             </div>
           ) : (
             <div className="grid grid-cols-2 gap-4 mb-6 md:mb-8">
               {/* Total Patients */}
               <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-4 md:p-6 flex items-center justify-between">
                 <div>
                   <p className="text-xs md:text-sm text-on-surface-variant font-medium mb-1">
                     Total Patients
                   </p>
                   <p className="text-2xl md:text-4xl font-bold text-on-surface tracking-tight mb-1">
                     {totalPatients.toLocaleString()}
                   </p>
                   <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                     <TrendingUp className="w-3.5 h-3.5" />
                     <span className="hidden xs:inline">Live from database</span>
                     <span className="xs:hidden">Live</span>
                   </div>
                 </div>
                 <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-secondary-container flex items-center justify-center shrink-0">
                   <Users className="w-5 h-5 md:w-7 md:h-7 text-primary" />
                 </div>
               </div>

               {/* Appointments */}
               <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-4 md:p-6 flex items-center justify-between">
                 <div>
                   <p className="text-xs md:text-sm text-on-surface-variant font-medium mb-1">
                     Active Appointments
                   </p>
                   <p className="text-2xl md:text-4xl font-bold text-on-surface tracking-tight mb-1">
                     {totalAppointments}
                   </p>
                   <div className="flex items-center gap-1 text-on-surface-variant text-xs font-medium">
                     <Clock className="w-3.5 h-3.5 shrink-0" />
                     <span>{pendingCount} pending</span>
                   </div>
                 </div>
                 <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-[#ede9fe] flex items-center justify-center shrink-0">
                   <CalendarDays className="w-5 h-5 md:w-7 md:h-7 text-purple-600" />
                 </div>
               </div>
             </div>
           )}

          {/* ── Bottom Grid ── */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Appointments Table / Cards */}
            <div className="xl:col-span-12 bg-white rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-4 md:px-6 pt-5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/10">
                <h2 className="text-base md:text-lg font-bold text-on-surface">
                  Appointments
                </h2>
                {/* Tabs */}
                <div className="flex gap-1 bg-surface-container-low rounded-lg p-1 self-start sm:self-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${
                        activeTab === tab
                          ? "bg-white text-primary shadow-sm"
                          : "text-secondary hover:text-on-surface"
                      }`}
                    >
                      {tab}
                      {tab === "Today" && todayTotalCount > 0 && (
                        <span className="ml-1 text-xs opacity-60">
                          ({todayTotalCount})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {showSkeleton ? (
                <div>
                  <div className="hidden md:block">
                    <TableSkeleton columns={5} rows={5} />
                  </div>
                  <div className="md:hidden">
                    <CardListSkeleton count={4} />
                  </div>
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="py-16 text-center text-on-surface-variant">
                  <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No appointments found</p>
                  <p className="text-xs mt-1">
                    {search
                      ? "Try a different search term"
                      : `No ${activeTab.toLowerCase()} appointments`}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block max-h-[650px] overflow-y-auto overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead className="sticky top-0 bg-white z-10 shadow-sm">
                        <tr className="border-b border-outline-variant/10">
                          <th className="text-left px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                            Patient
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                            Service
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                            Time
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                            Status
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAppointments.map((apt, index) => (
                          <tr
                            key={apt.id}
                            className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-low/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  onClick={() => handleOpenPatientDetails(apt.patientPhone, apt.patientName)}
                                  className={`w-9 h-9 rounded-full ${avatarColor(
                                    apt.patientName
                                  )} flex items-center justify-center text-white text-xs font-bold shrink-0 cursor-pointer hover:opacity-90 active:scale-95 transition-all`}
                                  title="View Patient Record"
                                >
                                  {getInitials(apt.patientName)}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-on-surface leading-tight">
                                    {apt.patientName}
                                  </p>
                                  <p className="text-xs text-on-surface-variant">
                                    {apt.patientPhone}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <p className="text-sm text-on-surface">
                                {apt.service}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <p className="text-sm font-medium text-on-surface whitespace-nowrap">
                                {apt.date} · {apt.time}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  statusStyles[apt.status] || statusStyles.Pending
                                }`}
                              >
                                {apt.status}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <StatusDropdown
                                currentStatus={apt.status}
                                onStatusChange={(s) =>
                                  handleStatusChange(apt.id, s)
                                }
                                openUp={index >= filteredAppointments.length - 2}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card List */}
                  <div className="md:hidden divide-y divide-outline-variant/10 max-h-[650px] overflow-y-auto">
                    {filteredAppointments.map((apt, index) => (
                      <div key={apt.id} className="px-4 py-4 flex items-start gap-3">
                        <div
                          onClick={() => handleOpenPatientDetails(apt.patientPhone, apt.patientName)}
                          className={`w-9 h-9 rounded-full ${avatarColor(
                            apt.patientName
                          )} flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 cursor-pointer hover:opacity-90 active:scale-95 transition-all`}
                          title="View Patient Record"
                        >
                          {getInitials(apt.patientName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-on-surface leading-tight">
                                {apt.patientName}
                              </p>
                              <p className="text-xs text-on-surface-variant">
                                {apt.patientPhone}
                              </p>
                            </div>
                            <StatusDropdown
                              currentStatus={apt.status}
                              onStatusChange={(s) =>
                                handleStatusChange(apt.id, s)
                              }
                              openUp={index >= filteredAppointments.length - 2}
                            />
                          </div>
                          <p className="text-xs text-on-surface mt-1">
                            {apt.service}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                statusStyles[apt.status] || statusStyles.Pending
                              }`}
                            >
                              {apt.status}
                            </span>
                            <span className="text-xs text-on-surface-variant">
                              {apt.date} · {apt.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  {search.trim() === "" && (
                    <div className="px-4 md:px-6 py-4 border-t border-outline-variant/10 flex items-center justify-between gap-3 bg-surface-container-lowest">
                      <p className="text-xs text-on-surface-variant font-medium">
                        Showing Page <span className="font-semibold text-on-surface">{currentPage}</span> · Appointments {PAGE_SIZE * (currentPage - 1) + 1}–{PAGE_SIZE * (currentPage - 1) + appointments.length} of {totalTabCount}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => loadPage(currentPage - 1)}
                          disabled={currentPage === 1 || isListLoading}
                          className="p-1.5 rounded-lg border border-outline-variant/30 hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer flex items-center justify-center bg-white"
                          title="Previous Page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => loadPage(currentPage + 1)}
                          disabled={!hasNextPage || isListLoading}
                          className="p-1.5 rounded-lg border border-outline-variant/30 hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer flex items-center justify-center bg-white"
                          title="Next Page"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Patient Registry Panel */}
            {/* <div className="xl:col-span-4 bg-white rounded-xl border border-outline-variant/10 shadow-sm">
              <div className="px-4 md:px-6 pt-5 pb-4 border-b border-outline-variant/10 flex items-center justify-between">
                <h2 className="text-base md:text-lg font-bold text-on-surface">
                  Quick Patient Add
                </h2>
                <div className="w-9 h-9 rounded-lg bg-secondary-container flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
              </div>

              <form
                onSubmit={handleAddPatient}
                className="px-4 md:px-6 py-5 flex flex-col gap-4"
              >
                <div>
                  <label
                    htmlFor="reg-name"
                    className="block text-xs font-semibold text-on-surface-variant mb-1.5"
                  >
                    Full Name *
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    name="name"
                    value={patient.name}
                    onChange={handlePatientChange}
                    placeholder="John Doe"
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="reg-phone"
                    className="block text-xs font-semibold text-on-surface-variant mb-1.5"
                  >
                    Phone Number *
                  </label>
                  <input
                    id="reg-phone"
                    type="tel"
                    name="phone"
                    value={patient.phone}
                    onChange={handlePatientChange}
                    placeholder="+1 (555) 000-0000"
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="reg-email"
                    className="block text-xs font-semibold text-on-surface-variant mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    name="email"
                    value={patient.email}
                    onChange={handlePatientChange}
                    placeholder="john.doe@example.com"
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="reg-notes"
                    className="block text-xs font-semibold text-on-surface-variant mb-1.5"
                  >
                    Notes
                  </label>
                  <textarea
                    id="reg-notes"
                    name="notes"
                    value={patient.notes}
                    onChange={handlePatientChange}
                    placeholder="Clinical history notes..."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg transition-colors text-sm active:scale-[0.99] cursor-pointer mt-1"
                >
                  Add New Patient
                </button>
              </form>
            </div> */}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-outline-variant/20 px-4 md:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
            <p>
              © 2024 Sanjivani Dentals. All rights reserved.
            </p>
            <div className="flex items-center gap-4 font-medium">
              <Link
                href="/#privacy"
                className="hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/#hipaa"
                className="hover:text-primary transition-colors"
              >
                HIPAA Compliance
              </Link>
              <Link
                href="/#accessibility"
                className="hover:text-primary transition-colors"
              >
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

/* ─── Export wrapped with AuthGuard ─── */
export default function AdminPage() {
  return (
    <AdminAuthGuard>
      <AdminDashboard />
    </AdminAuthGuard>
  );
}
