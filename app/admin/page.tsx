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
  LogOut,
  CheckCircle2,
  Activity,
  CreditCard,
  Clock,
  RefreshCw,
  ExternalLink,
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
} from "../../lib/services/appointmentService";
import { getInvoices } from "../../lib/services/invoiceService";
import { getPatientByPhone, getPatients, getFollowUpsDueThisWeek } from "../../lib/services/patientService";
import { PatientDetailsModal } from "../../components/admin/PatientDetailsModal";
import { queryKeys } from "../../lib/query/queryKeys";
import { TableSkeleton, CardListSkeleton, StatsCardSkeleton, useDelayLoading } from "../../components/ui/Skeletons";
import type {
  Patient,
  Appointment,
  AppointmentStatus,
  PatientEncounter,
} from "../../lib/types";
import { useSidebarStore } from "../../lib/store/useSidebarStore";
import { usePatientStore } from "../../lib/store/usePatientStore";
import { useDashboardStore } from "../../lib/store/useDashboardStore";

/* ─── Status Styles ─── */
const statusStyles: Record<string, string> = {
  Confirmed: "bg-blue-50 text-blue-700 border border-blue-200",
  Pending: "bg-amber-50 text-amber-700 border border-amber-200",
  "In Progress": "bg-amber-50 text-amber-700 border border-amber-200",
  Completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Cancelled: "bg-red-50 text-red-600 border border-red-200",
  Failed: "bg-red-50 text-red-600 border border-red-200",
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

function formatINR(amount: any): string {
  const val = Number(amount || 0);
  const hasPaise = val % 1 !== 0;
  return val.toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  });
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
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            currentPage === "appointments"
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
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            currentPage === "patients"
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
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            currentPage === "billing"
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
        className="w-10 h-10 rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer flex items-center justify-center border-none bg-transparent"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className={`absolute right-0 ${openUp ? "bottom-11" : "top-11"} z-40 bg-white rounded-lg shadow-lg border border-outline-variant/20 py-1 w-40`}>
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
              className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Follow-Up Widget ─── */
type FollowUpUrgency = "overdue" | "today" | "tomorrow" | "upcoming";

function getFollowUpUrgency(followUpDate: string): { label: string; urgency: FollowUpUrgency; daysAway: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = followUpDate.split("-").map(Number);
  const fDate = new Date(y, m - 1, d);
  fDate.setHours(0, 0, 0, 0);
  const diffMs = fDate.getTime() - today.getTime();
  const daysAway = Math.round(diffMs / 86_400_000);

  if (daysAway < 0)  return { label: `Overdue by ${Math.abs(daysAway)} day${Math.abs(daysAway) !== 1 ? "s" : ""}`, urgency: "overdue", daysAway };
  if (daysAway === 0) return { label: "Today", urgency: "today", daysAway };
  if (daysAway === 1) return { label: "Tomorrow", urgency: "tomorrow", daysAway };
  return { label: `In ${daysAway} days`, urgency: "upcoming", daysAway };
}

