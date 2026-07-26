"use client";

import React, { useState, useEffect } from "react";
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
  Clock,
  Sparkles,
} from "lucide-react";
import type {
  PatientEncounter,
  Patient,
  Medication,
  Prescription,
  ClinicBasicInfo,
} from "../../../lib/types";
import { getClinicInfo } from "../../../lib/services/settingsService";
import {
  getPrescriptionByEncounter,
  getPrescriptionById,
  savePrescription,
  generatePrescriptionNumber,
} from "../../../lib/services/prescriptionService";
import { sendWhatsAppMessage } from "../../../lib/services/whatsappService";
import { queryKeys } from "../../../lib/query/queryKeys";

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  encounter: PatientEncounter;
  patient: Patient;
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

const FREQUENCY_OPTIONS = [
  "1-0-1 (Twice Daily)",
  "1-1-1 (Three Times Daily)",
  "1-0-0 (Once Daily - Morning)",
  "0-0-1 (Once Daily - Night)",
  "0-1-0 (Once Daily - Afternoon)",
  "2-0-2 (Two Twice Daily)",
  "Every 8 Hours",
  "Every 6 Hours",
  "Every 4 Hours",
  "Stat (Immediately)",
];

export function PrescriptionModal({
  isOpen,
  onClose,
  encounter,
  patient,
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
    { medicine: "", dosage: "", frequency: "1-0-1 (Twice Daily)", duration: "5 Days", timing: "After Food", notes: "" },
  ]);
  const [advice, setAdvice] = useState<string>("");
  const [dietInstructions, setDietInstructions] = useState<string>("");
  const [oralHygieneInstructions, setOralHygieneInstructions] = useState<string>("");
  const [additionalInstructions, setAdditionalInstructions] = useState<string>("");
  const [followUpDate, setFollowUpDate] = useState<string>("");
  const [followUpReason, setFollowUpReason] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

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
              dosage: m.dosage || "",
              frequency: m.frequency || "",
              duration: m.duration || "",
              timing: m.timing || "After Food",
              notes: m.notes || "",
            }))
          : [{ medicine: "", dosage: "", frequency: "1-0-1 (Twice Daily)", duration: "5 Days", timing: "After Food", notes: "" }]
      );
      setAdvice(existingRx.advice || "");
      setDietInstructions(existingRx.dietInstructions || "");
      setOralHygieneInstructions(existingRx.oralHygieneInstructions || "");
      setAdditionalInstructions(existingRx.additionalInstructions || "");
      setFollowUpDate(existingRx.followUpDate || encounter.followUpDate || "");
      setFollowUpReason(existingRx.followUpReason || "");
      setIsLoaded(true);
    } else if (!isRxLoading) {
      // Create new draft with auto-populated fields from encounter & patient
      setPrescriptionId("temp");
      setPrescriptionNumber(generatePrescriptionNumber());
      setChiefComplaint(encounter.chiefComplaint || "");
      setDiagnosis(encounter.diagnosis || (encounter.treatments ? encounter.treatments.join(" • ") : ""));
      setFollowUpDate(encounter.followUpDate || "");
      setFollowUpReason("");
      setAdvice("Take all medications strictly as prescribed.");
      setDietInstructions("Avoid extremely hot or hard food items for 24 hours.");
      setOralHygieneInstructions("Maintain warm salt water rinses 3 times daily.");
      setAdditionalInstructions("");
      setMedications([
        { medicine: "", dosage: "1 Tablet", frequency: "1-0-1 (Twice Daily)", duration: "5 Days", timing: "After Food", notes: "" },
      ]);
      setIsLoaded(true);
    }
  }, [isOpen, existingRx, isRxLoading, encounter]);

  if (!isOpen) return null;

  // ── Medication Handlers ─────────────────────────────────────────────────
  const handleMedChange = (index: number, field: keyof Medication, val: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: val };
    setMedications(updated);
  };

  const addMedication = () => {
    setMedications([
      ...medications,
      { medicine: "", dosage: "1 Tablet", frequency: "1-0-1 (Twice Daily)", duration: "5 Days", timing: "After Food", notes: "" },
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

      // Invalidate queries so encounter log & prescription views refetch
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
    // Open dedicated print view
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
      let targetId = prescriptionId;
      if (targetId === "temp") {
        const savedId = await handleSave();
        if (!savedId) return;
        targetId = savedId;
      }

      showToast("Sending WhatsApp message via Twilio...");
      const publicUrl = `${window.location.origin}/prescriptions/${targetId}`;

      const res = await sendWhatsAppMessage({
        messageType: "prescription",
        recipient: patient.phone,
        patientId: patient.id,
        patientName: patient.name,
        encounterId: encounter.id,
        clinicName: clinicInfo?.clinicName || "Sanjivani Dentals",
        doctorName: encounter.doctorName || clinicInfo?.doctorName || "Dr. Julian Moore",
        mediaUrl: publicUrl,
      });

      if (res.success) {
        showToast(res.message);
      } else if (res.code === "REQUEST_ALREADY_IN_PROGRESS") {
        showToast("Message is already being sent.");
      } else {
        // Graceful fallback to direct WhatsApp Web if Twilio credentials not set or error
        showToast(res.message || "Twilio unconfigured. Opening WhatsApp Web fallback...");
        const cleanPhone = patient.phone.replace(/\D/g, "");
        const validMeds = medications.filter((m) => m.medicine.trim() !== "");
        const medSummary = validMeds
          .map((m) => `• ${m.medicine} (${m.dosage}) - ${m.frequency} for ${m.duration}`)
          .join("\n");
        const fallbackMsg = `Hello *${patient.name}*! 👋\nHere is your digital prescription from *${clinicInfo?.clinicName || "Sanjivani Dentals"}*:\n\n*Diagnosis:* ${diagnosis || "Consultation"}\n\n*Medications:*\n${medSummary || "See full document"}\n\n📄 *View/Download Full Prescription:* ${publicUrl}\n\nWish you a speedy recovery! 😊`;
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(fallbackMsg)}`, "_blank");
      }
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  // ── Email Handler ──────────────────────────────────────────────────────
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

    const subject = `Digital Prescription — ${clinicInfo?.clinicName || "Sanjivani Dentals"}`;
    const body = `Dear ${patient.name},\n\nPlease find your digital prescription link below:\n${window.location.origin}/prescriptions/${targetId}\n\nPrescription #: ${prescriptionNumber}\nDate: ${encounter.visitDate}\nDoctor: ${encounter.doctorName || "Dr. Julian Moore"}\n\nWarm regards,\n${clinicInfo?.clinicName || "Sanjivani Dentals"}`;

    window.open(`mailto:${patient.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-outline-variant/20 flex flex-col max-h-[92vh] overflow-hidden font-sans">
        {/* Modal Header */}
        <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant/15 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-on-surface">
                  Digital Dental Prescription
                </h2>
                <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {prescriptionNumber}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Linked to Visit Encounter ({encounter.visitDate}) • Patient: <strong className="text-on-surface">{patient.name}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher */}
            <div className="bg-white border border-outline-variant/30 rounded-xl p-1 flex items-center gap-1 shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "edit"
                    ? "bg-primary text-white shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" /> Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "preview"
                    ? "bg-primary text-white shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Preview
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8fafc]">
          {isRxLoading || !isLoaded ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              <p className="text-xs text-on-surface-variant font-medium">
                Loading prescription data & clinic profile...
              </p>
            </div>
          ) : activeTab === "edit" ? (
            /* EDITOR MODE */
            <div className="space-y-6">
              {/* Header Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Patient Summary Card */}
                <div className="bg-white p-4 rounded-2xl border border-outline-variant/15 shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-wider block">
                    Patient Profile
                  </span>
                  <p className="font-bold text-on-surface text-sm">{patient.name}</p>
                  <p className="text-on-surface-variant">
                    {patient.gender ? `${patient.gender} · ` : ""}
                    {patient.age ? `${patient.age} yrs · ` : ""}
                    ID: #{patient.id.slice(0, 8)}
                  </p>
                  <p className="text-on-surface-variant font-mono">{patient.phone}</p>
                </div>

                {/* Encounter Summary Card */}
                <div className="bg-white p-4 rounded-2xl border border-outline-variant/15 shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-wider block">
                    Encounter Visit Details
                  </span>
                  <p className="font-bold text-on-surface text-sm">
                    Date: {encounter.visitDate}
                  </p>
                  <p className="text-on-surface-variant truncate" title={encounter.treatments?.join(", ")}>
                    Treatments: {encounter.treatments?.join(" • ") || "Consultation"}
                  </p>
                  <p className="text-on-surface-variant truncate" title={encounter.chiefComplaint}>
                    Complaint: {encounter.chiefComplaint || "Routine Checkup"}
                  </p>
                </div>

                {/* Doctor / Clinic Info Card */}
                <div className="bg-white p-4 rounded-2xl border border-outline-variant/15 shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-wider block">
                    Doctor & Clinic Info
                  </span>
                  <p className="font-bold text-on-surface text-sm">
                    {encounter.doctorName || clinicInfo?.doctorName || "Dr. Julian Moore"}
                  </p>
                  <p className="text-on-surface-variant">
                    {clinicInfo?.qualification || "BDS, MDS - Dental Surgeon"}
                  </p>
                  <p className="text-on-surface-variant font-semibold text-primary">
                    {clinicInfo?.clinicName || "Sanjivani Dentals"}
                  </p>
                </div>
              </div>

              {/* Diagnosis & Chief Complaint Inputs */}
              <div className="bg-white p-5 rounded-2xl border border-outline-variant/15 shadow-xs space-y-4">
                <h3 className="text-xs font-extrabold text-primary uppercase tracking-wider flex items-center gap-2">
                  <Stethoscope className="w-4 h-4" /> Clinical Impression & Diagnosis
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      Chief Complaint
                    </label>
                    <input
                      type="text"
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      placeholder="e.g. Toothache in upper right molar, bleeding gums"
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 text-xs bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      Diagnosis *
                    </label>
                    <input
                      type="text"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="e.g. Deep dental caries (Tooth #16), irreversible pulpitis"
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 text-xs bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Medicines List Section */}
              <div className="bg-white p-5 rounded-2xl border border-outline-variant/15 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
                  <div>
                    <h3 className="text-xs font-extrabold text-primary uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Prescribed Medications (Rx)
                    </h3>
                    <p className="text-[11px] text-on-surface-variant">
                      Add, edit, or reorder prescribed drugs and dosages.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addMedication}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Medicine
                  </button>
                </div>

                {/* Medications Table / Rows */}
                <div className="space-y-3">
                  {medications.map((med, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                        <span className="font-extrabold text-primary flex items-center gap-1.5 text-[11px]">
                          <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                            {idx + 1}
                          </span>
                          Medicine #{idx + 1}
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
                            className="p-1 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer ml-1"
                            title="Remove Medicine"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Medicine Name */}
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Medicine Name *
                          </label>
                          <input
                            type="text"
                            value={med.medicine}
                            onChange={(e) => handleMedChange(idx, "medicine", e.target.value)}
                            placeholder="e.g. Tab Amoxicillin + Clavulanic Acid 625mg"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        {/* Dosage */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Dosage
                          </label>
                          <input
                            type="text"
                            value={med.dosage}
                            onChange={(e) => handleMedChange(idx, "dosage", e.target.value)}
                            placeholder="e.g. 1 Tablet / 500mg"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        {/* Duration */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Duration
                          </label>
                          <input
                            type="text"
                            value={med.duration}
                            onChange={(e) => handleMedChange(idx, "duration", e.target.value)}
                            placeholder="e.g. 5 Days / 1 Week"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        {/* Frequency */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Frequency
                          </label>
                          <input
                            type="text"
                            list={`freq-options-${idx}`}
                            value={med.frequency}
                            onChange={(e) => handleMedChange(idx, "frequency", e.target.value)}
                            placeholder="e.g. 1-0-1 (Twice Daily)"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <datalist id={`freq-options-${idx}`}>
                            {FREQUENCY_OPTIONS.map((opt) => (
                              <option key={opt} value={opt} />
                            ))}
                          </datalist>
                        </div>

                        {/* Timing */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Timing
                          </label>
                          <select
                            value={med.timing || "After Food"}
                            onChange={(e) => handleMedChange(idx, "timing", e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
                          >
                            {TIMING_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Specific Notes */}
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Specific Instructions / Notes
                          </label>
                          <input
                            type="text"
                            value={med.notes || ""}
                            onChange={(e) => handleMedChange(idx, "notes", e.target.value)}
                            placeholder="e.g. Take with plenty of water / If severe pain"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advice, Instructions & Follow-up Section */}
              <div className="bg-white p-5 rounded-2xl border border-outline-variant/15 shadow-xs space-y-4">
                <h3 className="text-xs font-extrabold text-primary uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Doctor Advice & Instructions
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-on-surface mb-1">
                      General Advice
                    </label>
                    <textarea
                      rows={2}
                      value={advice}
                      onChange={(e) => setAdvice(e.target.value)}
                      placeholder="General clinical advice..."
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">
                      Dietary Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={dietInstructions}
                      onChange={(e) => setDietInstructions(e.target.value)}
                      placeholder="Diet restrictions or recommendations..."
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">
                      Oral Hygiene Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={oralHygieneInstructions}
                      onChange={(e) => setOralHygieneInstructions(e.target.value)}
                      placeholder="Brushing, rinsing, mouthwash instructions..."
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">
                      Additional Notes
                    </label>
                    <textarea
                      rows={2}
                      value={additionalInstructions}
                      onChange={(e) => setAdditionalInstructions(e.target.value)}
                      placeholder="Any additional notes..."
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                </div>

                {/* Follow-up schedule */}
                <div className="pt-3 border-t border-outline-variant/10 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-on-surface mb-1">
                      Next Follow-Up Visit Date
                    </label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">
                      Follow-Up Purpose / Reason
                    </label>
                    <input
                      type="text"
                      value={followUpReason}
                      onChange={(e) => setFollowUpReason(e.target.value)}
                      placeholder="e.g. Suture removal, crown fitting, review"
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* PREVIEW MODE */
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl border border-slate-300 shadow-md space-y-6 font-sans">
              {/* Prescription Branding Header */}
              <div className="flex items-center justify-between border-b-2 border-primary pb-4">
                <div className="space-y-1">
                  <h1 className="text-xl font-black text-primary tracking-tight">
                    {clinicInfo?.clinicName || "SANJIVANI DENTALS"}
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
                  <div className="inline-block px-3 py-1 bg-primary/10 text-primary font-mono font-bold text-xs rounded-lg border border-primary/20">
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
                    {patient.age ? `${patient.age} yrs` : "N/A"} / {patient.gender || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Patient ID / Phone</span>
                  <span className="font-bold text-slate-700">{patient.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Diagnosis</span>
                  <span className="font-extrabold text-primary">{diagnosis || "Dental Checkup"}</span>
                </div>
              </div>

              {/* Rx Medicines Table */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <span className="text-2xl font-black text-primary italic font-serif">Rx</span>
                  <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Prescribed Medicines
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
                            <td className="p-2.5 text-slate-700 font-semibold">{med.frequency || "—"}</td>
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

        {/* Modal Footer Actions */}
        <div className="bg-white px-6 py-4 border-t border-outline-variant/15 flex items-center justify-between shrink-0 flex-wrap gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary hover:bg-surface-container-low transition-all cursor-pointer"
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
              {isSendingWhatsApp ? "Sending..." : "WhatsApp"}
            </button>

            <button
              type="button"
              onClick={handleEmail}
              className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-bold text-xs border border-blue-200 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" /> Email
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-surface-container text-on-surface font-bold text-xs hover:bg-surface-container-high border border-outline-variant/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50"
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
