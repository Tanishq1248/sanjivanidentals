"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  Calendar,
  Clock,
  Plus,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Trash2,
  Printer,
  Pill,
  Receipt,
  User,
  ArrowRight,
  Search,
  Filter,
  Share2,
  Activity,
  MoreVertical,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  Tag,
  Check,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../../lib/query/queryKeys";
import { getClinicSettings, getDoctorCredentials } from "../../../../lib/services/clinicSettingsService";
import { useActiveDoctors } from "../../../../lib/hooks/useDoctors";
import type {
  Patient,
  PatientEncounter,
  PatientMedicalProfile,
  EncounterStatus,
  Appointment,
  ToothTreatmentEntry,
  SurfaceType,
  ClinicSettingsData,
  Doctor,
} from "../../../../lib/types";

interface CasePaperTabProps {
  patient: Patient;
  medicalProfile?: PatientMedicalProfile | null;
  encounters: PatientEncounter[];
  isLoading: boolean;
  appointments?: Appointment[];
  onOpenAddEncounter: () => void;
  onOpenCasePaperSession?: (encounterId: string) => void;
  selectedBillingItems?: Record<string, boolean>;
  onToggleBillingItem?: (itemId: string) => void;
  isEncounterAllBillingSelected?: (encounter: PatientEncounter) => boolean;
  onToggleAllBillingItems?: (encounter: PatientEncounter) => void;
  calculateTotalFees?: (encounter: PatientEncounter) => number;
  getTeethNumbers?: (encounter: PatientEncounter) => number[];
  onStatusChange?: (id: string, status: EncounterStatus) => void;
  onToothTreatmentStatusChange?: (
    encounterId: string,
    treatmentId: string,
    status: "Planned" | "In Progress" | "Completed"
  ) => void;
  onEditEncounter: (encounter: PatientEncounter) => void;
  onDeleteEncounter: (id: string) => void;
  onPrescription: (encounter: PatientEncounter) => void;
  onInvoice: (encounter: PatientEncounter) => void;
  onPrint: () => void;
  formatVisitDate: (dateStr: string) => string;
  formatINR: (amount: any) => string;
  onSaveToothTreatment?: (
    toothNumber: number,
    treatmentData: {
      treatmentName: string;
      status: string;
      fee: number;
      notes?: string;
      surfaces?: SurfaceType[];
    }
  ) => Promise<void>;
  isSavingToothTreatment?: boolean;
  onOpenEditProfile?: () => void;
}

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export const CasePaperTab: React.FC<CasePaperTabProps> = ({
  patient,
  medicalProfile,
  encounters,
  isLoading,
  onOpenAddEncounter,
  onOpenCasePaperSession,
  onEditEncounter,
  onDeleteEncounter,
  onPrescription,
  onInvoice,
  onPrint,
  formatVisitDate,
  formatINR,
}) => {
  const router = useRouter();

  // Active Doctors List (Single Source of Truth from Settings > Team Members)
  const { doctors: doctorsList = [] } = useActiveDoctors();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Compute chronological order for numbering (earliest visit = #1, latest = #N)
  const chronologicalMap = useMemo(() => {
    const sorted = [...encounters].sort((a, b) =>
      (a.visitDate || "").localeCompare(b.visitDate || "")
    );
    const map = new Map<string, number>();
    sorted.forEach((enc, index) => {
      map.set(enc.id, enc.casePaperNumber || index + 1);
    });
    return map;
  }, [encounters]);

  // Filtered Encounters
  const filteredEncounters = useMemo(() => {
    return encounters.filter((enc) => {
      const matchesStatus =
        statusFilter === "all" ? true : enc.status === statusFilter;

      const searchLower = searchTerm.toLowerCase().trim();
      if (!searchLower) return matchesStatus;

      const matchesDoctor = (enc.doctorName || "").toLowerCase().includes(searchLower);
      const matchesDiagnosis = (enc.diagnosis || "").toLowerCase().includes(searchLower);
      const matchesComplaint = (enc.chiefComplaint || "").toLowerCase().includes(searchLower);
      const matchesTreatments = (enc.treatments || []).some((t) =>
        t.toLowerCase().includes(searchLower)
      );

      return matchesStatus && (matchesDoctor || matchesDiagnosis || matchesComplaint || matchesTreatments);
    });
  }, [encounters, statusFilter, searchTerm]);

  const handleOpenSession = (encounterId: string) => {
    if (onOpenCasePaperSession) {
      onOpenCasePaperSession(encounterId);
    } else {
      router.push(`/admin/patients/${patient.id}/case-paper/${encounterId}`);
    }
  };

  const { data: clinicSettings } = useQuery<ClinicSettingsData>({
    queryKey: queryKeys.settings.clinicInfo,
    queryFn: getClinicSettings,
    staleTime: 10 * 60 * 1000,
  });

  const generateWhatsAppShare = (enc: PatientEncounter, casePaperNum: number) => {
    const clinicName = clinicSettings?.clinicName || "Sanjivani Dental Clinic";
    const creds = getDoctorCredentials(clinicSettings, enc.doctorName);
    const text = encodeURIComponent(
      `Hello ${patient.name}, here is your clinical summary for Case Paper #${casePaperNum} at ${clinicName} on ${formatVisitDate(
        enc.visitDate
      )}. Doctor: ${creds.doctorName}. Diagnosis: ${enc.diagnosis || enc.chiefComplaint || "General Checkup"}. Status: ${enc.status}.`
    );
    return `https://wa.me/${patient.phone.replace(/[^0-9]/g, "")}?text=${text}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200 w-full max-w-full overflow-x-hidden" onClick={() => setActiveMenuId(null)}>
      
      {/* ═════════════════════════════════════════════════════════════════════
          1. CASE PAPER SUMMARY BAR & CONTROLS
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-outline-variant/15 p-3.5 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3.5 max-w-full min-w-0">
        
        {/* Left: Badge & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl border border-primary/20 shrink-0">
            <Stethoscope className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-sans truncate">
                Clinical Case Papers
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                {encounters.length} {encounters.length === 1 ? "Session" : "Sessions"}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5 truncate hidden sm:block">
              Comprehensive clinical encounter records, treatment plans, and diagnostic timeline.
            </p>
          </div>
        </div>

        {/* Right: Search, Filter & New Case Paper Button */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative col-span-2 sm:col-span-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search diagnosis, doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all shadow-2xs"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-primary cursor-pointer shadow-2xs w-full sm:w-auto"
          >
            <option value="all">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
          </select>

          {/* Primary Action: + New Case Paper */}
          <button
            onClick={onOpenAddEncounter}
            className="px-3 sm:px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 w-full sm:w-auto min-h-[38px] sm:min-h-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="truncate">+ New Case Paper</span>
          </button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          2. CASE PAPERS LIST / GRID OR EMPTY STATE
      ══════════════════════════════════════════════════════════════════════ */}
      {filteredEncounters.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center space-y-4 shadow-2xs">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto border border-primary/20">
            <Stethoscope className="w-7 h-7" />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-slate-900 font-sans">
              {searchTerm || statusFilter !== "all"
                ? "No matching case papers found"
                : "No case papers recorded yet"}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search terms or status filters."
                : "Start a new clinical session with an interactive 32-tooth odontogram, treatment kanban, and prescriptions."}
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onOpenAddEncounter}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs transition-all shadow-xs active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Case Paper</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:gap-4 max-w-full">
          {filteredEncounters.map((enc) => {
            const casePaperNumber = chronologicalMap.get(enc.id) || 1;
            const toothTreatmentsCount = enc.toothTreatments?.length || 0;
            const treatmentsCount = enc.treatments?.length || 0;
            const totalProcedures = toothTreatmentsCount > 0 ? toothTreatmentsCount : treatmentsCount;

            const totalFees = enc.toothTreatments?.reduce(
              (sum, tt) => sum + (tt.fee || 0),
              0
            ) || 0;

            const hasPrescription = !!enc.prescriptionId;
            const unbilledCount =
              enc.toothTreatments?.filter((tt) => tt.billingStatus !== "Billed").length || 0;

            // Extract chief complaints
            const complaints =
              enc.chiefComplaints && enc.chiefComplaints.length > 0
                ? enc.chiefComplaints
                : enc.chiefComplaint
                ? enc.chiefComplaint.split(",").map((s) => s.trim()).filter(Boolean)
                : ["General Checkup"];

            const isMenuOpen = activeMenuId === enc.id;

            return (
              <div
                key={enc.id}
                className="bg-white rounded-2xl border border-outline-variant/15 p-3.5 sm:p-5 shadow-2xs hover:shadow-sm hover:border-primary/40 transition-all space-y-3.5 sm:space-y-4 group max-w-full min-w-0 overflow-hidden"
              >
                {/* ── Top Row: Header & Status & Action Toolbar ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-3 border-b border-slate-100 max-w-full min-w-0">
                  
                  {/* Title & Status */}
                  <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 max-w-full">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary font-mono font-bold flex items-center justify-center text-xs sm:text-sm border border-primary/20 shrink-0 mt-0.5 sm:mt-0">
                      #{casePaperNumber}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 font-sans group-hover:text-primary transition-colors truncate">
                          Case Paper #{casePaperNumber}
                        </h3>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                            enc.status === "Completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : enc.status === "In Progress"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : enc.status === "Cancelled"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {enc.status}
                        </span>
                      </div>

                      {/* Date & Doctor */}
                      <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-xs text-slate-500 font-medium mt-1 min-w-0">
                        <span className="flex items-center gap-1 font-semibold text-slate-700 shrink-0">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          <span>{formatVisitDate(enc.visitDate)}</span>
                          {enc.visitTime && <span className="hidden sm:inline">at {enc.visitTime}</span>}
                        </span>
                        <span className="shrink-0">•</span>
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs max-w-full min-w-0">
                          <User className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-[10px] sm:text-[11px] text-slate-500 font-bold shrink-0">Doctor:</span>
                          <select
                            value={enc.doctorId || (doctorsList.find((d) => d.fullName === enc.doctorName)?.id || doctorsList[0]?.id || "doc-1")}
                            onChange={async (e) => {
                              const selectedDocId = e.target.value;
                              const selectedDoc = doctorsList.find((d) => d.id === selectedDocId);
                              if (selectedDoc && onEditEncounter) {
                                onEditEncounter({
                                  ...enc,
                                  doctorId: selectedDoc.id,
                                  doctorName: selectedDoc.fullName,
                                });
                              }
                            }}
                            className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer pr-1 hover:text-primary transition-colors truncate max-w-[130px] sm:max-w-[200px] md:max-w-none"
                            title="Change Assigned Doctor for this Case Paper"
                          >
                            {doctorsList.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.fullName}
                              </option>
                            ))}
                            {doctorsList.length === 0 && (
                              <option value="tm-1">{enc.doctorName || "Dr. Rajesh Sharma"}</option>
                            )}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Right Quick Actions: Wrapped toolbar */}
                  <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-auto relative pt-1 sm:pt-0">
                    <button
                      onClick={() => onPrescription(enc)}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs min-h-[36px] sm:min-h-0"
                      title="Issue Prescription"
                    >
                      <Pill className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Rx</span>
                    </button>

                    <button
                      onClick={() => onInvoice(enc)}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs min-h-[36px] sm:min-h-0"
                      title="Generate Invoice"
                    >
                      <Receipt className="w-3.5 h-3.5 text-blue-700" />
                      <span>Bill</span>
                    </button>

                    <a
                      href={generateWhatsAppShare(enc, casePaperNumber)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 sm:p-1.5 bg-[#dcfce7] hover:bg-green-200 text-green-900 rounded-xl transition-colors border border-green-300 shadow-2xs flex items-center justify-center min-h-[36px] sm:min-h-0 min-w-[36px] sm:min-w-0"
                      title="Share Summary on WhatsApp"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <WhatsAppIcon className="w-4 h-4 text-green-700" />
                    </a>

                    <button
                      onClick={onPrint}
                      className="p-2 sm:p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors cursor-pointer shadow-2xs flex items-center justify-center min-h-[36px] sm:min-h-0 min-w-[36px] sm:min-w-0"
                      title="Print Case Paper"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {/* Overflow dropdown trigger */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(isMenuOpen ? null : enc.id);
                      }}
                      className="p-2 sm:p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer shadow-2xs flex items-center justify-center min-h-[36px] sm:min-h-0 min-w-[36px] sm:min-w-0"
                      title="More actions"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Overflow Menu */}
                    {isMenuOpen && (
                      <div
                        className="absolute right-0 top-11 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-20 animate-in fade-in zoom-in-95 duration-150 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            onEditEncounter(enc);
                          }}
                          className="w-full px-3.5 py-2.5 sm:py-2 text-left hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <Pencil className="w-3.5 h-3.5 text-primary" />
                          <span>Edit Details</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            if (confirm(`Are you sure you want to delete Case Paper #${casePaperNumber}?`)) {
                              onDeleteEncounter(enc.id);
                            }
                          }}
                          className="w-full px-3.5 py-2.5 sm:py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer font-medium border-t border-slate-100"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          <span>Delete Case Paper</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Middle Row: Chief Complaints & Clinical Diagnosis ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs">
                  {/* Complaints Tags */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Chief Complaints:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {complaints.map((c, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-200 font-semibold text-[11px]"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Diagnosis & Clinical Summary */}
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Clinical Diagnosis &amp; Summary:
                    </span>
                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl font-medium text-slate-800 text-xs min-w-0">
                      <strong className="block truncate">{enc.diagnosis || "Routine Oral Screening"}</strong>
                      {enc.notes && (
                        <span className="text-slate-500 block text-[11px] mt-0.5 truncate">
                          {enc.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Bottom Row: Clinical Metrics Badges & Open Case Paper CTA ── */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Metrics Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
                    {/* Tooth Treatments Count */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 text-slate-800 rounded-xl font-semibold border border-slate-200 text-[11px]">
                      <Activity className="w-3.5 h-3.5 text-primary" />
                      <span>{totalProcedures} {totalProcedures === 1 ? "Procedure" : "Procedures"}</span>
                    </div>

                    {/* Fees / Billing Badge */}
                    {totalFees > 0 && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 text-indigo-900 rounded-xl font-bold border border-indigo-200 font-mono text-[11px]">
                        <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                        <span>₹{formatINR(totalFees)}</span>
                        {unbilledCount > 0 ? (
                          <span className="text-[9px] bg-amber-200 text-amber-900 px-1 py-0.2 rounded font-sans">
                            {unbilledCount} Unbilled
                          </span>
                        ) : (
                          <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1 py-0.2 rounded font-sans">
                            Billed
                          </span>
                        )}
                      </div>
                    )}

                    {/* Prescription Badge */}
                    {hasPrescription && (
                      <div className="flex items-center gap-1 px-2 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-[10px] sm:text-[11px] font-bold border border-emerald-200">
                        <Pill className="w-3 h-3 text-emerald-600" />
                        <span>Rx Prescribed</span>
                      </div>
                    )}
                  </div>

                  {/* Primary CTA: Open Case Paper (Full Width on Mobile with 44px touch target) */}
                  <button
                    onClick={() => handleOpenSession(enc.id)}
                    className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2.5 sm:py-2 bg-slate-900 hover:bg-primary text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer group/btn"
                  >
                    <span>Open Case Paper</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
