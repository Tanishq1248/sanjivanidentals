"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Stethoscope,
  Activity,
  Calendar,
  Clock,
  Plus,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Trash2,
  Printer,
  FileCheck,
  UploadCloud,
  Pill,
  Receipt,
  Package,
  Layers,
  Sparkles,
  User,
  ShieldAlert,
  Check,
  X,
  Loader2,
  Share2,
  Phone,
  Tag,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Building2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../../lib/query/queryKeys";
import {
  getClinicSettings,
  formatClinicAddress,
  getDoctorCredentials,
} from "../../../../lib/services/clinicSettingsService";
import { DentalChart } from "../../../dental-chart/DentalChart";
import { ToothDetailPanel } from "../../../dental-chart/ToothDetailPanel";
import { PrescriptionModal } from "../../encounters/PrescriptionModal";
import { useActiveDoctors } from "../../../../lib/hooks/useDoctors";
import { useDentalChartStore } from "../../../../lib/store/useDentalChartStore";
import type {
  Patient,
  PatientEncounter,
  PatientMedicalProfile,
  EncounterStatus,
  ToothTreatmentEntry,
  SurfaceType,
  Doctor,
  ClinicSettingsData,
} from "../../../../lib/types";
import { getTreatmentStatus } from "../../../../lib/types";

interface LabOrder {
  id: string;
  labName: string;
  prosthesisType: string;
  toothNumber?: number;
  shade: string;
  impressionDate: string;
  dueDate: string;
  status: "Sent to Lab" | "In Fabrication" | "Ready for Fit" | "Delivered";
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
}

interface KanbanTreatmentItem {
  id: string;
  encounterId: string;
  toothNumber?: number;
  surfaces?: SurfaceType[];
  procedure: string;
  diagnosis?: string;
  assignedDoctor: string;
  fee: number;
  date: string;
  status: "Planned" | "In Progress" | "Completed";
  billingStatus: "Billed" | "Unbilled";
  notes?: string;
}

interface CasePaperSessionViewProps {
  patient: Patient;
  medicalProfile?: PatientMedicalProfile | null;
  encounter: PatientEncounter;
  allEncounters?: PatientEncounter[];
  casePaperNumber: number;
  onUpdateEncounter: (id: string, data: Partial<PatientEncounter>) => Promise<void>;
  onSaveToothTreatment: (
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
  onOpenInvoice?: (encounter: PatientEncounter) => void;
  doctors?: Doctor[];
}

function formatINR(amount: any): string {
  const val = Number(amount || 0);
  const hasPaise = val % 1 !== 0;
  return val.toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr + (dateStr.includes("T") ? "" : "T00:00:00"));
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export const CasePaperSessionView: React.FC<CasePaperSessionViewProps> = ({
  patient,
  medicalProfile,
  encounter,
  allEncounters,
  casePaperNumber,
  onUpdateEncounter,
  onSaveToothTreatment,
  isSavingToothTreatment = false,
  onOpenInvoice,
  doctors = [],
}) => {
  const router = useRouter();
  const { doctors: activeDoctors = [] } = useActiveDoctors();
  const availableDoctors = doctors && doctors.length > 0 ? doctors : activeDoctors;
  const { syncEncounters, selectedTooth, closeTooth } = useDentalChartStore();

  // Sync dental chart store with encounters
  const resolvedEncounters = useMemo(
    () => (allEncounters && allEncounters.length > 0 ? allEncounters : [encounter]),
    [allEncounters, encounter]
  );

  useEffect(() => {
    syncEncounters(resolvedEncounters);
  }, [resolvedEncounters, syncEncounters]);

  // Status state
  const [currentStatus, setCurrentStatus] = useState<EncounterStatus>(encounter.status || "In Progress");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Prescription modal
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);

  // Mobile Kanban Tab Selection (Planned, In Progress, Completed)
  const [mobileKanbanTab, setMobileKanbanTab] = useState<"planned" | "in_progress" | "completed">("planned");

  // Collapsible Accordion States for Mobile Ancillary Modules
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    lab: true,
    rx: true,
    scans: true,
    consumables: true,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // ─── Examination Tags State ───
  const initialComplaints =
    encounter.chiefComplaints && encounter.chiefComplaints.length > 0
      ? encounter.chiefComplaints
      : encounter.chiefComplaint
      ? encounter.chiefComplaint.split(",").map((s) => s.trim()).filter(Boolean)
      : ["Tooth Sensitivity", "Pain on Chewing #14"];

  const [chiefComplaints, setChiefComplaints] = useState<string[]>(initialComplaints);
  const [medicalTags, setMedicalTags] = useState<string[]>([
    medicalProfile?.chronicDiseases && medicalProfile.chronicDiseases !== "None"
      ? medicalProfile.chronicDiseases
      : "No Chronic Illness",
  ]);
  const [dentalHistoryTags, setDentalHistoryTags] = useState<string[]>([
    "RCT #14 Completed 2024",
    "Routine Scaling done 6mo ago",
  ]);
  const [allergyTags, setAllergyTags] = useState<string[]>([
    medicalProfile?.allergies ? medicalProfile.allergies : "No Known Drug Allergies",
  ]);

  const [newTagInput, setNewTagInput] = useState<{ category: string; value: string } | null>(null);

