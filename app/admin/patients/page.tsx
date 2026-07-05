"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "../../../lib/hooks/useDebounce";
import Link from "next/link";
import {
  Stethoscope,
  CalendarDays,
  Users,
  Search,
  UserPlus,
  TrendingUp,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Phone,
  Menu,
  LogOut,
  Loader2,
  Pill,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { AdminAuthGuard } from "../../../components/auth/AdminAuthGuard";
import { useAuth } from "../../../lib/context/AuthContext";
import {
  getPatients,
  addPatient,
  updatePatient,
  deletePatient,
  getPatientsPaginated,
  getPatientsCount,
  PAGE_SIZE,
} from "../../../lib/services/patientService";
import type { Patient, PatientFormData, PaginatedResult } from "../../../lib/types";
import { useSidebarStore } from "../../../lib/store/useSidebarStore";
import { usePatientStore } from "../../../lib/store/usePatientStore";
import { useDashboardStore } from "../../../lib/store/useDashboardStore";
import { queryKeys } from "../../../lib/query/queryKeys";
import { PatientDetailsModal } from "../../../components/admin/PatientDetailsModal";
import { TableSkeleton, CardListSkeleton, useDelayLoading } from "../../../components/ui/Skeletons";

/* ─── WhatsApp SVG Icon ─── */
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/* ─── Helpers ─── */
function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function buildWhatsAppUrl(phone: string, name: string) {
  const digits = phone.replace(/\D/g, "");
  const message = encodeURIComponent(
    `Hello ${name}! 👋 This is Sanjivani Dentals. We hope you're doing well! We'd like to schedule your next appointment at your convenience. Please reply to this message to confirm a suitable date and time. Looking forward to seeing you! 😊\n\n– Sanjivani Dentals`
  );
  return `https://wa.me/${digits}?text=${message}`;
}

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  age: "",
  gender: "",
  address: "",
};

