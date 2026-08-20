"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Plus,
  Trash2,
  Save,
  Printer,
  Send,
  Loader2,
  FileText,
  User,
  Stethoscope,
  PlusCircle,
  CheckCircle2,
  Eye,
  Edit3,
  Calendar,
  ArrowUp,
  ArrowDown,
  Mail,
  Share2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Zap,
  ShieldAlert,
  Search,
  Check,
  ChevronDown,
  Info,
} from "lucide-react";
import type {
  PatientEncounter,
  Patient,
  Medication,
  Prescription,
  ClinicBasicInfo,
  PatientMedicalProfile,
} from "../../../lib/types";
import { getClinicInfo } from "../../../lib/services/settingsService";
import {
  getPrescriptionByEncounter,
  getPrescriptionById,
  savePrescription,
  generatePrescriptionNumber,
} from "../../../lib/services/prescriptionService";
import { sendWhatsAppMessage } from "../../../lib/services/whatsappService";
import { sendPrescriptionEmail } from "../../../lib/services/emailService";
import { queryKeys } from "../../../lib/query/queryKeys";
import {
  DENTAL_MEDICATION_CATALOG,
  type DentalMedicationItem,
} from "../../../lib/data/dentalMedicationCatalog";
import {
  DENTAL_PRESCRIPTION_TEMPLATES,
  type PrescriptionTemplate,
} from "../../../lib/data/dentalPrescriptionTemplates";
import {
  evaluatePrescriptionSafety,
  type PrescriptionSafetyAlert,
} from "../../../lib/services/prescriptionSafetyService";

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  encounter: PatientEncounter;
  patient: Patient;
  medicalProfile?: PatientMedicalProfile | null;
  onSuccess?: () => void;
}

const TIMING_OPTIONS = [
  "After Food",
  "Before Food",
  "With Food",
  "At Bedtime",
  "Empty Stomach",
  "As Needed (PRN)",
];

const FREQUENCY_SHORTCUTS = [
  { code: "1-0-1 (Twice Daily)", label: "1-0-1 (BD)", short: "BD" },
  { code: "1-1-1 (Three Times Daily)", label: "1-1-1 (TDS)", short: "TDS" },
  { code: "1-0-0 (Once Daily - Morning)", label: "1-0-0 (OD)", short: "OD" },
  { code: "0-0-1 (Once Daily - Night)", label: "0-0-1 (HS)", short: "HS" },
  { code: "SOS (As Needed in Pain)", label: "SOS", short: "SOS" },
  { code: "STAT (Immediately)", label: "STAT", short: "STAT" },
];

