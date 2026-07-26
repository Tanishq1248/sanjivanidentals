"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "../../../lib/hooks/useDebounce";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ChevronLeft,
  ChevronRight,
  Eye,
  CreditCard,
  MoreVertical,
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
import { REFERRAL_SOURCES } from "../../../lib/types";
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

function buildWhatsAppUrl(phone: string, name: string) {
  const digits = phone.replace(/\D/g, "");
  const message = encodeURIComponent(
    `Hello ${name}! 👋 This is Sanjivani Dentals. We hope you're doing well! We'd like to schedule your next appointment at your convenience. Please reply to this message to confirm a suitable date and time. Looking forward to seeing you! 😊\n\n– Sanjivani Dentals`
  );
  return `https://wa.me/${digits}?text=${message}`;
}

/* ─── Touch Target Optimized Actions Dropdown ─── */
function PatientActionDropdown({
  patient,
  onEdit,
  onDelete,
  openUp = false,
}: {
  patient: Patient;
  onEdit: (patient: Patient) => void;
  onDelete: (id: string) => void;
  openUp?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="relative flex items-center justify-end gap-3 shrink-0">
      {/* Primary Action 1: WhatsApp */}
      <a
        href={buildWhatsAppUrl(patient.phone, patient.name)}
        target="_blank"
        rel="noopener noreferrer"
        title={`WhatsApp ${patient.name}`}
        className="w-10 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-colors cursor-pointer text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>

      {/* Primary Action 2: Call */}
      <a
        href={`tel:${patient.phone.replace(/\D/g, "")}`}
        title={`Call ${patient.name}`}
        className="w-10 h-10 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors cursor-pointer text-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none"
      >
        <Phone className="w-4 h-4" />
      </a>

      {/* Primary Action 3: More Menu */}
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high flex items-center justify-center transition-colors cursor-pointer text-on-surface-variant focus:ring-2 focus:ring-primary/20 outline-none"
        title="More actions"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className={`absolute right-0 ${
              openUp ? "bottom-11" : "top-11"
            } z-40 bg-white rounded-xl shadow-lg border border-outline-variant/20 py-1.5 w-44`}
          >
            <button
              onClick={() => {
                router.push(`/admin/patients/${patient.id}`);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2 cursor-pointer border-none bg-transparent"
            >
              <Eye className="w-4 h-4 text-on-surface-variant" />
              View Profile
            </button>
            <button
              onClick={() => {
                onEdit(patient);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2 cursor-pointer border-none bg-transparent"
            >
              <Pencil className="w-4 h-4 text-on-surface-variant" />
              Edit Details
            </button>
            <div className="border-t border-outline-variant/10 my-1" />
            <button
              onClick={() => {
                onDelete(patient.id);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer border-none bg-transparent"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              Delete Record
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  age: "",
  gender: "",
  address: "",
  referralSource: "",
  referredByPatientId: "",
};
import { Sidebar } from "../../../components/admin/Sidebar";

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

  // ── Referral patient search state ────────────────────────────────────────
  const [referrerSearch, setReferrerSearch] = useState("");
  const [referrerName, setReferrerName] = useState("");
  const [showReferrerSuggestions, setShowReferrerSuggestions] = useState(false);

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

  // ── Patient list for referrer search (uses cached all-patients query) ──
  const { data: allPatientsForSearch = [] } = useQuery<Patient[]>({
    queryKey: queryKeys.patients.all,
    queryFn: getPatients,
    staleTime: 5 * 60_000,
  });

  const referrerSuggestions = React.useMemo(() => {
    const q = referrerSearch.trim().toLowerCase();
    if (q.length < 2) return [];
    const digits = q.replace(/\D/g, "");
    return allPatientsForSearch
      .filter((p) => {
        const phoneDigits = p.phone.replace(/\D/g, "");
        return (
          (digits && phoneDigits.includes(digits)) ||
          p.name.toLowerCase().includes(q)
        );
      })
      .slice(0, 6);
  }, [referrerSearch, allPatientsForSearch]);

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

  // ── Escape key event listener to close modal ─────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showForm) {
        handleCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showForm]);

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
      referralSource: p.referralSource || "",
      referredByPatientId: p.referredByPatientId || "",
    });
    
    // Find referrer name optimistically to show in UI chip
    if (p.referredByPatientId) {
      const refPatient = allPatientsForSearch.find((x) => x.id === p.referredByPatientId);
      setReferrerName(refPatient ? refPatient.name : "");
    } else {
      setReferrerName("");
    }
    
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
    setReferrerSearch("");
    setReferrerName("");
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
      <aside className="hidden md:flex w-[200px] shrink-0 border-r border-outline-variant/20 sticky top-0 h-screen shadow-sm flex-col bg-white">
        <Sidebar currentPage="patients" />
      </aside>

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[220px] shadow-level-2 transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          currentPage="patients"
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* ═══ MAIN ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-outline-variant/20 px-4 md:px-8 py-4 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-surface-variant text-primary shrink-0 cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-lg md:text-xl font-bold text-primary shrink-0">
            Patient Management
          </h1>

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

        <main className="flex-1 p-4 md:p-8">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm p-6 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Total Patients
                </p>
                <p className="text-3xl font-extrabold text-on-surface tracking-tight">
                  {isListLoading ? "—" : totalCount}
                </p>
                <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold mt-2 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Live Sync</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm p-6 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Search Results
                </p>
                <p className="text-3xl font-extrabold text-on-surface tracking-tight">
                  {isListLoading ? "—" : filtered.length}
                </p>
                <p className="text-xs text-on-surface-variant font-medium mt-2 bg-slate-50 px-2 py-0.5 rounded-md w-fit">
                  {search ? `Matching "${search}"` : "Showing all"}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center shrink-0">
                <UserPlus className="w-6 h-6 text-violet-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm p-6 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  WhatsApp Reachable
                </p>
                <p className="text-3xl font-extrabold text-on-surface tracking-tight">
                  {isListLoading ? "—" : totalCount}
                </p>
                <p className="text-xs text-on-surface-variant font-medium mt-2 bg-green-50 px-2 py-0.5 rounded-md w-fit text-green-700">
                  With phone numbers
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                <WhatsAppIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Full-width Patient Registry Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden flex flex-col"
          >
            {/* Header + Toolbar */}
            <div className="px-6 py-5 border-b border-outline-variant/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-on-surface">
                  Patient Registry
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {filtered.length} patient{filtered.length !== 1 ? "s" : ""} found
                </p>
              </div>
              <div className="flex flex-1 items-center gap-3 w-full md:max-w-xl md:justify-end">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/70" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search patients..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-outline-variant/30 bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-on-surface-variant/50"
                  />
                </div>
                <button
                  onClick={() => {
                    handleCancel();
                    setShowForm(true);
                  }}
                  className="flex items-center gap-2 text-sm text-white bg-primary font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/95 transition-all shadow-sm hover:shadow-md active:scale-95 cursor-pointer shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Add Patient</span>
                </button>
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
            ) : filtered.length === 0 ? (
              /* Better Empty State */
              <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-6 text-primary/40 border border-slate-100">
                  <Users className="w-12 h-12" />
                </div>
                <h3 className="text-lg font-bold text-on-surface mb-2">
                  Patients will appear here
                </h3>
                <p className="text-sm text-on-surface-variant max-w-sm mb-6 leading-relaxed">
                  Click Add Patient to create your first patient and start managing their treatments, appointments, and medical histories.
                </p>
                <button
                  onClick={() => {
                    handleCancel();
                    setShowForm(true);
                  }}
                  className="flex items-center gap-2 text-sm text-white bg-primary font-semibold px-5 py-3 rounded-xl hover:bg-primary/95 transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Add Patient</span>
                </button>
              </div>
            ) : (
              <>
                {/* Desktop Table with Sticky Header */}
                <div className="hidden md:block overflow-x-auto max-h-[60vh] scrollbar-thin">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-50 border-b border-outline-variant/10 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                      <tr>
                        <th className="text-left px-6 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider bg-slate-50">
                          Patient
                        </th>
                        <th className="text-left px-6 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider bg-slate-50">
                          Contact
                        </th>
                        <th className="text-left px-6 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider bg-slate-50">
                          Condition
                        </th>
                        <th className="text-left px-6 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider bg-slate-50">
                          Last Visit
                        </th>
                        <th className="text-right px-6 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider w-40 bg-slate-50">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((p, index) => (
                        <tr
                          key={p.id}
                          className={`border-b border-outline-variant/10 last:border-0 transition-colors h-[52px] ${
                            editingId === p.id
                              ? "bg-secondary-container/20"
                              : "hover:bg-surface-container-low/40"
                          }`}
                        >
                          <td className="px-6 py-2">
                            <div className="flex items-center gap-3">
                              <Link
                                href={`/admin/patients/${p.id}`}
                                className={`w-9 h-9 rounded-xl ${p.avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0 hover:opacity-90 active:scale-95 transition-all`}
                                title="View Patient Record"
                              >
                                {getInitials(p.name)}
                              </Link>
                              <div>
                                <Link
                                  href={`/admin/patients/${p.id}`}
                                  className="text-base font-semibold text-on-surface hover:text-primary hover:underline leading-tight block"
                                >
                                  {p.name}
                                </Link>
                                <p className="text-[13px] text-on-surface-variant font-medium mt-0.5">
                                  #{p.id.slice(0, 8)}
                                  {p.age ? ` · Age ${p.age}` : ""}
                                  {p.gender ? ` · ${p.gender}` : ""}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-2">
                            <p className="text-[15px] font-semibold text-on-surface leading-tight">
                              {p.phone}
                            </p>
                            <p className="text-[13px] text-on-surface-variant font-medium mt-0.5 truncate max-w-[180px]">
                              {p.email}
                            </p>
                          </td>
                          <td className="px-6 py-2">
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-secondary-container text-primary border border-primary/10">
                              {p.condition || "—"}
                            </span>
                            {p.notes && (
                              <p className="text-[13px] text-on-surface-variant mt-1 max-w-[180px] truncate font-medium">
                                {p.notes}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-2">
                            <p className="text-[15px] font-bold text-on-surface whitespace-nowrap">
                              {p.lastVisit || "—"}
                            </p>
                          </td>
                          <td className="px-6 py-2 text-right">
                            <PatientActionDropdown
                              patient={p}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              openUp={index >= filtered.length - 2}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card List */}
                <div className="md:hidden divide-y divide-outline-variant/10">
                  {filtered.map((p, index) => (
                    <div
                      key={p.id}
                      className={`px-4 py-5 ${
                        editingId === p.id ? "bg-secondary-container/20" : ""
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <Link
                          href={`/admin/patients/${p.id}`}
                          className={`w-11 h-11 rounded-xl ${p.avatarColor} flex items-center justify-center text-white text-sm font-bold shrink-0 hover:opacity-90 active:scale-95 transition-all`}
                          title="View Patient Record"
                        >
                          {getInitials(p.name)}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <Link
                                href={`/admin/patients/${p.id}`}
                                className="text-base font-bold text-on-surface hover:text-primary hover:underline leading-tight block"
                              >
                                {p.name}
                              </Link>
                              <p className="text-xs md:text-sm text-on-surface-variant font-medium mt-0.5">
                                #{p.id.slice(0, 8)}
                                {p.age ? ` · Age ${p.age}` : ""}
                                {p.gender ? ` · ${p.gender}` : ""}
                              </p>
                            </div>
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-secondary-container text-primary whitespace-nowrap shrink-0 border border-primary/10">
                              {p.condition || "—"}
                            </span>
                          </div>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm font-bold text-on-surface">
                              {p.phone}
                            </p>
                            <p className="text-xs md:text-sm text-on-surface-variant font-medium truncate">
                              {p.email}
                            </p>
                            {p.lastVisit && (
                              <p className="text-xs md:text-sm text-on-surface-variant font-semibold">
                                Last visit: {p.lastVisit}
                              </p>
                            )}
                          </div>
                          {/* Mobile Actions */}
                          <div className="mt-3.5 flex justify-end">
                            <PatientActionDropdown
                              patient={p}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              openUp={index >= filtered.length - 2}
                            />
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
          </motion.div>
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

      {/* Responsive Centered Modal Dialog for Add/Edit Patient */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={handleCancel}
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full md:h-auto md:max-h-[90vh] md:w-[70%] lg:w-[50%] xl:w-[45%] max-w-[800px] bg-white rounded-none md:rounded-2xl shadow-2xl overflow-y-auto flex flex-col z-10 border border-outline-variant/10"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between sticky top-0 bg-white z-20">
                <div>
                  <h2 className="text-lg font-bold text-on-surface">
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
                    type="button"
                    onClick={handleCancel}
                    className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Form Body */}
              <form
                onSubmit={handleSubmit}
                className="px-6 md:px-8 py-6 flex flex-col gap-4 overflow-y-auto"
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

                <div className="grid grid-cols-2 gap-4">
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

                {/* ── Referral Information ── */}
                <div className="border-t border-outline-variant/10 pt-4 mt-1">
                  <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    Referral Information
                  </h3>

                  {/* Referral Source */}
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                      How did this patient hear about us?
                    </label>
                    <select
                      name="referralSource"
                      value={form.referralSource ?? ""}
                      onChange={(e) => {
                        setForm({ ...form, referralSource: e.target.value, referredByPatientId: "" });
                        setReferrerSearch("");
                        setReferrerName("");
                      }}
                      className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="">— Select source (optional) —</option>
                      {REFERRAL_SOURCES.map((src) => (
                        <option key={src} value={src}>{src}</option>
                      ))}
                    </select>
                  </div>

                  {/* Referred By — only when source is Existing Patient */}
                  {form.referralSource === "Existing Patient" && (
                    <div className="relative">
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                        Referred By (search patient)
                      </label>
                      {form.referredByPatientId && referrerName ? (
                        /* Selected referrer chip */
                        <div className="flex items-center justify-between p-2.5 rounded-lg border border-primary/30 bg-primary/5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                              {referrerName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-on-surface truncate">{referrerName}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setForm({ ...form, referredByPatientId: "" });
                              setReferrerSearch("");
                              setReferrerName("");
                            }}
                            className="text-[10px] font-semibold text-on-surface-variant hover:text-red-600 shrink-0 ml-2 cursor-pointer"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant pointer-events-none" />
                            <input
                              type="text"
                              value={referrerSearch}
                              onChange={(e) => { setReferrerSearch(e.target.value); setShowReferrerSuggestions(true); }}
                              onFocus={() => referrerSearch.length >= 2 && setShowReferrerSuggestions(true)}
                              onBlur={() => setTimeout(() => setShowReferrerSuggestions(false), 150)}
                              placeholder="Search by name or phone…"
                              autoComplete="off"
                              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                          </div>
                          {showReferrerSuggestions && referrerSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-outline-variant/20 rounded-xl shadow-lg overflow-hidden">
                              {referrerSuggestions.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setForm({ ...form, referredByPatientId: p.id });
                                    setReferrerName(p.name);
                                    setReferrerSearch(p.name);
                                    setShowReferrerSuggestions(false);
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-container-low transition-colors text-left cursor-pointer"
                                >
                                  <div className={`w-7 h-7 rounded-full ${p.avatarColor} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                                    {p.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-on-surface truncate">{p.name}</p>
                                    <p className="text-[11px] font-mono text-on-surface-variant">{p.phone}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2 pb-1">
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Patient Details Modal */}
      <PatientDetailsModal
        patient={selectedPatient}
        isOpen={isModalOpen}
        onClose={closePatientDetails}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-4 md:right-6 z-50 bg-on-surface text-surface text-sm font-medium px-4 py-3 rounded-xl shadow-level-2 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