/* ─── Sidebar ─── */
function Sidebar({
  onClose,
  onLogout,
}: {
  onClose?: () => void;
  onLogout: () => void;
}) {
  return (
    <aside className="w-full h-full bg-white flex flex-col">
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
      <nav className="flex flex-col gap-1 px-3 py-6 flex-grow">
        <Link
          href="/admin"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-secondary hover:bg-surface-container-low hover:text-on-surface"
        >
          <CalendarDays className="w-4 h-4 shrink-0" />
          Appointments
        </Link>
        <Link
          href="/admin/patients"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-secondary-container text-primary"
        >
          <Users className="w-4 h-4 shrink-0" />
          Patients
        </Link>
      </nav>
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

/* ─── Patients Page ─── */
function PatientsManagement() {
  const { logout, user } = useAuth();
  const queryClient = useQueryClient();

  // ── Zustand Store UI states ───────────────────────────────────────────────
  const { sidebarOpen, setSidebarOpen } = useSidebarStore();
  const { selectedPatient, isModalOpen, openPatientDetails, closePatientDetails } = usePatientStore();
  const { toast, showToast } = useDashboardStore();

  // ── Pagination cursor state (cursors are not serializable, so they stay here) ──
  const [currentPage, setCurrentPage] = useState(1);
  const [startAfterHistory, setStartAfterHistory] = useState<(any | null)[]>([null]);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  // Debounce the search string — Firestore queries fire only after the user
  // pauses typing for 400 ms, preventing per-keystroke read storms.
  const debouncedSearch = useDebounce(search, 400);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Patient list query ───────────────────────────────────────────────────
  const {
    data: patientListResult,
    isLoading: isListLoading,
  } = useQuery({
    queryKey: queryKeys.patients.list(currentPage, debouncedSearch),
    queryFn: async () => {
      if (debouncedSearch.trim() !== "") {
        // Search mode: fetch all for client-side filtering.
        const allPatients = await getPatients();
        return { data: allPatients, hasNext: false, lastVisible: null };
      }
      // Paginated mode: cursor lives in local state.
      const cursor = startAfterHistory[currentPage - 1] ?? null;
      return getPatientsPaginated(cursor, PAGE_SIZE);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Sync cursor history from query result (only for paginated, non-search pages).
  useEffect(() => {
    if (!patientListResult || debouncedSearch.trim() !== "") return;
    setHasNextPage(patientListResult.hasNext);
    if (patientListResult.lastVisible) {
      setStartAfterHistory((prev) => {
        const copy = [...prev];
        copy[currentPage] = patientListResult.lastVisible;
        return copy;
      });
    }
  }, [patientListResult, currentPage, debouncedSearch]);

  const patients: Patient[] = patientListResult?.data ?? [];

  // ── Patient count query ─────────────────────────────────────────────────
  const { data: totalCount = 0 } = useQuery({
    queryKey: queryKeys.patients.count(),
    queryFn: getPatientsCount,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const showSkeleton = useDelayLoading(isListLoading, 300);

  // ── Search: reset to page 1 whenever debounced search changes ───────────
  useEffect(() => {
    setCurrentPage(1);
    setStartAfterHistory([null]);
  }, [debouncedSearch]);

  const loadPage = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
  }, []);

  // ── Mutations ────────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: (data: PatientFormData) => addPatient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      showToast("Patient added successfully!");
      setForm(emptyForm);
      setShowForm(false);
      setCurrentPage(1);
      setStartAfterHistory([null]);
    },
    onError: () => showToast("Failed to add patient."),
    onSettled: () => setSubmitting(false),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PatientFormData> }) =>
      updatePatient(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.patients.list(currentPage, debouncedSearch) });
      await queryClient.cancelQueries({ queryKey: queryKeys.patients.byId(id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.patients.byPhone(data.phone ?? "") });

      // Snapshot previous caches
      const previousList = queryClient.getQueryData<PaginatedResult<Patient>>(
        queryKeys.patients.list(currentPage, debouncedSearch)
      );
      const previousDetails = queryClient.getQueryData<Patient>(queryKeys.patients.byId(id));

      // Optimistically update the list
      if (previousList) {
        queryClient.setQueryData(
          queryKeys.patients.list(currentPage, debouncedSearch),
          {
            ...previousList,
            data: previousList.data.map((p: Patient) =>
              p.id === id ? { ...p, ...data } : p
            ),
          }
        );
      }

      // Optimistically update details by ID
      if (previousDetails) {
        queryClient.setQueryData(queryKeys.patients.byId(id), {
          ...previousDetails,
          ...data,
        });
      }

      return { previousList, previousDetails, id };
    },
    onError: (err, variables, context) => {
      console.error("Update failed:", err);
      // Rollback to previous state
      if (context?.previousList) {
        queryClient.setQueryData(
          queryKeys.patients.list(currentPage, debouncedSearch),
          context.previousList
        );
      }
      if (context?.previousDetails) {
        queryClient.setQueryData(
          queryKeys.patients.byId(context.id),
          context.previousDetails
        );
      }
      showToast("Failed to save patient.");
    },
    onSuccess: () => {
      showToast("Patient details updated!");
      setEditingId(null);
      setForm(emptyForm);
      setShowForm(false);
    },
    onSettled: () => {
      setSubmitting(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePatient(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.patients.list(currentPage, debouncedSearch) });
      await queryClient.cancelQueries({ queryKey: queryKeys.patients.count() });

      // Snapshot previous caches
      const previousList = queryClient.getQueryData<PaginatedResult<Patient>>(
        queryKeys.patients.list(currentPage, debouncedSearch)
      );
      const previousCount = queryClient.getQueryData<number>(queryKeys.patients.count());

      // Optimistically remove from list
      if (previousList) {
        queryClient.setQueryData(
          queryKeys.patients.list(currentPage, debouncedSearch),
          {
            ...previousList,
            data: previousList.data.filter((p: Patient) => p.id !== id),
          }
        );
      }

      // Optimistically decrement count
      if (previousCount !== undefined) {
        queryClient.setQueryData(
          queryKeys.patients.count(),
          Math.max(0, (previousCount as number) - 1)
        );
      }

      return { previousList, previousCount };
    },
    onError: (err, id, context) => {
      console.error("Delete failed:", err);
      // Rollback
      if (context?.previousList) {
        queryClient.setQueryData(
          queryKeys.patients.list(currentPage, debouncedSearch),
          context.previousList
        );
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(
          queryKeys.patients.count(),
          context.previousCount
        );
      }
      showToast("Failed to delete patient.");
    },
    onSuccess: (_, deletedId) => {
      if (editingId === deletedId) {
        setEditingId(null);
        setForm(emptyForm);
        setShowForm(false);
      }
      showToast("Patient removed.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
    },
  });


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setSubmitting(true);
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form as PatientFormData });
    } else {
      addMutation.mutate(form as PatientFormData);
    }
  };

  const handleEdit = (p: Patient) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      phone: p.phone,
      email: p.email,
      age: p.age,
      gender: p.gender || "",
      address: p.address || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.phone.includes(debouncedSearch) ||
      p.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.condition.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen flex bg-[#f2f5f8] font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[200px] shrink-0 border-r border-outline-variant/20 sticky top-0 h-screen shadow-sm flex-col">
        <Sidebar onLogout={handleLogout} />
      </aside>

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[220px] shadow-level-2 transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />
      </div>

      {/* ═══ MAIN ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-outline-variant/20 px-4 md:px-8 py-4 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-surface-variant text-primary shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-lg md:text-xl font-bold text-primary shrink-0">
            Patient Management
          </h1>

          <div className="relative flex-1 max-w-sm hidden sm:block ml-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, condition..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-outline-variant/40 bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-on-surface-variant/60"
            />
          </div>

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

        {/* Mobile Search */}
        <div className="sm:hidden px-4 pt-3 pb-1 bg-[#f2f5f8]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patients..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-outline-variant/40 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-on-surface-variant/60"
            />
          </div>
        </div>

        <main className="flex-1 p-4 md:p-8">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 md:mb-8">
            <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-4 md:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-on-surface-variant font-medium mb-1">
                  Total Patients
                </p>
                <p className="text-2xl md:text-3xl font-bold text-on-surface">
                  {isListLoading ? "—" : totalCount}
                </p>
                <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold mt-0.5">
                  <TrendingUp className="w-3 h-3" />
                  <span>Live from database</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-secondary-container flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-4 md:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-on-surface-variant font-medium mb-1">
                  Search Results
                </p>
                <p className="text-2xl md:text-3xl font-bold text-on-surface">
                   {isListLoading ? "—" : filtered.length}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {search ? `Matching "${search}"` : "Showing all"}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#ede9fe] flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-4 md:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-on-surface-variant font-medium mb-1">
                  WhatsApp Reachable
                </p>
                <p className="text-2xl md:text-3xl font-bold text-on-surface">
                   {isListLoading ? "—" : totalCount}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  With phone numbers
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#dcfce7] flex items-center justify-center shrink-0">
                <WhatsAppIcon className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Patient Table / Cards */}
            <div className="xl:col-span-8 bg-white rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
              <div className="px-4 md:px-6 pt-5 pb-4 border-b border-outline-variant/10 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-on-surface">
                    Patient Registry
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {filtered.length} patient
                    {filtered.length !== 1 ? "s" : ""} found
                  </p>
                </div>
                <button
                  onClick={() => {
                    handleCancel();
                    setShowForm(true);
                  }}
                  className="flex items-center gap-1.5 text-sm text-primary font-semibold px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-secondary-container transition-colors cursor-pointer shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add New</span>
                </button>
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
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-on-surface-variant">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No patients found</p>
                  <p className="text-xs mt-1">
                    Try a different search or add a new patient
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-outline-variant/10 bg-surface-container-low/50">
                          <th className="text-left px-5 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                            Patient
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                            Condition
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                            Last Visit
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((p) => (
                          <tr
                            key={p.id}
                            className={`border-b border-outline-variant/10 last:border-0 transition-colors ${
                              editingId === p.id
                                ? "bg-secondary-container/20"
                                : "hover:bg-surface-container-low/40"
                            }`}
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <Link
                                  href={`/admin/patients/${p.id}`}
                                  className={`w-9 h-9 rounded-full ${p.avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0 hover:opacity-90 active:scale-95 transition-all`}
                                  title="View Patient Record"
                                >
                                  {getInitials(p.name)}
                                </Link>
                                <div>
                                  <Link
                                    href={`/admin/patients/${p.id}`}
                                    className="text-sm font-semibold text-on-surface hover:text-primary hover:underline leading-tight block"
                                  >
                                    {p.name}
                                  </Link>
                                  <p className="text-xs text-on-surface-variant">
                                    #{p.id.slice(0, 8)}
                                    {p.age ? ` · Age ${p.age}` : ""}
                                    {p.gender ? ` · ${p.gender}` : ""}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="text-xs font-medium text-on-surface">
                                {p.phone}
                              </p>
                              <p className="text-xs text-on-surface-variant truncate max-w-[140px]">
                                {p.email}
                              </p>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary-container text-primary">
                                {p.condition || "—"}
                              </span>
                              {p.notes && (
                                <p className="text-xs text-on-surface-variant mt-1 max-w-[140px] truncate">
                                  {p.notes}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="text-xs font-medium text-on-surface whitespace-nowrap">
                                {p.lastVisit || "—"}
                              </p>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1.5">
                                <Link
                                  href={`/admin/patients/${p.id}`}
                                  title="View Profile"
                                  className="w-8 h-8 rounded-lg bg-surface-container hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-colors cursor-pointer text-on-surface-variant"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Link>
                                <a
                                  href={buildWhatsAppUrl(p.phone, p.name)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={`WhatsApp ${p.name}`}
                                  className="w-8 h-8 rounded-lg bg-[#dcfce7] hover:bg-green-200 flex items-center justify-center transition-colors cursor-pointer group"
                                >
                                  <WhatsAppIcon className="w-4 h-4 text-green-600" />
                                </a>
                                <a
                                  href={`tel:${p.phone.replace(/\D/g, "")}`}
                                  title={`Call ${p.name}`}
                                  className="w-8 h-8 rounded-lg bg-secondary-container hover:bg-primary/10 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Phone className="w-3.5 h-3.5 text-primary" />
                                </a>
                                <Link
                                   href={`/admin/prescriptions/edit?patientId=${p.id}`}
                                   title="Prescription"
                                   className="w-8 h-8 rounded-lg bg-violet-50 hover:bg-violet-100 flex items-center justify-center transition-colors cursor-pointer"
                                 >
                                   <Pill className="w-3.5 h-3.5 text-violet-600" />
                                 </Link>
                                <button
                                  onClick={() => handleEdit(p)}
                                  title="Edit"
                                  className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-on-surface-variant hover:text-primary" />
                                </button>
                                <button
                                  onClick={() => handleDelete(p.id)}
                                  title="Delete"
                                  className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-on-surface-variant hover:text-red-500" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card List */}
                  <div className="md:hidden divide-y divide-outline-variant/10">
                    {filtered.map((p) => (
                      <div
                        key={p.id}
                        className={`px-4 py-4 ${
                          editingId === p.id ? "bg-secondary-container/20" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Link
                            href={`/admin/patients/${p.id}`}
                            className={`w-10 h-10 rounded-full ${p.avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0 hover:opacity-90 active:scale-95 transition-all`}
                            title="View Patient Record"
                          >
                            {getInitials(p.name)}
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <Link
                                  href={`/admin/patients/${p.id}`}
                                  className="text-sm font-semibold text-on-surface hover:text-primary hover:underline leading-tight block"
                                >
                                  {p.name}
                                </Link>
                                <p className="text-xs text-on-surface-variant">
                                  #{p.id.slice(0, 8)}
                                  {p.age ? ` · Age ${p.age}` : ""}
                                  {p.gender ? ` · ${p.gender}` : ""}
                                </p>
                              </div>
                              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary-container text-primary whitespace-nowrap shrink-0">
                                {p.condition || "—"}
                              </span>
                            </div>
                            <div className="mt-1.5 space-y-0.5">
                              <p className="text-xs text-on-surface">
                                {p.phone}
                              </p>
                              <p className="text-xs text-on-surface-variant truncate">
                                {p.email}
                              </p>
                              {p.lastVisit && (
                                <p className="text-xs text-on-surface-variant">
                                  Last visit: {p.lastVisit}
                                </p>
                              )}
                            </div>
                            {/* Mobile Actions */}
                            <div className="flex items-center gap-2 mt-2.5">
                              <Link
                                href={`/admin/patients/${p.id}`}
                                title="View Profile"
                                className="w-8 h-8 rounded-lg bg-surface-container hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-colors cursor-pointer text-on-surface-variant shrink-0"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                              <a
                                href={buildWhatsAppUrl(p.phone, p.name)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-[#dcfce7] px-2.5 py-1.5 rounded-lg"
                              >
                                <WhatsAppIcon className="w-3.5 h-3.5" />{" "}
                                WhatsApp
                              </a>
                              <a
                                href={`tel:${p.phone.replace(/\D/g, "")}`}
                                className="flex items-center gap-1 text-xs font-semibold text-primary bg-secondary-container px-2.5 py-1.5 rounded-lg"
                              >
                                <Phone className="w-3.5 h-3.5" /> Call
                              </a>
                              <Link
                                href={`/admin/prescriptions/edit?patientId=${p.id}`}
                                className="w-7 h-7 rounded-lg bg-violet-50 hover:bg-violet-100 flex items-center justify-center transition-colors cursor-pointer"
                                title="Prescription"
                              >
                                <Pill className="w-3.5 h-3.5 text-violet-600" />
                              </Link>
                              <button
                                onClick={() => handleEdit(p)}
                                className="w-7 h-7 rounded-lg hover:bg-surface-container flex items-center justify-center"
                              >
                                <Pencil className="w-3.5 h-3.5 text-on-surface-variant" />
                              </button>
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  {search.trim() === "" && (
                    <div className="px-4 md:px-6 py-4 border-t border-outline-variant/10 flex items-center justify-between gap-3 bg-surface-container-lowest">
                      <p className="text-xs text-on-surface-variant font-medium">
                        Showing Page <span className="font-semibold text-on-surface">{currentPage}</span> · Patients {PAGE_SIZE * (currentPage - 1) + 1}–{PAGE_SIZE * (currentPage - 1) + patients.length} of {totalCount}
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

            {/* Add / Edit Form */}
            <div
              className={`xl:col-span-4 ${
                showForm ? "block" : "hidden xl:block"
              }`}
            >
              <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm xl:sticky xl:top-24">
                <div className="px-4 md:px-6 pt-5 pb-4 border-b border-outline-variant/10 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-on-surface">
                      {editingId ? "Edit Patient" : "Add New Patient"}
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {editingId
                        ? `Editing #${editingId.slice(0, 8)}`
                        : "Fill in the patient details below"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        editingId ? "bg-amber-100" : "bg-secondary-container"
                      }`}
                    >
                      {editingId ? (
                        <Pencil className="w-4 h-4 text-amber-600" />
                      ) : (
                        <UserPlus className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <button
                      onClick={handleCancel}
                      className="xl:hidden p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="px-4 md:px-6 py-5 flex flex-col gap-3.5"
                >
                  <div>
                    <label
                      htmlFor="patient-name"
                      className="block text-xs font-semibold text-on-surface-variant mb-1.5"
                    >
                      Full Name *
                    </label>
                    <input
                      id="patient-name"
                      type="text"
                      name="name"
                      value={form.name ?? ""}
                      onChange={handleChange}
                      placeholder="e.g. Jane Smith"
                      required
                      autoComplete="off"
                      className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="patient-phone"
                      className="block text-xs font-semibold text-on-surface-variant mb-1.5"
                    >
                      WhatsApp / Phone *
                    </label>
                    <input
                      id="patient-phone"
                      type="tel"
                      name="phone"
                      value={form.phone ?? ""}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                      required
                      autoComplete="off"
                      className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="patient-email"
                      className="block text-xs font-semibold text-on-surface-variant mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="patient-email"
                      type="email"
                      name="email"
                      value={form.email ?? ""}
                      onChange={handleChange}
                      placeholder="jane@example.com"
                      autoComplete="off"
                      className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                   <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="patient-age"
                        className="block text-xs font-semibold text-on-surface-variant mb-1.5"
                      >
                        Age / DOB *
                      </label>
                      <input
                        id="patient-age"
                        type="text"
                        name="age"
                        value={form.age ?? ""}
                        onChange={handleChange}
                        placeholder="e.g. 34 or 1992-05-12"
                        required
                        className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                        Gender
                      </label>
                      <div className="flex gap-3 py-2">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-on-surface font-medium">
                          <input
                            type="radio"
                            name="gender"
                            value="Male"
                            checked={form.gender === "Male"}
                            onChange={handleChange}
                            className="w-3.5 h-3.5 text-primary focus:ring-primary/20 border-outline-variant/40 accent-primary"
                          />
                          Male
                        </label>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-on-surface font-medium">
                          <input
                            type="radio"
                            name="gender"
                            value="Female"
                            checked={form.gender === "Female"}
                            onChange={handleChange}
                            className="w-3.5 h-3.5 text-primary focus:ring-primary/20 border-outline-variant/40 accent-primary"
                          />
                          Female
                        </label>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-on-surface font-medium">
                          <input
                            type="radio"
                            name="gender"
                            value="Other"
                            checked={form.gender === "Other"}
                            onChange={handleChange}
                            className="w-3.5 h-3.5 text-primary focus:ring-primary/20 border-outline-variant/40 accent-primary"
                          />
                          Other
                        </label>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="patient-address"
                      className="block text-xs font-semibold text-on-surface-variant mb-1.5"
                    >
                      Address (Optional)
                    </label>
                    <input
                      id="patient-address"
                      type="text"
                      name="address"
                      value={form.address ?? ""}
                      onChange={handleChange}
                      placeholder="e.g. 123 Main St, New York"
                      autoComplete="off"
                      className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    {editingId && (
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="flex-1 border border-outline-variant/40 text-on-surface-variant text-sm font-semibold py-2.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`${
                        editingId ? "flex-1" : "w-full"
                      } bg-primary hover:bg-primary/90 disabled:bg-primary/60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.99]`}
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      {editingId ? "Save Changes" : "Add Patient"}
                    </button>
                  </div>
                  {form.phone && (
                    <a
                      href={buildWhatsAppUrl(
                        form.phone,
                        form.name || "Patient"
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-xs text-green-700 font-semibold bg-[#dcfce7] hover:bg-green-200 transition-colors py-2 rounded-lg cursor-pointer"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                      Preview appointment message on WhatsApp
                    </a>
                  )}
                </form>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-outline-variant/20 px-4 md:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
            <p>© 2024 Sanjivani Dentals. All rights reserved.</p>
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
export default function PatientsPage() {
  return (
    <AdminAuthGuard>
      <PatientsManagement />
    </AdminAuthGuard>
  );
}
