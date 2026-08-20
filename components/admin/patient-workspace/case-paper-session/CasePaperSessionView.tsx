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
} from "lucide-react";
import { DentalChart } from "../../../dental-chart/DentalChart";
import { ToothDetailPanel } from "../../../dental-chart/ToothDetailPanel";
import { PrescriptionModal } from "../../encounters/PrescriptionModal";
import { useDentalChartStore } from "../../../../lib/store/useDentalChartStore";
import type {
  Patient,
  PatientEncounter,
  PatientMedicalProfile,
  EncounterStatus,
  ToothTreatmentEntry,
  SurfaceType,
  Doctor,
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

  // ─── Extract Treatments for Session Kanban ───
  const sessionTreatments: KanbanTreatmentItem[] = [];

  if (encounter.toothTreatments && encounter.toothTreatments.length > 0) {
    encounter.toothTreatments.forEach((tt) => {
      const clinicalStatus = getTreatmentStatus(tt, currentStatus);
      sessionTreatments.push({
        id: tt.id || `${encounter.id}-${tt.toothNumber}`,
        encounterId: encounter.id,
        toothNumber: tt.toothNumber,
        surfaces: tt.surfaces,
        procedure: tt.treatmentName,
        diagnosis: encounter.diagnosis || encounter.chiefComplaint || "Dental Restoration",
        assignedDoctor: encounter.doctorName || "Dr. Julian Moore",
        fee: tt.fee || 0,
        date: tt.date || encounter.visitDate,
        status: clinicalStatus,
        billingStatus: tt.billingStatus === "Billed" ? "Billed" : "Unbilled",
        notes: tt.notes,
      });
    });
  } else if (encounter.treatments && encounter.treatments.length > 0) {
    encounter.treatments.forEach((tName, idx) => {
      const clinicalStatus: "Planned" | "In Progress" | "Completed" =
        currentStatus === "In Progress"
          ? "In Progress"
          : currentStatus === "Pending"
          ? "Planned"
          : "Completed";

      sessionTreatments.push({
        id: `${encounter.id}-t-${idx}`,
        encounterId: encounter.id,
        procedure: tName,
        diagnosis: encounter.diagnosis || encounter.chiefComplaint || "Clinical Procedure",
        assignedDoctor: encounter.doctorName || "Dr. Julian Moore",
        fee: 0,
        date: encounter.visitDate,
        status: clinicalStatus,
        billingStatus: "Unbilled",
        notes: encounter.notes,
      });
    });
  }

  const plannedTreatments = sessionTreatments.filter((t) => t.status === "Planned");
  const inProgressTreatments = sessionTreatments.filter((t) => t.status === "In Progress");
  const completedTreatments = sessionTreatments.filter((t) => t.status === "Completed");

  // Handler for Kanban Lifecycle change
  const handleMoveTreatmentStatus = async (
    item: KanbanTreatmentItem,
    newStatus: "Planned" | "In Progress" | "Completed"
  ) => {
    if (encounter.toothTreatments && encounter.toothTreatments.length > 0) {
      const updatedToothTreatments = encounter.toothTreatments.map((tt) => {
        if (tt.id === item.id || `${encounter.id}-${tt.toothNumber}` === item.id) {
          return {
            ...tt,
            status: newStatus,
            treatmentStatus: newStatus,
          };
        }
        return tt;
      });

      await onUpdateEncounter(encounter.id, {
        toothTreatments: updatedToothTreatments,
      });
    } else {
      const newEncounterStatus: EncounterStatus =
        newStatus === "Completed"
          ? "Completed"
          : newStatus === "In Progress"
          ? "In Progress"
          : "Pending";
      setCurrentStatus(newEncounterStatus);
      await onUpdateEncounter(encounter.id, { status: newEncounterStatus });
    }
  };

  const handleStatusSelect = async (newStatus: EncounterStatus) => {
    setCurrentStatus(newStatus);
    setIsUpdatingStatus(true);
    try {
      await onUpdateEncounter(encounter.id, { status: newStatus });
      setNotesToast(`Case paper status updated to ${newStatus}`);
      setTimeout(() => setNotesToast(null), 2500);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddTag = async (category: string) => {
    if (!newTagInput || !newTagInput.value.trim()) return;
    const val = newTagInput.value.trim();

    if (category === "complaints") {
      const updated = [...chiefComplaints, val];
      setChiefComplaints(updated);
      await onUpdateEncounter(encounter.id, {
        chiefComplaints: updated,
        chiefComplaint: updated.join(", "),
      });
    }
    if (category === "medical") setMedicalTags((prev) => [...prev, val]);
    if (category === "dental") setDentalHistoryTags((prev) => [...prev, val]);
    if (category === "allergies") setAllergyTags((prev) => [...prev, val]);

    setNewTagInput(null);
  };

  const handleRemoveTag = async (category: string, index: number) => {
    if (category === "complaints") {
      const updated = chiefComplaints.filter((_, i) => i !== index);
      setChiefComplaints(updated);
      await onUpdateEncounter(encounter.id, {
        chiefComplaints: updated,
        chiefComplaint: updated.join(", "),
      });
    }
    if (category === "medical") setMedicalTags((prev) => prev.filter((_, i) => i !== index));
    if (category === "dental") setDentalHistoryTags((prev) => prev.filter((_, i) => i !== index));
    if (category === "allergies") setAllergyTags((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await onUpdateEncounter(encounter.id, { notes: sessionNotes });
      setNotesToast("Clinical progress notes saved successfully.");
      setTimeout(() => setNotesToast(null), 3000);
    } catch {
      setNotesToast("Failed to save progress notes.");
      setTimeout(() => setNotesToast(null), 3000);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // WhatsApp Share URL
  const whatsappText = encodeURIComponent(
    `Hello ${patient.name}, here is your clinical summary for Case Paper #${casePaperNumber} at Sanjivani Dental Clinic on ${formatDate(
      encounter.visitDate
    )}. Treating Doctor: ${encounter.doctorName || "Dr. Julian Moore"}. Status: ${currentStatus}.`
  );
  const whatsappUrl = `https://wa.me/${patient.phone.replace(/[^0-9]/g, "")}?text=${whatsappText}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      
      {/* ═════════════════════════════════════════════════════════════════════
          1. STICKY DEDICATED SESSION HEADER & WORKSPACE NAVIGATION
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white border-b border-outline-variant/20 shadow-xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Left: Back Link & Patient Snapshot */}
          <div className="flex items-center gap-3.5">
            <Link
              href={`/admin/patients/${patient.id}`}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold shrink-0 cursor-pointer shadow-2xs"
              title="Return to Patient Profile"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Patient Profile</span>
            </Link>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            {/* Patient Context Pill */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-xs border border-primary/20 shrink-0">
                {patient.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold text-slate-900 font-sans">
                    {patient.name}
                  </h1>
                  <span className="text-[11px] text-slate-500 font-medium">
                    ({patient.age}y / {patient.gender})
                  </span>
                  {medicalProfile?.allergies && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-rose-600" />
                      Allergy Alert
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span>{patient.phone}</span>
                  <span>•</span>
                  <span className="text-primary font-bold">
                    Case Paper #{casePaperNumber}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Status Pill & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
            {/* Status Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase px-2">
                Status:
              </span>
              <select
                value={currentStatus}
                onChange={(e) => handleStatusSelect(e.target.value as EncounterStatus)}
                disabled={isUpdatingStatus}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border shadow-2xs focus:outline-none ${
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
            <button
              onClick={() => setIsRxModalOpen(true)}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              title="Issue Prescription"
            >
              <Pill className="w-3.5 h-3.5 text-emerald-700" />
              <span>Rx</span>
            </button>

            {onOpenInvoice && (
              <button
                onClick={() => onOpenInvoice(encounter)}
                className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
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
              className="p-2 bg-[#dcfce7] hover:bg-green-200 text-green-900 rounded-xl transition-colors border border-green-300 shadow-2xs cursor-pointer"
              title="Share Clinical Summary on WhatsApp"
            >
              <Share2 className="w-4 h-4 text-green-700" />
            </a>

            <button
              onClick={() => window.print()}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors cursor-pointer shadow-2xs"
              title="Print Case Paper"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ═════════════════════════════════════════════════════════════════════
          MAIN CLINICAL CANVAS BODY
      ══════════════════════════════════════════════════════════════════════ */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
        
        {/* ─────────────────────────────────────────────────────────────────
            SECTION A: CASE PAPER METADATA & STRUCTURED EXAMINATION TAGS
        ────────────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-2xs overflow-hidden">
          {/* Sub Header */}
          <div className="p-4 sm:p-5 border-b border-outline-variant/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Clinical Case Paper #{casePaperNumber}</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
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
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{formatDate(encounter.visitDate)} {encounter.visitTime ? `at ${encounter.visitTime}` : ""}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-800 font-semibold">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Treating Dentist: {encounter.doctorName || "Dr. Julian Moore"}</span>
                  </span>
                </div>
              </div>
            </div>

            {encounter.diagnosis && (
              <div className="text-xs bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Diagnosis:</span>
                <span className="font-bold text-slate-800">{encounter.diagnosis}</span>
              </div>
            )}
          </div>

          {/* 4 Structured Tag Rows: Chief Complaints, Medical History, Dental History, Allergies */}
          <div className="p-5 space-y-4 text-xs">
            
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
        <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[520px]">
          <div className="flex-1 overflow-hidden h-full">
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
            SECTION C: 3-COLUMN TREATMENT LIFECYCLE KANBAN
        ────────────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-outline-variant/15 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/10">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-sans">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                Treatment Kanban (Session #{casePaperNumber})
              </h3>
              <p className="text-xs text-slate-500">
                Track clinical progression from diagnostic planning to active execution and completion.
              </p>
            </div>

            <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
              Total Procedures: <span className="text-primary font-mono">{sessionTreatments.length}</span>
            </div>
          </div>

          {/* 3 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Column 1: PLANNED */}
            <div className="bg-amber-50/40 border border-amber-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-3">
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

                        <p className="text-[11px] text-slate-500">
                          {item.diagnosis} • {item.assignedDoctor}
                        </p>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <button
                            onClick={() => handleMoveTreatmentStatus(item, "In Progress")}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
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
            <div className="bg-blue-50/40 border border-blue-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-3">
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

                        <p className="text-[11px] text-slate-500">
                          {item.diagnosis} • {item.assignedDoctor}
                        </p>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <button
                            onClick={() => handleMoveTreatmentStatus(item, "Completed")}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
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
            <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-3">
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

                        <p className="text-[11px] text-slate-500">
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
            SECTION D: ANCILLARY CLINICAL MODULES (2x2 GRID)
        ────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* Module 1: Laboratory Orders */}
          <div className="bg-white rounded-2xl border border-outline-variant/15 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-sans">
                <Package className="w-4.5 h-4.5 text-primary" />
                Laboratory Orders & Prosthetics
              </h3>
              <button
                onClick={() => setIsNewLabModalOpen(true)}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> New Lab Order
              </button>
            </div>

            {labOrders.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center bg-slate-50 rounded-xl">
                No active laboratory prosthetic orders for this patient.
              </p>
            ) : (
              <div className="space-y-2.5 text-xs">
                {labOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {order.prosthesisType} {order.toothNumber ? `(Tooth #${order.toothNumber})` : ""}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {order.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Lab: <strong>{order.labName}</strong></span>
                      <span>Shade: <strong>{order.shade}</strong></span>
                      <span>Due: <strong>{order.dueDate}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Module 2: Visit Prescriptions */}
          <div className="bg-white rounded-2xl border border-outline-variant/15 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-sans">
                <Pill className="w-4.5 h-4.5 text-emerald-600" />
                Visit Prescriptions & Medications
              </h3>
              <button
                onClick={() => setIsRxModalOpen(true)}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Prescribe Rx
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900">Standard Post-Op Medication Set</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
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
          </div>

          {/* Module 3: Scans & Diagnostics */}
          <div className="bg-white rounded-2xl border border-outline-variant/15 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-sans">
                <UploadCloud className="w-4.5 h-4.5 text-indigo-600" />
                Diagnostic Scans & X-Rays
              </h3>
              <span className="text-xs font-bold text-slate-500">IOPA & Bitewings</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  IOPA
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Bitewing Scan #14 Molar</span>
                  <span className="text-[11px] text-slate-500">Taken for this session • Verified by Clinician</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Attached
              </span>
            </div>
          </div>

          {/* Module 4: Inventory & Consumables Used */}
          <div className="bg-white rounded-2xl border border-outline-variant/15 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-sans">
                <FileCheck className="w-4.5 h-4.5 text-amber-600" />
                Consumables & Materials Log
              </h3>
              <button
                onClick={() => setIsConsumableModalOpen(true)}
                className="text-xs font-bold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Material
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              {consumablesUsed.map((c) => (
                <div
                  key={c.id}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
                >
                  <span className="text-slate-800 font-medium">{c.name}</span>
                  <span className="font-bold text-slate-900 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                    {c.quantity} {c.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ─────────────────────────────────────────────────────────────────
            SECTION E: CLINICAL PROGRESS NOTES (SOAP FORMAT)
        ────────────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-outline-variant/15 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-sans">
                <FileText className="w-5 h-5 text-primary" />
                Clinical Examination & Progress Notes (SOAP)
              </h3>
              <p className="text-xs text-slate-500">
                Structured observations: Subjective symptoms, Objective intraoral findings, Assessment/Prognosis, and Plan/Post-op guidance.
              </p>
            </div>

            <button
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              className="px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
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
              className="w-full p-3.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y leading-relaxed font-medium"
            />
          </div>
        </div>

      </main>

      {/* ── Modal: New Lab Order ── */}
      {isNewLabModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
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
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl cursor-pointer"
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
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
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
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl cursor-pointer"
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
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notesToast}</span>
        </div>
      )}

    </div>
  );
};