export function PrescriptionModal({
  isOpen,
  onClose,
  encounter,
  patient,
  medicalProfile,
  onSuccess,
}: PrescriptionModalProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ── Prescription State ──────────────────────────────────────────────────
  const [prescriptionId, setPrescriptionId] = useState<string>("temp");
  const [prescriptionNumber, setPrescriptionNumber] = useState<string>("");
  const [chiefComplaint, setChiefComplaint] = useState<string>("");
  const [diagnosis, setDiagnosis] = useState<string>("");
  const [medications, setMedications] = useState<Medication[]>([
    {
      medicine: "",
      dosage: "1 Tablet",
      frequency: "1-0-1 (Twice Daily)",
      duration: "5 Days",
      timing: "After Food",
      notes: "",
    },
  ]);
  const [advice, setAdvice] = useState<string>("");
  const [dietInstructions, setDietInstructions] = useState<string>("");
  const [oralHygieneInstructions, setOralHygieneInstructions] = useState<string>("");
  const [additionalInstructions, setAdditionalInstructions] = useState<string>("");
  const [followUpDate, setFollowUpDate] = useState<string>("");
  const [followUpReason, setFollowUpReason] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  // Autocomplete search states
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch Clinic Settings (Cached) ──────────────────────────────────────
  const { data: clinicInfo } = useQuery<ClinicBasicInfo>({
    queryKey: ["clinicInfo"],
    queryFn: getClinicInfo,
    staleTime: 10 * 60 * 1000,
  });

  // ── Fetch Existing Prescription (if any) ───────────────────────────────
  const { data: existingRx, isLoading: isRxLoading } = useQuery<Prescription | null>({
    queryKey: queryKeys.prescriptions.byEncounter(encounter.id),
    queryFn: async () => {
      if (encounter.prescriptionId) {
        const rx = await getPrescriptionById(encounter.prescriptionId);
        if (rx) return rx;
      }
      return getPrescriptionByEncounter(encounter.id);
    },
    enabled: isOpen && !!encounter.id,
    staleTime: 5 * 60 * 1000,
  });

  // ── Real-Time Safety & Allergy Checks ───────────────────────────────────
  const safetyAlerts: PrescriptionSafetyAlert[] = useMemo(() => {
    return evaluatePrescriptionSafety(medications, patient, medicalProfile);
  }, [medications, patient, medicalProfile]);

  const criticalAlerts = safetyAlerts.filter((a) => a.severity === "CRITICAL");
  const warningAlerts = safetyAlerts.filter((a) => a.severity === "WARNING");

  // ── Populate Form Data on Open ──────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    if (existingRx) {
      setPrescriptionId(existingRx.prescriptionId);
      setPrescriptionNumber(existingRx.prescriptionNumber || generatePrescriptionNumber());
      setChiefComplaint(existingRx.chiefComplaint || encounter.chiefComplaint || "");
      setDiagnosis(existingRx.diagnosis || encounter.diagnosis || "");
      setMedications(
        existingRx.medications && existingRx.medications.length > 0
          ? existingRx.medications.map((m) => ({
              medicine: m.medicine || "",
              genericName: m.genericName,
              form: m.form || "Tablet",
              dosage: m.dosage || "",
              frequency: m.frequency || "",
              duration: m.duration || "",
              timing: m.timing || "After Food",
              notes: m.notes || "",
            }))
          : [
              {
                medicine: "",
                dosage: "1 Tablet",
                frequency: "1-0-1 (Twice Daily)",
                duration: "5 Days",
                timing: "After Food",
                notes: "",
              },
            ]
      );
      setAdvice(existingRx.advice || "");
      setDietInstructions(existingRx.dietInstructions || "");
      setOralHygieneInstructions(existingRx.oralHygieneInstructions || "");
      setAdditionalInstructions(existingRx.additionalInstructions || "");
      setFollowUpDate(existingRx.followUpDate || encounter.followUpDate || "");
      setFollowUpReason(existingRx.followUpReason || "");
      setIsLoaded(true);
    } else if (!isRxLoading) {
      setPrescriptionId("temp");
      setPrescriptionNumber(generatePrescriptionNumber());
      setChiefComplaint(encounter.chiefComplaint || "");
      setDiagnosis(
        encounter.diagnosis || (encounter.treatments ? encounter.treatments.join(" • ") : "")
      );
      setFollowUpDate(encounter.followUpDate || "");
      setFollowUpReason("");
      setAdvice("Take all medications strictly as prescribed after meals.");
      setDietInstructions("Avoid extremely hot, hard, or spicy food items for 24 hours.");
      setOralHygieneInstructions("Maintain warm saline rinses 3 times daily starting tomorrow.");
      setAdditionalInstructions("");
      setMedications([
        {
          medicine: "Augmentin 625 (Amoxicillin + Clavulanic Acid 625mg)",
          genericName: "Amoxicillin 500mg + Clavulanic Acid 125mg",
          form: "Tablet",
          dosage: "1 Tablet",
          frequency: "1-0-1 (Twice Daily)",
          duration: "5 Days",
          timing: "After Food",
          notes: "Complete full antibiotic course",
        },
        {
          medicine: "Zerodol-SP (Aceclofenac + Paracetamol + Serratiopeptidase)",
          genericName: "Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg",
          form: "Tablet",
          dosage: "1 Tablet",
          frequency: "1-0-1 (Twice Daily)",
          duration: "3 Days",
          timing: "After Food",
          notes: "For pain & swelling",
        },
        {
          medicine: "Pan-D (Pantoprazole + Domperidone)",
          genericName: "Pantoprazole 40mg + Domperidone 30mg",
          form: "Capsule",
          dosage: "1 Capsule",
          frequency: "1-0-0 (Once Daily - Morning)",
          duration: "5 Days",
          timing: "Empty Stomach",
          notes: "Gastric protection",
        },
      ]);
      setIsLoaded(true);
    }
  }, [isOpen, existingRx, isRxLoading, encounter]);

  if (!isOpen) return null;

  // ── 1-Click Clinical Template Applicator ────────────────────────────────
  const handleApplyTemplate = (tpl: PrescriptionTemplate) => {
    setDiagnosis(tpl.defaultDiagnosis);
    if (!chiefComplaint) setChiefComplaint(tpl.defaultChiefComplaint);
    setMedications([...tpl.medications]);
    setAdvice(tpl.advice);
    setDietInstructions(tpl.dietInstructions);
    setOralHygieneInstructions(tpl.oralHygieneInstructions);
    setAdditionalInstructions(tpl.additionalInstructions);

    if (tpl.suggestedFollowUpDays > 0) {
      const followUp = new Date();
      followUp.setDate(followUp.getDate() + tpl.suggestedFollowUpDays);
      setFollowUpDate(followUp.toISOString().split("T")[0]);
      setFollowUpReason(tpl.followUpReason);
    }

    showToast(`Loaded clinical template: "${tpl.name}"`);
  };

  // ── Medication Handlers ─────────────────────────────────────────────────
  const handleMedChange = (index: number, field: keyof Medication, val: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: val };
    setMedications(updated);
  };

  const handleSelectMedicationFromCatalog = (index: number, item: DentalMedicationItem) => {
    const updated = [...medications];
    updated[index] = {
      medicine: `${item.brandName} (${item.genericName})`,
      genericName: item.genericName,
      form: item.form,
      dosage: item.defaultDosage,
      frequency: item.defaultFrequency,
      duration: item.defaultDuration,
      timing: item.defaultInstruction.includes("Empty") ? "Empty Stomach" : "After Food",
      notes: item.defaultInstruction,
      drugClass: item.drugClass,
    };
    setMedications(updated);
    setActiveSearchIndex(null);
    setSearchQuery("");
  };

  const addMedication = (prefill?: Partial<Medication>) => {
    setMedications([
      ...medications,
      {
        medicine: prefill?.medicine || "",
        dosage: prefill?.dosage || "1 Tablet",
        frequency: prefill?.frequency || "1-0-1 (Twice Daily)",
        duration: prefill?.duration || "5 Days",
        timing: prefill?.timing || "After Food",
        notes: prefill?.notes || "",
        form: prefill?.form || "Tablet",
        genericName: prefill?.genericName,
      },
    ]);
  };

  const removeMedication = (index: number) => {
    if (medications.length === 1) {
      setMedications([
        { medicine: "", dosage: "", frequency: "", duration: "", timing: "After Food", notes: "" },
      ]);
      return;
    }
    setMedications(medications.filter((_, i) => i !== index));
  };

  const moveMedication = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === medications.length - 1)
    )
      return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...medications];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setMedications(updated);
  };

  // ── Save Handler ───────────────────────────────────────────────────────
  const handleSave = async (): Promise<string | null> => {
    const validMeds = medications.filter((m) => m.medicine.trim() !== "");

    if (validMeds.length === 0 && !diagnosis.trim()) {
      showToast("Please enter a diagnosis or add at least one medicine.");
      return null;
    }

    setSaving(true);
    try {
      const rxData: Omit<Prescription, "createdAt" | "updatedAt" | "prescriptionId"> & {
        prescriptionId?: string;
      } = {
        encounterId: encounter.id,
        patientId: patient.id,
        patientName: patient.name,
        patientPhone: patient.phone,
        patientAge: patient.age || "",
        patientGender: patient.gender || "",
        appointmentId: encounter.appointmentId || "",
        doctorId: encounter.doctorId || "",
        doctorName: encounter.doctorName || clinicInfo?.doctorName || "Dr. Julian Moore",
        doctorSpecialization: clinicInfo?.qualification || "Dental Surgeon",
        doctorRegistrationNumber: clinicInfo?.registrationNumber || "",
        clinicName: clinicInfo?.clinicName || "Sanjivani Dentals",
        clinicAddress: `${clinicInfo?.addressLine1 || ""}, ${clinicInfo?.city || ""}`.trim(),
        clinicPhone: clinicInfo?.phone || "",
        prescriptionNumber,
        chiefComplaint,
        diagnosis,
        medications: validMeds,
        advice,
        dietInstructions,
        oralHygieneInstructions,
        additionalInstructions,
        followUpDate,
        followUpReason,
      };

      if (prescriptionId !== "temp") {
        rxData.prescriptionId = prescriptionId;
      }

      const savedId = await savePrescription(rxData);
      setPrescriptionId(savedId);

      queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.byEncounter(encounter.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.encounters(patient.id) });
      if (savedId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.byId(savedId) });
      }

      showToast("Prescription saved successfully!");
      if (onSuccess) onSuccess();
      return savedId;
    } catch (err) {
      console.error("Failed to save prescription:", err);
      showToast("Error saving prescription. Please try again.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  // ── Print Handler ──────────────────────────────────────────────────────
  const handlePrint = async () => {
    let targetId = prescriptionId;
    if (targetId === "temp") {
      const savedId = await handleSave();
      if (!savedId) return;
      targetId = savedId;
    }
    window.open(`/admin/prescriptions/${targetId}/print`, "_blank");
  };

  // ── WhatsApp Handler ───────────────────────────────────────────────────
  const handleWhatsApp = async () => {
    if (isSendingWhatsApp) {
      showToast("Message is already being sent.");
      return;
    }

    setIsSendingWhatsApp(true);

    try {
      showToast("Saving latest changes...");
      const savedId = await handleSave();
      if (!savedId) {
        showToast("Failed to save prescription. Please try again.");
        return;
      }
      const targetId = savedId;

      showToast("Sending WhatsApp prescription...");

      const res = await sendWhatsAppMessage({
        messageType: "prescription",
        recipient: patient.phone,
        patientId: patient.id,
        patientName: patient.name,
        encounterId: encounter.id,
        prescriptionId: targetId,
        clinicName: clinicInfo?.clinicName || "Sanjivani Dentals",
        doctorName: encounter.doctorName || clinicInfo?.doctorName || "Dr. Julian Moore",
      });

      if (res.success) {
        showToast(res.message);
      } else {
        showToast(res.message || "Opening WhatsApp Web fallback...");
        const cleanPhone = patient.phone.replace(/\D/g, "");
        const validMeds = medications.filter((m) => m.medicine.trim() !== "");
        const medSummary = validMeds
          .map((m, i) => `${i + 1}. *${m.medicine}*\n   Dosage: ${m.dosage || "1 Tab"} | ${m.frequency} | ${m.duration} (${m.timing || "After Food"})`)
          .join("\n\n");
        const fallbackMsg = `*${clinicInfo?.clinicName || "SANJIVANI DENTALS"} — DIGITAL PRESCRIPTION*\n\nDear *${patient.name}*,\nHere is your prescription for visit on ${encounter.visitDate}:\n\n🩺 *Diagnosis:* ${diagnosis || "Dental Treatment"}\n\n💊 *Prescribed Medications:*\n${medSummary}\n\n⚠️ *Doctor Advice:* ${advice || "Take all medicines as directed."}\n🗓️ *Next Visit:* ${followUpDate || "As needed"}\n\n_Wish you a speedy recovery!_ ✨`;
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(fallbackMsg)}`, "_blank");
      }
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  // ── Email Handler ──────────────────────────────────────────────────────
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const handleEmail = async () => {
    if (!patient.email) {
      showToast("Patient has no registered email address.");
      return;
    }

    let targetId = prescriptionId;
    if (targetId === "temp") {
      const savedId = await handleSave();
      if (!savedId) return;
      targetId = savedId;
    }

    setIsSendingEmail(true);
    showToast("Sending email with prescription PDF...");

    try {
      await sendPrescriptionEmail({
        prescriptionId: targetId,
        patientEmail: patient.email,
        patientName: patient.name,
        clinicName: clinicInfo?.clinicName || "Sanjivani Dentals",
      });
      showToast("Prescription emailed successfully!");
    } catch (err: any) {
      console.error("[PrescriptionModal] Email error:", err);
      showToast(err?.message || "Failed to send prescription email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[94vh] overflow-hidden font-sans">
        
        {/* ─── MODAL HEADER ─── */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 px-6 py-3.5 flex items-center justify-between text-white shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Zap className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Smart Doctor Prescription Generator
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {prescriptionNumber}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Patient: <strong className="text-white">{patient.name}</strong> ({patient.gender || "—"}, {patient.age ? `${patient.age} yrs` : "—"}) • Visit: {encounter.visitDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Switcher */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-1 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "edit"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" /> Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "preview"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Preview PDF
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── 1-CLICK CLINICAL TEMPLATES BAR (Top Quick Action) ─── */}
        <div className="bg-indigo-50/70 border-b border-indigo-100 px-6 py-2.5 flex items-center justify-between gap-3 overflow-x-auto shrink-0 select-none">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>1-Click Clinical Templates:</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            {DENTAL_PRESCRIPTION_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border whitespace-nowrap shadow-2xs hover:scale-102 ${tpl.badgeColor} hover:shadow-xs`}
                title={`Load complete regimen for ${tpl.name}`}
              >
                + {tpl.name}
              </button>
            ))}
          </div>
        </div>

        {/* ─── REAL-TIME DRUG ALLERGY & SAFETY ALERTS BANNER ─── */}
        {safetyAlerts.length > 0 && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-3 space-y-2 shrink-0 animate-in fade-in">
            {criticalAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start justify-between gap-3 text-xs text-rose-900 bg-white p-2.5 rounded-xl border border-rose-300 shadow-2xs">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-rose-700 uppercase tracking-wide text-[10px] bg-rose-100 px-2 py-0.5 rounded mr-1.5">
                      {alert.severity} • {alert.sourceCategory}
                    </span>
                    <strong className="text-slate-900">{alert.title}:</strong> {alert.description}
                    {alert.safeAlternative && (
                      <p className="text-emerald-800 font-semibold mt-1">
                        💡 <strong>Recommended Alternative:</strong> {alert.safeAlternative}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {warningAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start justify-between gap-3 text-xs text-amber-900 bg-amber-50/80 p-2.5 rounded-xl border border-amber-300 shadow-2xs">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-amber-700 uppercase tracking-wide text-[10px] bg-amber-100 px-2 py-0.5 rounded mr-1.5">
                      {alert.severity} • {alert.sourceCategory}
                    </span>
                    <strong className="text-slate-900">{alert.title}:</strong> {alert.description}
                    {alert.safeAlternative && (
                      <p className="text-emerald-800 font-semibold mt-0.5">
                        💡 {alert.safeAlternative}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── MODAL BODY ─── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8fafc]">
          {isRxLoading || !isLoaded ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">
                Loading smart prescription workspace...
              </p>
            </div>
          ) : activeTab === "edit" ? (
            /* ═══════════ EDITOR MODE ═══════════ */
            <div className="space-y-6">
              
              {/* Diagnosis & Clinical Impression */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-indigo-600" />
                    Clinical Impression & Diagnosis
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Auto-populates from Case Paper
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Chief Complaint / Clinical Notes
                    </label>
                    <input
                      type="text"
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      placeholder="e.g. Sharp pain on mastication #16, bleeding on probing"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Definitive Diagnosis *
                    </label>
                    <input
                      type="text"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="e.g. Irreversible Pulpitis #16, Post-Op Extraction #38"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* ─── MEDICATIONS LIST (Rx) ─── */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      Prescribed Medications (Rx)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Search standard drug catalog or type custom molecules. Click frequency shortcuts for 1-click updates.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addMedication()}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Medicine
                  </button>
                </div>

                {/* Medication Rows */}
                <div className="space-y-4">
                  {medications.map((med, idx) => {
                    const isSearchingThisRow = activeSearchIndex === idx;
                    const matchingCatalogItems = searchQuery
                      ? DENTAL_MEDICATION_CATALOG.filter(
                          (item) =>
                            item.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.searchKeywords.some((k) => k.includes(searchQuery.toLowerCase()))
                        ).slice(0, 6)
                      : DENTAL_MEDICATION_CATALOG.slice(0, 6);

                    return (
                      <div
                        key={idx}
                        className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3 text-xs hover:border-slate-300 transition-colors relative"
                      >
                        {/* Row Header */}
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                          <span className="font-bold text-indigo-950 flex items-center gap-2 text-xs">
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono text-[11px] flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <span>Item #{idx + 1}</span>
                            {med.drugClass && (
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-semibold">
                                {med.drugClass}
                              </span>
                            )}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveMedication(idx, "up")}
                              disabled={idx === 0}
                              className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveMedication(idx, "down")}
                              disabled={idx === medications.length - 1}
                              className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeMedication(idx)}
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer ml-1"
                              title="Remove Medicine"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Row Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
                          
                          {/* Medicine Name with Smart Autocomplete */}
                          <div className="md:col-span-5 relative">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Medicine (Brand / Generic Molecule) *
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={med.medicine}
                                onChange={(e) => {
                                  handleMedChange(idx, "medicine", e.target.value);
                                  setSearchQuery(e.target.value);
                                  setActiveSearchIndex(idx);
                                }}
                                onFocus={() => {
                                  setActiveSearchIndex(idx);
                                  setSearchQuery(med.medicine);
                                }}
                                placeholder="Search e.g. Augmentin, Zerodol, Flagyl, Hexidine..."
                                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                            </div>

                            {/* Autocomplete Suggestions Dropdown */}
                            {isSearchingThisRow && matchingCatalogItems.length > 0 && (
                              <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                                {matchingCatalogItems.map((catItem) => (
                                  <button
                                    key={catItem.id}
                                    type="button"
                                    onClick={() => handleSelectMedicationFromCatalog(idx, catItem)}
                                    className="w-full px-3 py-2 text-left hover:bg-indigo-50 transition-colors cursor-pointer flex items-center justify-between gap-2"
                                  >
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-slate-900 text-xs">{catItem.brandName}</span>
                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                                          {catItem.form}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-slate-500 block truncate">
                                        {catItem.genericName}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-indigo-600 font-bold font-mono shrink-0">
                                      {catItem.defaultFrequency.split(" ")[0]} • {catItem.defaultDuration}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Dosage */}
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Dosage
                            </label>
                            <input
                              type="text"
                              value={med.dosage}
                              onChange={(e) => handleMedChange(idx, "dosage", e.target.value)}
                              placeholder="e.g. 1 Tablet / 10 ml"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          {/* Duration */}
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Duration
                            </label>
                            <input
                              type="text"
                              value={med.duration}
                              onChange={(e) => handleMedChange(idx, "duration", e.target.value)}
                              placeholder="e.g. 5 Days / 1 Week"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          {/* Timing */}
                          <div className="md:col-span-3">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Food Timing
                            </label>
                            <select
                              value={med.timing || "After Food"}
                              onChange={(e) => handleMedChange(idx, "timing", e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                            >
                              {TIMING_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Frequency Shortcuts Bar on Each Row */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-500 mr-1">
                            Frequency:
                          </span>
                          {FREQUENCY_SHORTCUTS.map((freq) => {
                            const isActive = med.frequency === freq.code;
                            return (
                              <button
                                key={freq.code}
                                type="button"
                                onClick={() => handleMedChange(idx, "frequency", freq.code)}
                                className={`px-2 py-0.8 rounded-md text-[10px] font-bold transition-all cursor-pointer border ${
                                  isActive
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {freq.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Specific Instructions */}
                        <div>
                          <input
                            type="text"
                            value={med.notes || ""}
                            onChange={(e) => handleMedChange(idx, "notes", e.target.value)}
                            placeholder="Special directions (e.g. Swish 60s / Take with full glass of water / If severe pain)..."
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ─── ADVICE & POST-OP INSTRUCTIONS ─── */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Clinical Advice & Post-Op Guidelines
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      General Clinical Advice
                    </label>
                    <textarea
                      rows={2}
                      value={advice}
                      onChange={(e) => setAdvice(e.target.value)}
                      placeholder="General clinical guidance..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Dietary Restrictions / Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={dietInstructions}
                      onChange={(e) => setDietInstructions(e.target.value)}
                      placeholder="Soft diet, cold fluids, avoid hot/spicy items..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Oral Hygiene Protocol
                    </label>
                    <textarea
                      rows={2}
                      value={oralHygieneInstructions}
                      onChange={(e) => setOralHygieneInstructions(e.target.value)}
                      placeholder="Warm salt water rinses, soft brushing, flossing..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Additional Notes / Red-Flag Warnings
                    </label>
                    <textarea
                      rows={2}
                      value={additionalInstructions}
                      onChange={(e) => setAdditionalInstructions(e.target.value)}
                      placeholder="Emergency contact instructions, next procedure notes..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>

                {/* Follow-Up Schedule */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Next Follow-Up Visit Date
                    </label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Follow-Up Purpose / Clinical Goal
                    </label>
                    <input
                      type="text"
                      value={followUpReason}
                      onChange={(e) => setFollowUpReason(e.target.value)}
                      placeholder="e.g. Suture removal, crown fitting, healing review"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* ═══════════ PREVIEW MODE (PRINTABLE BRANDED LETTERHEAD) ═══════════ */
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl border border-slate-300 shadow-md space-y-6 font-sans">
              
              {/* Header Branding */}
              <div className="flex items-center justify-between border-b-2 border-indigo-600 pb-4">
                <div className="space-y-1">
                  <h1 className="text-xl font-black text-indigo-900 tracking-tight">
                    {clinicInfo?.clinicName || "SANJIVANI DENTAL CLINIC"}
                  </h1>
                  <p className="text-xs font-bold text-slate-800">
                    {encounter.doctorName || clinicInfo?.doctorName || "Dr. Julian Moore"}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {clinicInfo?.qualification || "BDS, MDS - Dental Surgeon"}
                    {clinicInfo?.registrationNumber ? ` · Reg No: ${clinicInfo.registrationNumber}` : ""}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {clinicInfo?.addressLine1}, {clinicInfo?.city} · Tel: {clinicInfo?.phone}
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 font-mono font-bold text-xs rounded-lg border border-indigo-200">
                    {prescriptionNumber}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Date: <strong>{encounter.visitDate}</strong>
                  </p>
                </div>
              </div>

              {/* Patient Info Row */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Patient Name</span>
                  <span className="font-extrabold text-slate-800 text-sm">{patient.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Age / Gender</span>
                  <span className="font-bold text-slate-700">
                    {patient.age ? `${patient.age} yrs` : "—"} / {patient.gender || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Contact Phone</span>
                  <span className="font-bold text-slate-700 font-mono">{patient.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Diagnosis</span>
                  <span className="font-extrabold text-indigo-700">{diagnosis || "Dental Examination"}</span>
                </div>
              </div>

              {/* Rx Medicines Table */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <span className="text-2xl font-black text-indigo-600 italic font-serif">Rx</span>
                  <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Prescribed Medications
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                        <th className="p-2.5 w-10 text-center">#</th>
                        <th className="p-2.5">Medicine Name</th>
                        <th className="p-2.5">Dosage</th>
                        <th className="p-2.5">Frequency</th>
                        <th className="p-2.5">Duration</th>
                        <th className="p-2.5">Timing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {medications
                        .filter((m) => m.medicine.trim() !== "")
                        .map((med, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-2.5 font-extrabold text-slate-900">
                              {med.medicine}
                              {med.notes && (
                                <span className="block text-[10px] font-normal text-slate-500 italic">
                                  Note: {med.notes}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-slate-700">{med.dosage || "—"}</td>
                            <td className="p-2.5 text-indigo-700 font-bold">{med.frequency || "—"}</td>
                            <td className="p-2.5 text-slate-700">{med.duration || "—"}</td>
                            <td className="p-2.5 text-slate-700">{med.timing || "—"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Advice & Instructions Box */}
              {(advice || dietInstructions || oralHygieneInstructions || additionalInstructions) && (
                <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <h4 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">
                    Advice & Special Instructions
                  </h4>
                  <ul className="space-y-1 text-slate-700 list-disc list-inside font-medium">
                    {advice && <li>{advice}</li>}
                    {dietInstructions && <li>Diet: {dietInstructions}</li>}
                    {oralHygieneInstructions && <li>Oral Hygiene: {oralHygieneInstructions}</li>}
                    {additionalInstructions && <li>Note: {additionalInstructions}</li>}
                  </ul>
                </div>
              )}

              {/* Follow Up & Doctor Signature */}
              <div className="pt-6 border-t border-slate-200 flex items-end justify-between gap-4 text-xs">
                <div>
                  {followUpDate ? (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-medium">
                      <span className="font-bold block">🗓️ Next Follow-Up Visit:</span>
                      <span>{followUpDate} {followUpReason ? `(${followUpReason})` : ""}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Follow-up: As needed</span>
                  )}
                </div>

                <div className="text-right space-y-8">
                  <div className="h-10"></div>
                  <div className="border-t border-slate-400 pt-1">
                    <p className="font-bold text-slate-800">
                      {encounter.doctorName || clinicInfo?.doctorName || "Dr. Julian Moore"}
                    </p>
                    <p className="text-[10px] text-slate-500">Authorized Signature & Stamp</p>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <p className="text-[10px] text-center text-slate-400 pt-4 border-t border-slate-100">
                {clinicInfo?.prescriptionFooterText || "Take medicines strictly as prescribed. For emergency assistance call clinic helpline."}
              </p>
            </div>
          )}
        </div>

        {/* ─── MODAL FOOTER ACTIONS ─── */}
        <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0 flex-wrap gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleWhatsApp}
              disabled={isSendingWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-bold text-xs border border-emerald-200 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSendingWhatsApp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
              {isSendingWhatsApp ? "Sending..." : "1-Click WhatsApp"}
            </button>

            <button
              type="button"
              onClick={handleEmail}
              className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-bold text-xs border border-blue-200 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" /> Email PDF
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Prescription
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