const URGENCY_STYLES: Record<FollowUpUrgency, { badge: string; dot: string }> = {
  overdue:  { badge: "bg-red-50 text-red-700 border border-red-200",    dot: "bg-red-500" },
  today:    { badge: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
  tomorrow: { badge: "bg-amber-50 text-amber-700 border border-amber-200",  dot: "bg-amber-500" },
  upcoming: { badge: "bg-blue-50 text-blue-700 border border-blue-200",    dot: "bg-blue-400" },
};

const URGENCY_ORDER: Record<FollowUpUrgency, number> = { overdue: 0, today: 1, tomorrow: 2, upcoming: 3 };

function FollowUpWidget({
  encounters,
  patients,
  onViewPatient,
}: {
  encounters: PatientEncounter[];
  patients: Patient[];
  onViewPatient: (patientId: string) => void;
}) {
  // Build patient lookup map for quick name resolution
  const patientMap = useMemo(() => {
    const m = new Map<string, Patient>();
    patients.forEach((p) => m.set(p.id, p));
    return m;
  }, [patients]);

  // Enrich and sort by urgency
  const rows = useMemo(() => {
    return encounters
      .filter((e) => e.followUpDate && e.followUpDate.length === 10)
      .map((e) => ({
        encounter: e,
        patient: patientMap.get(e.patientId) ?? null,
        urgencyInfo: getFollowUpUrgency(e.followUpDate!),
      }))
      .sort((a, b) => {
        const urgencyDiff = URGENCY_ORDER[a.urgencyInfo.urgency] - URGENCY_ORDER[b.urgencyInfo.urgency];
        if (urgencyDiff !== 0) return urgencyDiff;
        return a.encounter.followUpDate!.localeCompare(b.encounter.followUpDate!);
      });
  }, [encounters, patientMap]);

  return (
    <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-outline-variant/10 flex items-center justify-between">
        <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2 font-sans">
          <Clock className="w-4 h-4 text-amber-500" />
          Follow-ups This Week
        </h2>
        <span className="text-xs font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full font-sans">
          {rows.length} due
        </span>
      </div>

      {/* Body */}
      {rows.length === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface">All clear this week</p>
            <p className="text-xs text-on-surface-variant/70 mt-0.5 max-w-[180px]">
              No follow-ups are scheduled for the next 7 days.
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-outline-variant/10">
          {rows.map(({ encounter, patient, urgencyInfo }) => {
            const style = URGENCY_STYLES[urgencyInfo.urgency];
            const lastTreatment = encounter.treatments?.at(-1) ??
              encounter.toothTreatments?.at(-1)?.treatmentName ?? "Visit";
            const displayName = patient?.name ?? `Patient #${encounter.patientId.slice(0, 6)}`;

            return (
              <div key={encounter.id} className="px-4 py-3.5 hover:bg-surface-container-low/30 transition-colors">
                {/* Row top: name + badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">{displayName}</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 truncate">{lastTreatment}</p>
                    {encounter.doctorName && (
                      <p className="text-[10px] text-on-surface-variant/60 mt-0.5 truncate">Dr. {encounter.doctorName}</p>
                    )}
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${style.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    {urgencyInfo.label}
                  </span>
                </div>

                {/* Row bottom: date + actions */}
                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-[10px] text-on-surface-variant/60 font-mono">{encounter.followUpDate}</span>
                  <div className="flex items-center gap-1.5">
                    {/* View Patient */}
                    <button
                      onClick={() => onViewPatient(encounter.patientId)}
                      title="View Patient"
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:bg-primary/5 px-2 py-1 rounded-md transition-colors cursor-pointer"
                    >
                      <Users className="w-3 h-3" />
                      Patient
                    </button>
                    {/* Open Encounter */}
                    <Link
                      href={`/admin/patients/${encounter.patientId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open Encounter"
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-on-surface-variant hover:bg-surface-container px-2 py-1 rounded-md transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Encounter
                    </Link>
                    {/* FUTURE: WhatsApp / Email / SMS / Mark Done / Reschedule */}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── PhoneSearchBar — autocomplete with phone-first matching ─── */
function PhoneSearchBar({
  value,
  onChange,
  patients,
  className,
  inputClassName,
}: {
  value: string;
  onChange: (v: string) => void;
  patients: import("../../lib/types").Patient[];
  className?: string;
  inputClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Suggestions: phone-first, then name; max 6
  const isPhoneQuery = /^[\d\s+\-()]+$/.test(value.trim());
  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (q.length < 2) return [];
    const digits = q.replace(/\D/g, "");
    return patients
      .filter((p) => {
        const phoneDigits = p.phone.replace(/\D/g, "");
        if (digits && phoneDigits.includes(digits)) return true;
        if (p.name.toLowerCase().includes(q)) return true;
        return false;
      })
      .sort((a, b) => {
        // phone-prefix matches rank first
        const ad = a.phone.replace(/\D/g, "");
        const bd = b.phone.replace(/\D/g, "");
        const aPhone = digits ? ad.startsWith(digits) ? 0 : ad.includes(digits) ? 1 : 2 : 2;
        const bPhone = digits ? bd.startsWith(digits) ? 0 : bd.includes(digits) ? 1 : 2 : 2;
        return aPhone - bPhone;
      })
      .slice(0, 6);
  }, [value, patients]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function highlight(text: string, query: string) {
    if (!query) return <span>{text}</span>;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <span>{text}</span>;
    return (
      <span>
        {text.slice(0, idx)}
        <mark className="bg-amber-100 text-amber-800 rounded-sm px-0.5 not-italic">{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </span>
    );
  }

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      {/* Icon: phone if typing digits, else magnifier */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        {isPhoneQuery && value.trim().replace(/\D/g, "").length > 0
          ? <Phone className="w-4 h-4 text-primary" />
          : <Search className="w-4 h-4 text-on-surface-variant" />}
      </div>
      <input
        type="text"
        inputMode="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => value.trim().length >= 2 && setOpen(true)}
        placeholder="Search by phone, name, or service…"
        className={`w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-outline-variant/40 bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-on-surface-variant/60 ${inputClassName ?? ""}`}
      />

      {/* Autocomplete dropdown */}
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl border border-outline-variant/20 shadow-lg overflow-hidden">
          <div className="px-3 py-1.5 border-b border-outline-variant/10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Patients</span>
          </div>
          {suggestions.map((p) => {
            const qDigits = value.trim().replace(/\D/g, "");
            const phoneDigits = p.phone.replace(/\D/g, "");
            const phoneMatch = qDigits && phoneDigits.includes(qDigits);
            return (
              <button
                key={p.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange(p.phone); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-container-low transition-colors text-left"
              >
                <div className={`w-7 h-7 rounded-full ${p.avatarColor || "bg-primary"} flex items-center justify-center shrink-0`}>
                  <span className="text-white text-[10px] font-bold">
                    {p.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-on-surface truncate">
                    {highlight(p.name, value.trim())}
                  </p>
                  <p className={`text-[11px] font-mono ${phoneMatch ? "text-primary font-bold" : "text-on-surface-variant"}`}>
                    {phoneMatch ? highlight(p.phone, value.trim()) : p.phone}
                  </p>
                </div>
                {phoneMatch && (
                  <Phone className="w-3 h-3 text-primary shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Dashboard Component ─── */
function AdminDashboard() {
  const { logout, user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  // ── Zustand Store UI states ───────────────────────────────────────────────
  const { sidebarOpen, setSidebarOpen } = useSidebarStore();
  const { selectedPatient, isModalOpen, openPatientDetails, closePatientDetails } = usePatientStore();
  const { search, setSearch, toast, showToast } = useDashboardStore();
  const debouncedSearch = useDebounce(search, 400);

  // ── Live clock — updates every minute ─────────────────────────────────────
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  const formattedDate = useMemo(
    () =>
      now.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [now]
  );

  // 4. Pending billing invoices count (Pending or Failed)
  const { data: allInvoices = [] } = useQuery({
    queryKey: queryKeys.invoices.all,
    queryFn: getInvoices,
    staleTime: 2 * 60_000,
  });
  const pendingBillingCount = useMemo(
    () => allInvoices.filter((inv) => inv.paymentStatus === "Pending" || inv.paymentStatus === "Failed").length,
    [allInvoices]
  );

  // 5. Follow-ups due this week
  const { data: followUpEncounters = [] } = useQuery<PatientEncounter[]>({
    queryKey: queryKeys.encounters.followUpsDue,
    queryFn: getFollowUpsDueThisWeek,
    staleTime: 5 * 60_000, // 5 min — follow-up dates don't change frequently
  });
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  // ── Queries ──────────────────────────────────────────────────────────────
  // 1. Patients Registry
  const { data: patients = [], isLoading: isPatientsLoading } = useQuery<Patient[]>({
    queryKey: queryKeys.patients.all,
    queryFn: getPatients,
    staleTime: 2 * 60 * 1000,
  });

  // 2. Today's Appointments
  const { data: todayAppointments = [], isLoading: isApptsLoading } = useQuery<Appointment[]>({
    queryKey: ["appointments", "today"],
    queryFn: () => getAppointments("today"),
    staleTime: 60 * 1000,
  });

  // 3. Today's Encounters
  const { data: todayEncounters = [], isLoading: isTodayEncountersLoading } = useQuery<PatientEncounter[]>({
    queryKey: ["encounters", "today", todayStr],
    queryFn: async () => {
      const ref = collection(db, COLLECTIONS.PATIENT_ENCOUNTERS);
      const q = query(ref, where("visitDate", "==", todayStr));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PatientEncounter);
    },
    staleTime: 60 * 1000,
  });

  // ── Memoized Aggregations ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    // 1. Total Patients
    const totalPatientsCount = patients.length;

    // 2. Today's Appointments
    const totalTodayAppts = todayAppointments.length;
    const completedTodayAppts = todayAppointments.filter(a => a.status === "Completed").length;
    const pendingTodayAppts = todayAppointments.filter(a => a.status === "Pending").length;

    return {
      totalPatientsCount,
      totalTodayAppts,
      completedTodayAppts,
      pendingTodayAppts,
    };
  }, [patients, todayAppointments]);

  // Today's completed treatments mapping
  const todayCompletedTreatments = useMemo(() => {
    const list: Array<{ id: string; toothNumber: string; treatmentName: string; patientName: string; fee: number }> = [];
    const frequency: Record<string, number> = {};

    todayEncounters.forEach((enc) => {
      const patientObj = patients.find(p => p.id === enc.patientId);
      const patientName = patientObj ? patientObj.name : "Unknown Patient";

      if (enc.toothTreatments && enc.toothTreatments.length > 0) {
        enc.toothTreatments.forEach((tt) => {
          if (tt.status === "Completed") {
            list.push({
              id: tt.id,
              toothNumber: tt.toothNumber !== undefined ? String(tt.toothNumber) : "—",
              treatmentName: tt.treatmentName,
              patientName,
              fee: tt.fee || 0,
            });
            frequency[tt.treatmentName] = (frequency[tt.treatmentName] || 0) + 1;
          }
        });
      } else if (enc.treatments && enc.treatments.length > 0 && enc.status === "Completed") {
        const desc = enc.treatments.join(" • ");
        list.push({
          id: `manual-${enc.id}`,
          toothNumber: "—",
          treatmentName: desc,
          patientName,
          fee: 0,
        });
        enc.treatments.forEach(t => {
          frequency[t] = (frequency[t] || 0) + 1;
        });
      }
    });

    const frequencyChips = Object.entries(frequency)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { list, frequencyChips };
  }, [todayEncounters, patients]);

  // Filter & sort today's appointments — phone matches ranked first
  const filteredAppointments = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return [...todayAppointments].sort((a, b) => a.time.localeCompare(b.time));

    const digits = q.replace(/\D/g, "");

    type Scored = { appt: typeof todayAppointments[0]; score: number };
    const scored: Scored[] = todayAppointments
      .map((a) => {
        const phoneDigits = (a.patientPhone ?? "").replace(/\D/g, "");
        let score = 99;
        // Phone: prefix match = best (0), substring = 1, else fall to name/service
        if (digits && phoneDigits.startsWith(digits)) score = 0;
        else if (digits && phoneDigits.includes(digits)) score = 1;
        else if (a.patientName.toLowerCase().includes(q)) score = 2;
        else if (a.service.toLowerCase().includes(q)) score = 3;
        return { appt: a, score };
      })
      .filter((s) => s.score < 99);

    return scored
      .sort((a, b) => a.score - b.score || a.appt.time.localeCompare(b.appt.time))
      .map((s) => s.appt);
  }, [todayAppointments, debouncedSearch]);

  const recentPatients = useMemo(() => {
    return patients.slice(0, 10);
  }, [patients]);

  const isLoading = isPatientsLoading || isApptsLoading || isTodayEncountersLoading;
  const showSkeleton = useDelayLoading(isLoading, 300);

  // ── Appointment Mutation ───────────────────────────────────────────────────
  const appointmentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus | "__delete__" }) => {
      if (status === "__delete__") {
        await deleteAppointment(id);
      } else {
        await updateAppointmentStatus(id, status);
      }
      return { id, status };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: ["appointments", "today"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.appointmentCounts() });
    },
    onSuccess: (data) => {
      showToast(data.status === "__delete__" ? "Appointment deleted." : `Status updated to ${data.status}`);
    },
    onError: (err) => {
      console.error(err);
      showToast("Failed to update appointment.");
    },
  });

  const handleStatusChange = (id: string, status: AppointmentStatus | "__delete__") => {
    appointmentMutation.mutate({ id, status });
  };

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
          currentPage="appointments"
          onLogout={handleLogout}
          pendingBillingCount={pendingBillingCount}
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

          <div className="shrink-0">
            <h1 className="text-lg md:text-xl font-bold text-primary font-sans leading-tight">
              Clinic Dashboard
            </h1>
            <p className="text-[11px] font-medium text-on-surface-variant/70 mt-0.5 hidden sm:block">
              {formattedDate}
            </p>
          </div>

          {/* Search */}
          <PhoneSearchBar
            value={search}
            onChange={setSearch}
            patients={patients}
            className="flex-1 max-w-sm hidden sm:block ml-2"
          />

          {/* Profile */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-auto">
            <div className="text-right hidden lg:block">
              <p className="text-xs font-semibold text-on-surface leading-tight">
                Dr. {((user?.email?.split("@")[0] ?? "Admin").replace(/[^a-zA-Z\s]/g, " ").trim().split(/\s+/)[0] ?? "Admin").replace(/^./, (c) => c.toUpperCase())}
              </p>
              <p className="text-[10px] text-on-surface-variant/70">
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
          <PhoneSearchBar
            value={search}
            onChange={setSearch}
            patients={patients}
            inputClassName="bg-white py-2.5"
          />
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 space-y-6">
          {showSkeleton ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-8 space-y-6">
                  <TableSkeleton columns={5} rows={5} />
                </div>
                <div className="xl:col-span-4 space-y-6">
                  <CardListSkeleton count={4} />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ── SECTION 1: KPI CARDS ── */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4">

                {/* TODAY'S APPOINTMENTS — Hero card, spans 2 rows on the left */}
                <div className="md:row-span-2 bg-gradient-to-br from-purple-600 to-violet-700 rounded-2xl shadow-lg p-7 flex flex-col justify-between min-h-[180px] transition-transform hover:scale-[1.01] relative overflow-hidden">
                  {/* Decorative ring */}
                  <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
                  <div className="absolute -right-2 bottom-4 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />

                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <CalendarDays className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Today</span>
                  </div>

                  <div className="mt-4 space-y-1">
                    <span className="text-sm font-semibold text-white/70 block">Today's Appointments</span>
                    <span className="text-6xl font-extrabold text-white tracking-tight leading-none block">
                      {stats.totalTodayAppts}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-5">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-white/10 px-2.5 py-1 rounded-full">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                      </span>
                      {stats.completedTodayAppts} Done
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-white/10 px-2.5 py-1 rounded-full">
                      ⏳ {stats.pendingTodayAppts} Pending
                    </span>
                  </div>
                </div>

                {/* 1. Total Patients — secondary card */}
                <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-5 flex items-center justify-between transition-transform hover:scale-[1.01]">
                  <div className="space-y-1">
                    <span className="text-xs text-on-surface-variant font-medium block">Total Patients</span>
                    <span className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight block">
                      {stats.totalPatientsCount.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Live Registry
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                </div>

                {/* 3. Today's Treatments — secondary card */}
                <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-5 flex items-center justify-between transition-transform hover:scale-[1.01]">
                  <div className="space-y-1">
                    <span className="text-xs text-on-surface-variant font-medium block">Today's Completed Treatments</span>
                    <span className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight block">
                      {todayCompletedTreatments.list.length}
                    </span>
                    <div className="text-[10px] font-semibold text-primary uppercase">
                      Procedures logged today
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                </div>

              </div>

              {/* ── MAIN CONTENT GRID ── */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* LEFT COLUMN: Tables (col-span-8) */}
                <div className="xl:col-span-8 space-y-6">
                  
                  {/* SECTION 2: Today's Appointments Table */}
                  <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-outline-variant/10 flex items-center justify-between">
                      <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2 font-sans">
                        <CalendarDays className="w-4 h-4 text-primary" />
                        Today's Appointments
                      </h2>
                      <span className="text-xs font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full font-sans">
                        {filteredAppointments.length} Scheduled
                      </span>
                    </div>

                    {filteredAppointments.length === 0 ? (
                      <div className="py-14 flex flex-col items-center justify-center text-center gap-4">
                        {search ? (
                          /* ── No search results ── */
                          <>
                            <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center">
                              <CalendarDays className="w-7 h-7 text-on-surface-variant/40" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-on-surface">No matches found</p>
                              <p className="text-xs text-on-surface-variant/70 mt-1">
                                No appointments match &ldquo;<span className="font-medium text-on-surface">{search}</span>&rdquo;
                              </p>
                            </div>
                            <button
                              onClick={() => setSearch("")}
                              className="text-xs font-semibold text-primary underline underline-offset-2 hover:opacity-75 transition-opacity"
                            >
                              Clear search
                            </button>
                          </>
                        ) : (
                          /* ── Truly empty day ── */
                          <>
                            <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center shadow-sm">
                              <CalendarDays className="w-8 h-8 text-purple-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-on-surface">No appointments today</p>
                              <p className="text-xs text-on-surface-variant/70 mt-1 max-w-[220px]">
                                Your schedule is clear — fill it up by adding a new appointment.
                              </p>
                            </div>
                            <a
                              href="/book"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 bg-primary text-on-primary text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm hover:opacity-90 active:scale-[0.98] transition-all duration-150"
                            >
                              <span className="text-base leading-none">+</span>
                              Schedule Appointment
                            </a>
                          </>
                        )}
                      </div>

                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                          <thead>
                            <tr className="bg-surface-container border-b border-outline-variant/15 text-[11px] uppercase font-bold text-on-surface-variant">
                              <th className="px-5 py-4">Time</th>
                              <th className="px-5 py-4">Patient</th>
                              <th className="px-5 py-4">Phone</th>
                              <th className="px-5 py-4">Doctor</th>
                              <th className="px-5 py-4">Status</th>
                              <th className="px-5 py-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/10">
                            {filteredAppointments.map((apt, index) => (
                              <tr key={apt.id} className="hover:bg-surface-container-low/20 transition-colors">
                                <td className="px-5 py-5 font-bold text-on-surface whitespace-nowrap">
                                  {apt.time}
                                </td>
                                <td className="px-5 py-5 font-bold text-on-surface">
                                  <button
                                    onClick={() => handleOpenPatientDetails(apt.patientPhone, apt.patientName)}
                                    className="hover:underline text-left cursor-pointer bg-transparent border-none p-0 font-bold text-sm text-on-surface"
                                  >
                                    {apt.patientName}
                                  </button>
                                </td>
                                <td className="px-5 py-5 text-on-surface-variant font-semibold">
                                  {apt.patientPhone}
                                </td>
                                <td className="px-5 py-5 text-on-surface-variant font-semibold">
                                  {apt.doctorName || "Dr. Julian Moore"}
                                </td>
                                <td className="px-5 py-5">
                                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
                                    statusStyles[apt.status] || "bg-amber-50 text-amber-700 border-amber-200"
                                  }`}>
                                    {apt.status}
                                  </span>
                                </td>
                                <td className="px-5 py-5 text-right">
                                  <StatusDropdown
                                    currentStatus={apt.status}
                                    onStatusChange={(s) => handleStatusChange(apt.id, s)}
                                    openUp={index >= filteredAppointments.length - 2}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* SECTION 3: Today's Completed Treatments */}
                  <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-outline-variant/10">
                      <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2 mb-3 font-sans">
                        <Activity className="w-4 h-4 text-primary" />
                        Today's Completed Treatments
                      </h2>

                      {/* Summary Chips */}
                      {todayCompletedTreatments.frequencyChips.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {todayCompletedTreatments.frequencyChips.map((chip, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20"
                            >
                              {chip.name} ({chip.count})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {todayCompletedTreatments.list.length === 0 ? (
                      <div className="py-12 text-center text-on-surface-variant">
                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs font-semibold">No treatments completed today</p>
                        <p className="text-[10px] mt-0.5 text-on-surface-variant/75">
                          Treatments set to "Completed" in encounter logs will show up here
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                          <thead>
                            <tr className="bg-surface-container border-b border-outline-variant/15 text-[11px] uppercase font-bold text-on-surface-variant">
                              <th className="px-5 py-4 w-20 text-center">Tooth</th>
                              <th className="px-5 py-4">Treatment</th>
                              <th className="px-5 py-4">Patient</th>
                              <th className="px-5 py-4 text-right">Fee</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/10">
                            {todayCompletedTreatments.list.map((item) => (
                              <tr key={item.id} className="hover:bg-surface-container-low/20 transition-colors">
                                <td className="px-5 py-5 text-center text-on-surface-variant font-semibold">
                                  {item.toothNumber}
                                </td>
                                <td className="px-5 py-5 font-bold text-on-surface">
                                  {item.treatmentName}
                                </td>
                                <td className="px-5 py-5 text-on-surface font-bold">
                                  {item.patientName}
                                </td>
                                <td className="px-5 py-5 text-right font-bold text-on-surface font-mono">
                                  ₹{formatINR(item.fee)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </div>

                {/* RIGHT COLUMN: Sidebar Insights (col-span-4) */}
                <div className="xl:col-span-4 space-y-6">

                  {/* FOLLOW-UPS DUE THIS WEEK */}
                  <FollowUpWidget
                    encounters={followUpEncounters}
                    patients={patients}
                    onViewPatient={(patientId) => {
                      const p = patients.find((pt) => pt.id === patientId);
                      if (p) openPatientDetails(p);
                    }}
                  />
                  
                  {/* SECTION 5: Recent Patients Table */}
                  <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-outline-variant/10 flex items-center justify-between">
                      <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2 font-sans">
                        <Users className="w-4 h-4 text-primary" />
                        Recent Patients
                      </h2>
                    </div>

                    {recentPatients.length === 0 ? (
                      <div className="py-8 text-center text-on-surface-variant">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs font-semibold">No patients registered yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-outline-variant/10">
                        {recentPatients.map((pat) => (
                          <div
                            key={pat.id}
                            onClick={() => router.push(`/admin/patients/${pat.id}`)}
                            className="p-4 flex items-center gap-4 hover:bg-surface-container-low/40 transition-colors cursor-pointer"
                          >
                            <div className={`w-10 h-10 rounded-xl ${avatarColor(pat.name)} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                              {getInitials(pat.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline gap-2">
                                <span className="text-sm font-bold text-on-surface truncate block hover:underline">
                                  {pat.name}
                                </span>
                                <span className="text-xs text-on-surface-variant shrink-0 font-semibold">
                                  {pat.lastVisit ? `Visited: ${pat.lastVisit}` : "New"}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-xs text-on-surface-variant mt-1">
                                <span className="truncate font-medium">{pat.phone}</span>
                                {pat.condition && (
                                  <span className="font-bold text-primary truncate bg-primary/5 px-2 py-0.5 rounded border border-primary/10 text-xs">
                                    {pat.condition}
                                  </span>
                                )}
                              </div>
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