  // ─── Chart Mode Sub-Selectors ───
  const [chartMode, setChartMode] = useState<"dental" | "soft-tissue" | "tmj">("dental");

  // ─── Ancillary Module States (Lab Orders, Consumables, Notes) ───
  const [labOrders, setLabOrders] = useState<LabOrder[]>([
    {
      id: "lab-1",
      labName: "Apex Dental Ceramics Lab",
      prosthesisType: "Zirconia Crown",
      toothNumber: 14,
      shade: "A2 VITA 3D",
      impressionDate: encounter.visitDate || "2026-08-14",
      dueDate: "2026-08-21",
      status: "In Fabrication",
    },
  ]);
  const [isNewLabModalOpen, setIsNewLabModalOpen] = useState(false);
  const [newLabForm, setNewLabForm] = useState({
    labName: "Apex Dental Ceramics Lab",
    prosthesisType: "Zirconia Crown",
    toothNumber: "14",
    shade: "A2",
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
  });

  const [sessionNotes, setSessionNotes] = useState<string>(
    encounter.notes ||
      "Refined observations: Patient presented with localized sensitivity. Local anesthesia administered. Access cavity prepared under rubber dam isolation."
  );
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesToast, setNotesToast] = useState<string | null>(null);

  // Consumables used in this session
  const [consumablesUsed, setConsumablesUsed] = useState<InventoryItem[]>([
    {
      id: "c-1",
      name: "Lignocaine 2% with Adrenaline Cartridge",
      category: "Anesthetic",
      quantity: 2,
      unit: "Cartridges",
    },
    {
      id: "c-2",
      name: "Composite Syringe 3M Filtek Z250 (A2)",
      category: "Restorative",
      quantity: 1,
      unit: "Dose",
    },
    {
      id: "c-3",
      name: "Dental Dam Rubber Sheet (Latex Free)",
      category: "Isolation",
      quantity: 1,
      unit: "Sheet",
    },
  ]);
  const [isConsumableModalOpen, setIsConsumableModalOpen] = useState(false);
  const [newConsumableName, setNewConsumableName] = useState("");
  const [newConsumableQty, setNewConsumableQty] = useState(1);

  // ─── Extract All Treatments into Kanban Items ───
  const sessionTreatments: KanbanTreatmentItem[] = useMemo(() => {
    const items: KanbanTreatmentItem[] = [];

    // 1. Tooth Treatments
    if (encounter.toothTreatments && encounter.toothTreatments.length > 0) {
      encounter.toothTreatments.forEach((tt) => {
        items.push({
          id: tt.id,
          encounterId: encounter.id,
          toothNumber: tt.toothNumber,
          surfaces: tt.surfaces,
          procedure: tt.treatmentName,
          diagnosis: tt.diagnosis || encounter.diagnosis || "Dental Caries",
          assignedDoctor: tt.doctorName || encounter.doctorName || "Dr. Rajesh Sharma",
          fee: tt.fee || 0,
          date: encounter.visitDate || "",
          status: (tt.status as any) || "Completed",
          billingStatus: tt.billingStatus || "Unbilled",
          notes: tt.notes,
        });
      });
    }

    // 2. Legacy / String Treatments
    if (encounter.treatments && encounter.treatments.length > 0) {
      encounter.treatments.forEach((tStr, idx) => {
        const alreadyCovered = items.some((i) => i.procedure.toLowerCase() === tStr.toLowerCase());
        if (!alreadyCovered) {
          items.push({
            id: `legacy-${encounter.id}-${idx}`,
            encounterId: encounter.id,
            procedure: tStr,
            diagnosis: encounter.diagnosis || "General Dental Procedure",
            assignedDoctor: encounter.doctorName || "Dr. Rajesh Sharma",
            fee: 0,
            date: encounter.visitDate || "",
            status: encounter.status === "Completed" ? "Completed" : "In Progress",
            billingStatus: "Unbilled",
          });
        }
      });
    }

    return items;
  }, [encounter]);

  // Derived Kanban Columns
  const plannedTreatments = sessionTreatments.filter((t) => t.status === "Planned");
  const inProgressTreatments = sessionTreatments.filter((t) => t.status === "In Progress");
  const completedTreatments = sessionTreatments.filter((t) => t.status === "Completed");

  // ─── Status Handler ───
  const handleStatusSelect = async (newStatus: EncounterStatus) => {
    if (newStatus === currentStatus) return;
    setIsUpdatingStatus(true);
    setCurrentStatus(newStatus);
    try {
      await onUpdateEncounter(encounter.id, { status: newStatus });
      setNotesToast(`Status updated to ${newStatus}`);
      setTimeout(() => setNotesToast(null), 3000);
    } catch (err) {
      console.error("Error updating status:", err);
      setCurrentStatus(encounter.status || "In Progress");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // ─── Move Kanban Item ───
  const handleMoveTreatmentStatus = async (
    item: KanbanTreatmentItem,
    targetStatus: "Planned" | "In Progress" | "Completed"
  ) => {
    const updatedToothTreatments = (encounter.toothTreatments || []).map((tt) => {
      if (tt.id === item.id) {
        return {
          ...tt,
          status: targetStatus,
        };
      }
      return tt;
    });

    try {
      await onUpdateEncounter(encounter.id, {
        toothTreatments: updatedToothTreatments,
      });
      setNotesToast(`Treatment status moved to ${targetStatus}`);
      setTimeout(() => setNotesToast(null), 2500);
    } catch (err) {
      console.error("Error moving treatment:", err);
    }
  };

  // ─── Tag Handlers ───
  const handleAddTag = (category: string) => {
    if (!newTagInput || !newTagInput.value.trim()) {
      setNewTagInput(null);
      return;
    }
    const val = newTagInput.value.trim();
    if (category === "complaints") setChiefComplaints((prev) => [...prev, val]);
    else if (category === "medical") setMedicalTags((prev) => [...prev, val]);
    else if (category === "dental") setDentalHistoryTags((prev) => [...prev, val]);
    else if (category === "allergies") setAllergyTags((prev) => [...prev, val]);
    setNewTagInput(null);
  };

  const handleRemoveTag = (category: string, index: number) => {
    if (category === "complaints") setChiefComplaints((prev) => prev.filter((_, i) => i !== index));
    else if (category === "medical") setMedicalTags((prev) => prev.filter((_, i) => i !== index));
    else if (category === "dental") setDentalHistoryTags((prev) => prev.filter((_, i) => i !== index));
    else if (category === "allergies") setAllergyTags((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Progress Notes Save ───
  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await onUpdateEncounter(encounter.id, {
        notes: sessionNotes,
        chiefComplaints,
      });
      setNotesToast("Clinical progress notes saved successfully!");
      setTimeout(() => setNotesToast(null), 3000);
    } catch (err) {
      console.error("Error saving notes:", err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const { data: clinicSettings } = useQuery<ClinicSettingsData>({
    queryKey: queryKeys.settings.clinicInfo,
    queryFn: getClinicSettings,
    staleTime: 10 * 60 * 1000,
  });

  const clinicName = clinicSettings?.clinicName || "Sanjivani Dental Clinic";
  const clinicAddress = formatClinicAddress(clinicSettings);
  const creds = getDoctorCredentials(clinicSettings, encounter.doctorName);
  const clinicPhone = clinicSettings?.primaryPhone || clinicSettings?.phone || "+91 98765 43210";
  const clinicEmail = clinicSettings?.email || "contact@sanjivanidentals.com";

  // WhatsApp Share URL
  const whatsappText = encodeURIComponent(
    `Hello ${patient.name}, here is your clinical summary for Case Paper #${casePaperNumber} at ${clinicName} on ${formatDate(
      encounter.visitDate
    )}. Treating Doctor: ${creds.doctorName}. Status: ${currentStatus}.`
  );
  const whatsappUrl = `https://wa.me/${patient.phone.replace(/[^0-9]/g, "")}?text=${whatsappText}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col print:bg-white w-full max-w-full overflow-x-hidden">
      
      {/* ═════════════════════════════════════════════════════════════════════
          PRINT-ONLY CLINIC LETTERHEAD (OFFICIAL CASE PAPER)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="hidden print:block mb-6 p-6 border-b-2 border-primary/30">
        <div className="flex flex-row justify-between items-start gap-4">
          <div className="flex items-start gap-3">
            {clinicSettings?.logoUrl || clinicSettings?.clinicLogoUrl ? (
              <img
                src={clinicSettings.logoUrl || clinicSettings.clinicLogoUrl}
                alt={clinicName}
                className="w-14 h-14 rounded-xl object-contain border border-gray-200 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                <Stethoscope className="w-6 h-6 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">{clinicName}</h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">{clinicAddress}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Ph: {clinicPhone} | Email: {clinicEmail}
                {clinicSettings?.gstin ? ` | GSTIN: ${clinicSettings.gstin}` : ""}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <h2 className="text-base font-extrabold text-slate-900 leading-tight">{creds.doctorName}</h2>
            <p className="text-xs text-primary font-bold">{creds.qualification}</p>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Reg. No: {creds.registrationNumber}</p>
          </div>
        </div>

        {/* Patient Metadata Bar in Print Header */}
        <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Patient Name</span>
            <span className="font-bold text-slate-900">{patient.name}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Age / Gender / ID</span>
            <span className="font-semibold text-slate-800">
              {patient.age ? `${patient.age} yrs` : "N/A"} • {patient.gender || "N/A"} • #{patient.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Encounter Date</span>
            <span className="font-semibold text-slate-800">{formatDate(encounter.visitDate)}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Case Paper No.</span>
            <span className="font-bold text-primary font-mono">CP-#{casePaperNumber}</span>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          1. STICKY DEDICATED SESSION HEADER & WORKSPACE NAVIGATION
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-outline-variant/20 shadow-xs backdrop-blur-md print:hidden max-w-full">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 max-w-full">
          
          {/* Left: Back Link & Patient Snapshot */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 max-w-full">
            <Link
              href={`/admin/patients/${patient.id}`}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold shrink-0 cursor-pointer shadow-2xs min-w-[36px] min-h-[36px] justify-center"
              title="Return to Patient Profile"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden md:inline">Back</span>
            </Link>

            <div className="h-6 w-px bg-slate-200 hidden sm:block shrink-0" />

            {/* Patient Context Pill */}
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-xs border border-primary/20 shrink-0">
                {patient.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-xs sm:text-sm font-bold text-slate-900 font-sans truncate max-w-[140px] sm:max-w-[200px] md:max-w-none">
                    {patient.name}
                  </h1>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium shrink-0">
                    ({patient.age}y / {patient.gender})
                  </span>
                  {medicalProfile?.allergies && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[9px] sm:text-[10px] font-bold flex items-center gap-1 shrink-0">
                      <ShieldAlert className="w-2.5 h-2.5 text-rose-600" />
                      Allergy
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium truncate">
                  <span className="truncate">{patient.phone}</span>
                  <span>•</span>
                  <span className="text-primary font-bold shrink-0">
                    CP #{casePaperNumber}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Status Pill & Action Buttons */}
          <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 shrink-0 pt-0.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            {/* Status Dropdown */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <select
                value={currentStatus}
                onChange={(e) => handleStatusSelect(e.target.value as EncounterStatus)}
                disabled={isUpdatingStatus}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer border shadow-2xs focus:outline-none min-h-[34px] ${
                  currentStatus === "Completed"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : currentStatus === "In Progress"
                    ? "bg-blue-50 text-blue-800 border-blue-300"
                    : "bg-amber-50 text-amber-800 border-amber-300"
                }`}
              >
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsRxModalOpen(true)}
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs min-h-[34px]"
                title="Issue Prescription"
              >
                <Pill className="w-3.5 h-3.5 text-emerald-700" />
                <span>Rx</span>
              </button>

              {onOpenInvoice && (
                <button
                  onClick={() => onOpenInvoice(encounter)}
                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs min-h-[34px]"
                  title="Generate Invoice"
                >
                  <Receipt className="w-3.5 h-3.5 text-blue-700" />
                  <span>Bill</span>
                </button>
              )}

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-[#dcfce7] hover:bg-green-200 text-green-900 rounded-xl transition-colors border border-green-300 shadow-2xs cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center"
                title="Share Clinical Summary on WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5 text-green-700" />
              </a>

              <button
                onClick={() => window.print()}
                className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors cursor-pointer shadow-2xs min-h-[34px] min-w-[34px] flex items-center justify-center"
                title="Print Case Paper"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ═════════════════════════════════════════════════════════════════════
          MAIN CLINICAL CANVAS BODY
      ══════════════════════════════════════════════════════════════════════ */}
      <main className="max-w-7xl mx-auto w-full p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 flex-1 max-w-full min-w-0">
        
        {/* ─────────────────────────────────────────────────────────────────
            SECTION A: CASE PAPER METADATA & STRUCTURED EXAMINATION TAGS
        ────────────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-2xs overflow-hidden max-w-full">
          {/* Sub Header */}
          <div className="p-3.5 sm:p-5 border-b border-outline-variant/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60 max-w-full min-w-0">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0 mt-0.5 sm:mt-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                  <span>Clinical Case Paper #{casePaperNumber}</span>
                  <span
                    className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border ${
                      currentStatus === "Completed"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : currentStatus === "In Progress"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {currentStatus}
                  </span>
                </h2>
                <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-xs text-slate-500 font-medium mt-1 min-w-0">
                  <span className="flex items-center gap-1 shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{formatDate(encounter.visitDate)} {encounter.visitTime ? `at ${encounter.visitTime}` : ""}</span>
                  </span>
                  <span className="shrink-0">•</span>
                  <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs max-w-full min-w-0">
                    <User className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 shrink-0">Doctor:</span>
                    <select
                      value={encounter.doctorId || (availableDoctors.find((d) => d.fullName === encounter.doctorName)?.id || availableDoctors[0]?.id || "tm-1")}
                      onChange={async (e) => {
                        const selectedDocId = e.target.value;
                        const selectedDoc = availableDoctors.find((d) => d.id === selectedDocId);
                        if (selectedDoc) {
                          await onUpdateEncounter(encounter.id, {
                            doctorId: selectedDoc.id,
                            doctorName: selectedDoc.fullName,
                          });
                        }
                      }}
                      className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer pr-1 hover:text-primary transition-colors truncate max-w-[130px] sm:max-w-[200px] md:max-w-none"
                      title="Change Assigned Doctor for this Case Paper"
                    >
                      {availableDoctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.fullName}
                        </option>
                      ))}
                      {availableDoctors.length === 0 && (
                        <option value="tm-1">Dr. Rajesh Sharma</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {encounter.diagnosis && (
              <div className="text-xs bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto max-w-full min-w-0">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Diagnosis:</span>
                <span className="font-bold text-slate-800 truncate block max-w-[240px] sm:max-w-none">{encounter.diagnosis}</span>
              </div>
            )}
          </div>

          {/* 4 Structured Tag Rows: Chief Complaints, Medical History, Dental History, Allergies */}
          <div className="p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 text-xs max-w-full">
            
            {/* 1. Chief Complaints Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span className="w-36 font-bold text-slate-600 uppercase tracking-wider text-[11px] shrink-0 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Chief Complaints:
              </span>
              <div className="flex-1 flex flex-wrap items-center gap-1.5">
                {chiefComplaints.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-800 border border-red-200 text-xs font-semibold"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => handleRemoveTag("complaints", idx)}
                      className="hover:text-red-950 p-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {newTagInput?.category === "complaints" ? (
                  <div className="inline-flex items-center gap-1 bg-white border border-primary rounded-full px-2 py-0.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Type complaint & press Enter..."
                      value={newTagInput.value}
                      onChange={(e) => setNewTagInput({ category: "complaints", value: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddTag("complaints");
                        if (e.key === "Escape") setNewTagInput(null);
                      }}
                      className="text-xs outline-none w-44 px-1"
                    />
                    <button onClick={() => handleAddTag("complaints")} className="text-primary font-bold cursor-pointer">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setNewTagInput({ category: "complaints", value: "" })}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Complaint
                  </button>
                )}
              </div>
            </div>

            {/* 2. Medical History Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 border-t border-slate-100 pt-3">
              <span className="w-36 font-bold text-slate-600 uppercase tracking-wider text-[11px] shrink-0 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Medical History:
              </span>
              <div className="flex-1 flex flex-wrap items-center gap-1.5">
                {medicalTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => handleRemoveTag("medical", idx)}
                      className="hover:text-amber-950 p-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {newTagInput?.category === "medical" ? (
                  <div className="inline-flex items-center gap-1 bg-white border border-primary rounded-full px-2 py-0.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="e.g. Diabetes, Hypertension..."
                      value={newTagInput.value}
                      onChange={(e) => setNewTagInput({ category: "medical", value: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddTag("medical");
                        if (e.key === "Escape") setNewTagInput(null);
                      }}
                      className="text-xs outline-none w-44 px-1"
                    />
                    <button onClick={() => handleAddTag("medical")} className="text-primary font-bold cursor-pointer">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setNewTagInput({ category: "medical", value: "" })}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Condition
                  </button>
                )}
              </div>
            </div>

            {/* 3. Dental History Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 border-t border-slate-100 pt-3">
              <span className="w-36 font-bold text-slate-600 uppercase tracking-wider text-[11px] shrink-0 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Dental History:
              </span>
              <div className="flex-1 flex flex-wrap items-center gap-1.5">
                {dentalHistoryTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 text-xs font-semibold"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => handleRemoveTag("dental", idx)}
                      className="hover:text-blue-950 p-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {newTagInput?.category === "dental" ? (
                  <div className="inline-flex items-center gap-1 bg-white border border-primary rounded-full px-2 py-0.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="e.g. Extraction #28..."
                      value={newTagInput.value}
                      onChange={(e) => setNewTagInput({ category: "dental", value: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddTag("dental");
                        if (e.key === "Escape") setNewTagInput(null);
                      }}
                      className="text-xs outline-none w-44 px-1"
                    />
                    <button onClick={() => handleAddTag("dental")} className="text-primary font-bold cursor-pointer">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setNewTagInput({ category: "dental", value: "" })}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Dental History
                  </button>
                )}
              </div>
            </div>

            {/* 4. Allergies Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 border-t border-slate-100 pt-3">
              <span className="w-36 font-bold text-slate-600 uppercase tracking-wider text-[11px] shrink-0 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                Allergies:
              </span>
              <div className="flex-1 flex flex-wrap items-center gap-1.5">
                {allergyTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-900 border border-rose-200 text-xs font-semibold"
                  >
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    <span>{tag}</span>
                    <button
                      onClick={() => handleRemoveTag("allergies", idx)}
                      className="hover:text-rose-950 p-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {newTagInput?.category === "allergies" ? (
                  <div className="inline-flex items-center gap-1 bg-white border border-primary rounded-full px-2 py-0.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="e.g. Penicillin, Latex..."
                      value={newTagInput.value}
                      onChange={(e) => setNewTagInput({ category: "allergies", value: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddTag("allergies");
                        if (e.key === "Escape") setNewTagInput(null);
                      }}
                      className="text-xs outline-none w-44 px-1"
                    />
                    <button onClick={() => handleAddTag("allergies")} className="text-primary font-bold cursor-pointer">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setNewTagInput({ category: "allergies", value: "" })}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Allergy
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            SECTION B: INTERACTIVE ODONTOGRAM & TOOTH TREATMENT PANEL
        ────────────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[480px] sm:min-h-[520px] max-w-full">
          <div className="flex-1 overflow-hidden h-full max-w-full">
            <DentalChart patientId={patient.id} patientName={patient.name} />
          </div>

          {selectedTooth && (
            <ToothDetailPanel
              onSaveTreatment={onSaveToothTreatment}
              isSaving={isSavingToothTreatment}
            />
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            SECTION C: 3-COLUMN / TABBED TREATMENT LIFECYCLE KANBAN
        ────────────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-outline-variant/15 p-3.5 sm:p-5 shadow-2xs space-y-4 max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/10">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 font-sans">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <span>Treatment Kanban (Session #{casePaperNumber})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Track clinical progression from diagnostic planning to active execution and completion.
              </p>
            </div>

            <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
              Total Procedures: <span className="text-primary font-mono">{sessionTreatments.length}</span>
            </div>
          </div>

          {/* Mobile Segmented Tab Bar (< 768px / md) */}
          <div className="md:hidden flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setMobileKanbanTab("planned")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                mobileKanbanTab === "planned"
                  ? "bg-amber-500 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Planned ({plannedTreatments.length})
            </button>
            <button
              type="button"
              onClick={() => setMobileKanbanTab("in_progress")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                mobileKanbanTab === "in_progress"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              In Progress ({inProgressTreatments.length})
            </button>
            <button
              type="button"
              onClick={() => setMobileKanbanTab("completed")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                mobileKanbanTab === "completed"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Done ({completedTreatments.length})
            </button>
          </div>

          {/* Kanban Columns (Tabbed on mobile, 3-column grid on desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            
            {/* Column 1: PLANNED */}
            <div
              className={`bg-amber-50/40 border border-amber-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between space-y-3 ${
                mobileKanbanTab !== "planned" ? "hidden md:flex" : "flex"
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-amber-200/60 mb-3">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Planned ({plannedTreatments.length})
                  </span>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    Stage 1
                  </span>
                </div>

                {plannedTreatments.length === 0 ? (
                  <p className="text-xs text-amber-700/60 italic py-6 text-center">
                    No planned procedures awaiting initiation.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {plannedTreatments.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl p-3.5 border border-amber-200 shadow-2xs space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            {item.toothNumber ? (
                              <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[11px]">
                                Tooth #{item.toothNumber}
                                {item.surfaces && item.surfaces.length > 0 && (
                                  <span className="text-primary font-bold">({item.surfaces.join(",")})</span>
                                )}
                              </span>
                            ) : (
                              <span className="font-mono text-slate-400 text-[11px]">General</span>
                            )}
                            <h4 className="font-bold text-slate-900 mt-1">{item.procedure}</h4>
                          </div>

                          <span className="font-black text-slate-900 font-mono text-xs">
                            ₹{formatINR(item.fee)}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 truncate">
                          {item.diagnosis} • {item.assignedDoctor}
                        </p>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <button
                            onClick={() => handleMoveTreatmentStatus(item, "In Progress")}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs min-h-[32px]"
                          >
                            <span>▶ Start Treatment</span>
                          </button>
                          <button
                            onClick={() => handleMoveTreatmentStatus(item, "Completed")}
                            className="text-emerald-700 font-bold hover:underline text-[11px] cursor-pointer"
                          >
                            Mark Done
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: IN PROGRESS */}
            <div
              className={`bg-blue-50/40 border border-blue-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between space-y-3 ${
                mobileKanbanTab !== "in_progress" ? "hidden md:flex" : "flex"
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-blue-200/60 mb-3">
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    In Progress ({inProgressTreatments.length})
                  </span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    Stage 2
                  </span>
                </div>

                {inProgressTreatments.length === 0 ? (
                  <p className="text-xs text-blue-700/60 italic py-6 text-center">
                    No active treatments currently in progress.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {inProgressTreatments.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl p-3.5 border border-blue-200 shadow-2xs space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            {item.toothNumber ? (
                              <span className="inline-flex items-center gap-1 font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 text-[11px]">
                                Tooth #{item.toothNumber}
                                {item.surfaces && item.surfaces.length > 0 && (
                                  <span className="text-primary font-bold">({item.surfaces.join(",")})</span>
                                )}
                              </span>
                            ) : (
                              <span className="font-mono text-slate-400 text-[11px]">General</span>
                            )}
                            <h4 className="font-bold text-slate-900 mt-1">{item.procedure}</h4>
                          </div>

                          <span className="font-black text-slate-900 font-mono text-xs">
                            ₹{formatINR(item.fee)}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 truncate">
                          {item.diagnosis} • {item.assignedDoctor}
                        </p>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <button
                            onClick={() => handleMoveTreatmentStatus(item, "Completed")}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs min-h-[32px]"
                          >
                            <Check className="w-3 h-3" />
                            <span>Complete</span>
                          </button>
                          <button
                            onClick={() => handleMoveTreatmentStatus(item, "Planned")}
                            className="text-slate-500 hover:text-slate-800 text-[11px] cursor-pointer"
                          >
                            Revert
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: COMPLETED */}
            <div
              className={`bg-emerald-50/40 border border-emerald-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between space-y-3 ${
                mobileKanbanTab !== "completed" ? "hidden md:flex" : "flex"
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-emerald-200/60 mb-3">
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    Completed ({completedTreatments.length})
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Stage 3
                  </span>
                </div>

                {completedTreatments.length === 0 ? (
                  <p className="text-xs text-emerald-700/60 italic py-6 text-center">
                    No completed procedures recorded yet for this session.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {completedTreatments.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl p-3.5 border border-emerald-200 shadow-2xs space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            {item.toothNumber ? (
                              <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                                Tooth #{item.toothNumber}
                                {item.surfaces && item.surfaces.length > 0 && (
                                  <span className="text-primary font-bold">({item.surfaces.join(",")})</span>
                                )}
                              </span>
                            ) : (
                              <span className="font-mono text-slate-400 text-[11px]">General</span>
                            )}
                            <h4 className="font-bold text-slate-900 mt-1">{item.procedure}</h4>
                          </div>

                          <span className="font-black text-slate-900 font-mono text-xs">
                            ₹{formatINR(item.fee)}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 truncate">
                          {item.diagnosis} • {item.assignedDoctor}
                        </p>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              item.billingStatus === "Billed"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {item.billingStatus}
                          </span>

                          <button
                            onClick={() => handleMoveTreatmentStatus(item, "In Progress")}
                            className="text-slate-500 hover:text-slate-800 text-[11px] cursor-pointer"
                          >
                            Re-open
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            SECTION D: ANCILLARY CLINICAL MODULES (COLLAPSIBLE ACCORDIONS ON MOBILE)
        ────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          
          {/* Module 1: Laboratory Orders */}
          <div className="bg-white rounded-2xl border border-outline-variant/15 p-3.5 sm:p-5 shadow-2xs space-y-3.5 sm:space-y-4">
            <div
              onClick={() => toggleAccordion("lab")}
              className="flex items-center justify-between pb-2 sm:pb-3 border-b border-outline-variant/10 cursor-pointer lg:cursor-default select-none"
            >
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2 font-sans">
                <Package className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-primary" />
                <span>Laboratory Orders &amp; Prosthetics</span>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
                  {labOrders.length}
                </span>
              </h3>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsNewLabModalOpen(true);
                  }}
                  className="text-[11px] sm:text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span>New Order</span>
                </button>
                <div className="lg:hidden text-slate-400">
                  {openAccordions.lab ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </div>

            {(openAccordions.lab || typeof window === "undefined") && (
              <>
                {labOrders.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-5 text-center bg-slate-50 rounded-xl">
                    No active laboratory prosthetic orders for this patient.
                  </p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {labOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-none">
                            {order.prosthesisType} {order.toothNumber ? `(#${order.toothNumber})` : ""}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                            {order.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-1">
                          <span>Lab: <strong>{order.labName}</strong></span>
                          <span>Shade: <strong>{order.shade}</strong></span>
                          <span>Due: <strong>{order.dueDate}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Module 2: Visit Prescriptions */}
          <div className="bg-white rounded-2xl border border-outline-variant/15 p-3.5 sm:p-5 shadow-2xs space-y-3.5 sm:space-y-4">
            <div
              onClick={() => toggleAccordion("rx")}
              className="flex items-center justify-between pb-2 sm:pb-3 border-b border-outline-variant/10 cursor-pointer lg:cursor-default select-none"
            >
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2 font-sans">
                <Pill className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-600" />
                <span>Visit Prescriptions &amp; Medications</span>
              </h3>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRxModalOpen(true);
                  }}
                  className="text-[11px] sm:text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span>Prescribe</span>
                </button>
                <div className="lg:hidden text-slate-400">
                  {openAccordions.rx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </div>

            {(openAccordions.rx || typeof window === "undefined") && (
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900">Standard Post-Op Medication Set</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                      Active
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-white border border-emerald-200 rounded-md text-[11px] text-emerald-900 font-semibold">
                      Amoxicillin 500mg (1-0-1) × 5 days
                    </span>
                    <span className="px-2 py-0.5 bg-white border border-emerald-200 rounded-md text-[11px] text-emerald-900 font-semibold">
                      Ibuprofen 400mg + Paracetamol (1-0-1) × 3 days
                    </span>
                    <span className="px-2 py-0.5 bg-white border border-emerald-200 rounded-md text-[11px] text-emerald-900 font-semibold">
                      Chlorhexidine 0.2% Mouthwash (10ml TDS)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Module 3: Scans & Diagnostics */}
          <div className="bg-white rounded-2xl border border-outline-variant/15 p-3.5 sm:p-5 shadow-2xs space-y-3.5 sm:space-y-4">
            <div
              onClick={() => toggleAccordion("scans")}
              className="flex items-center justify-between pb-2 sm:pb-3 border-b border-outline-variant/10 cursor-pointer lg:cursor-default select-none"
            >
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2 font-sans">
                <UploadCloud className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-indigo-600" />
                <span>Diagnostic Scans &amp; X-Rays</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 hidden sm:inline">IOPA &amp; Bitewings</span>
                <div className="lg:hidden text-slate-400">
                  {openAccordions.scans ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </div>

            {(openAccordions.scans || typeof window === "undefined") && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                    IOPA
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 block truncate">Bitewing Scan #14 Molar</span>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 truncate block">Taken for this session • Verified</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  Attached
                </span>
              </div>
            )}
          </div>

          {/* Module 4: Inventory & Consumables Used */}
          <div className="bg-white rounded-2xl border border-outline-variant/15 p-3.5 sm:p-5 shadow-2xs space-y-3.5 sm:space-y-4">
            <div
              onClick={() => toggleAccordion("consumables")}
              className="flex items-center justify-between pb-2 sm:pb-3 border-b border-outline-variant/10 cursor-pointer lg:cursor-default select-none"
            >
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2 font-sans">
                <FileCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-600" />
                <span>Consumables &amp; Materials</span>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
                  {consumablesUsed.length}
                </span>
              </h3>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsConsumableModalOpen(true);
                  }}
                  className="text-[11px] sm:text-xs font-bold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span>Add</span>
                </button>
                <div className="lg:hidden text-slate-400">
                  {openAccordions.consumables ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </div>

            {(openAccordions.consumables || typeof window === "undefined") && (
              <div className="space-y-1.5 text-xs">
                {consumablesUsed.map((c) => (
                  <div
                    key={c.id}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2"
                  >
                    <span className="text-slate-800 font-medium truncate">{c.name}</span>
                    <span className="font-bold text-slate-900 font-mono bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0 text-[11px]">
                      {c.quantity} {c.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ─────────────────────────────────────────────────────────────────
            SECTION E: CLINICAL PROGRESS NOTES (SOAP FORMAT)
        ────────────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-outline-variant/15 p-3.5 sm:p-6 shadow-2xs space-y-3.5 sm:space-y-4 max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/10">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 font-sans">
                <FileText className="w-5 h-5 text-primary" />
                <span>Clinical Examination &amp; Progress Notes (SOAP)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Structured observations: Subjective symptoms, Objective intraoral findings, Assessment/Prognosis, and Plan/Post-op guidance.
              </p>
            </div>

            <button
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              className="px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 min-h-[38px] sm:min-h-0 self-stretch sm:self-auto"
            >
              {isSavingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Save Progress Notes</span>
            </button>
          </div>

          <div>
            <textarea
              rows={4}
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Refined observations for this session... (Subjective complaints, Objective findings, Assessment/Diagnosis, Procedural steps & Post-operative instructions)"
              className="w-full p-3 sm:p-3.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y leading-relaxed font-medium"
            />
          </div>
        </div>

      </main>

      {/* ── Modal: New Lab Order ── */}
      {isNewLabModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Create Laboratory Order
              </h3>
              <button
                onClick={() => setIsNewLabModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setLabOrders((prev) => [
                  ...prev,
                  {
                    id: `lab-${Date.now()}`,
                    labName: newLabForm.labName,
                    prosthesisType: newLabForm.prosthesisType,
                    toothNumber: newLabForm.toothNumber ? Number(newLabForm.toothNumber) : undefined,
                    shade: newLabForm.shade,
                    impressionDate: new Date().toISOString().split("T")[0],
                    dueDate: newLabForm.dueDate,
                    status: "Sent to Lab",
                  },
                ]);
                setIsNewLabModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Laboratory Name *</label>
                <input
                  type="text"
                  required
                  value={newLabForm.labName}
                  onChange={(e) => setNewLabForm({ ...newLabForm, labName: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prosthesis Type *</label>
                  <select
                    value={newLabForm.prosthesisType}
                    onChange={(e) => setNewLabForm({ ...newLabForm, prosthesisType: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white cursor-pointer"
                  >
                    <option value="Zirconia Crown">Zirconia Crown</option>
                    <option value="E-Max Ceramic Inlay">E-Max Ceramic Inlay</option>
                    <option value="PFM Bridge">PFM Bridge</option>
                    <option value="Clear Aligner Set">Clear Aligner Set</option>
                    <option value="Complete Denture">Complete Denture</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tooth #</label>
                  <input
                    type="number"
                    value={newLabForm.toothNumber}
                    onChange={(e) => setNewLabForm({ ...newLabForm, toothNumber: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shade (e.g. A2)</label>
                  <input
                    type="text"
                    value={newLabForm.shade}
                    onChange={(e) => setNewLabForm({ ...newLabForm, shade: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newLabForm.dueDate}
                    onChange={(e) => setNewLabForm({ ...newLabForm, dueDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewLabModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-semibold cursor-pointer min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl cursor-pointer min-h-[40px]"
                >
                  Save Lab Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Add Consumable ── */}
      {isConsumableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-600" />
                Add Consumable Material
              </h3>
              <button
                onClick={() => setIsConsumableModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newConsumableName.trim()) return;
                setConsumablesUsed((prev) => [
                  ...prev,
                  {
                    id: `c-${Date.now()}`,
                    name: newConsumableName.trim(),
                    category: "Dental Supply",
                    quantity: newConsumableQty,
                    unit: "Units",
                  },
                ]);
                setNewConsumableName("");
                setIsConsumableModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Endodontic Paper Points #25"
                  value={newConsumableName}
                  onChange={(e) => setNewConsumableName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quantity Used</label>
                <input
                  type="number"
                  min="1"
                  value={newConsumableQty}
                  onChange={(e) => setNewConsumableQty(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div className="pt-3 flex gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsConsumableModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-semibold cursor-pointer min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl cursor-pointer min-h-[40px]"
                >
                  Add to Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Prescription ── */}
      {isRxModalOpen && (
        <PrescriptionModal
          isOpen={isRxModalOpen}
          onClose={() => setIsRxModalOpen(false)}
          encounter={encounter}
          patient={patient}
          medicalProfile={medicalProfile}
          onSuccess={() => {
            setNotesToast("Prescription issued successfully!");
            setTimeout(() => setNotesToast(null), 3000);
          }}
        />
      )}

      {/* Toast Notification */}
      {notesToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notesToast}</span>
        </div>
      )}

      {/* Print-Only Signature & Stamp Block */}
      <div className="hidden print:flex flex-row items-center justify-between pt-8 mt-12 border-t border-slate-300 px-6">
        <div className="text-[10px] text-slate-500 space-y-0.5">
          <p className="font-bold text-slate-700">Official Clinical Case Record — {clinicName}</p>
          <p>Generated digitally for patient clinical history documentation.</p>
        </div>
        <div className="text-right shrink-0">
          <div className="w-40 h-10 ml-auto flex items-end justify-center pb-1 text-slate-800 font-serif italic text-sm font-bold border-b border-slate-400">
            {creds.doctorName}
          </div>
          <p className="text-xs font-bold text-slate-900 mt-1">Authorized Dentist Signature</p>
          <p className="text-[10px] text-slate-400 font-medium">{clinicName}</p>
        </div>
      </div>

      {/* CSS Styles for exact print rendering */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\:hidden {
            display: none !important;
          }
          .print\:block {
            display: block !important;
          }
          .print\:flex {
            display: flex !important;
          }
        }
      `}</style>

    </div>
  );
};
