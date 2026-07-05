"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Stethoscope,
  Plus,
  Trash2,
  Save,
  Printer,
  ChevronLeft,
  Loader2,
  FileText,
  User,
  Activity,
  PlusCircle,
  CheckCircle2,
  Send,
} from "lucide-react";
import { AdminAuthGuard } from "../../../../components/auth/AdminAuthGuard";
import { getPatientById } from "../../../../lib/services/patientService";
import {
  getAppointmentById,
  getAppointmentsByPhone,
} from "../../../../lib/services/appointmentService";
import {
  getPrescriptionByAppointment,
  savePrescription,
  generatePrescriptionNumber,
} from "../../../../lib/services/prescriptionService";
import type { Patient, Appointment, Medication, Prescription } from "../../../../lib/types";
import { queryKeys } from "../../../../lib/query/queryKeys";
import Link from "next/link";
import { PrescriptionFormSkeleton, useDelayLoading } from "../../../../components/ui/Skeletons";

function PrescriptionEditorContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");
  const appointmentIdParam = searchParams.get("appointmentId");

  // ── Prescription Form State ───────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [prescriptionId, setPrescriptionId] = useState<string>("temp");
  const [prescriptionNumber, setPrescriptionNumber] = useState<string>("");
  const [diagnosis, setDiagnosis] = useState<string>("");
  const [medications, setMedications] = useState<Medication[]>([
    { medicine: "", dosage: "", frequency: "", duration: "" },
  ]);
  const [additionalInstructions, setAdditionalInstructions] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);
  // Track whether form has been initialised from Firestore data.
  const [formInitialised, setFormInitialised] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Redirect if patientId is missing.
  useEffect(() => {
    if (!patientId) router.replace("/admin/patients");
  }, [patientId, router]);

  // ── React Query: Patient ────────────────────────────────────────────────
  const { data: patient } = useQuery<Patient | null>({
    queryKey: queryKeys.patients.byId(patientId ?? ""),
    queryFn: async () => {
      const p = await getPatientById(patientId!);
      if (!p) {
        showToast("Patient not found.");
        router.replace("/admin/patients");
      }
      return p;
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // ── React Query: Appointment ───────────────────────────────────────────
  // If appointmentId param is present, fetch it directly.
  // Otherwise wait for patient to load, then fetch most recent appointment by phone.
  const { data: appointment } = useQuery<Appointment | null>({
    queryKey: appointmentIdParam
      ? queryKeys.appointments.byId(appointmentIdParam)
      : queryKeys.appointments.byPhone(patient?.phone ?? "", 5),
    queryFn: async () => {
      if (appointmentIdParam) {
        return getAppointmentById(appointmentIdParam);
      }
      const apts = await getAppointmentsByPhone(patient!.phone, 5);
      return apts.length > 0 ? apts[0] : null;
    },
    enabled: appointmentIdParam ? !!patientId : !!patient?.phone,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // ── React Query: Existing Prescription ────────────────────────────────
  const { data: existingPrescription } = useQuery<Prescription | null>({
    queryKey: queryKeys.prescriptions.byAppointment(appointment?.id ?? ""),
    queryFn: () => getPrescriptionByAppointment(appointment!.id),
    enabled: !!appointment?.id,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });

  // ── Initialise form state once when prescription data arrives ──────────
  useEffect(() => {
    if (formInitialised) return;
    // appointment has resolved (could be null = no appointment for this patient yet)
    if (appointment === undefined) return;

    if (existingPrescription) {
      setPrescriptionId(existingPrescription.prescriptionId);
      setPrescriptionNumber(existingPrescription.prescriptionNumber);
      setDiagnosis(existingPrescription.diagnosis || "");
      setMedications(
        existingPrescription.medications.length > 0
          ? existingPrescription.medications
          : [{ medicine: "", dosage: "", frequency: "", duration: "" }]
      );
      setAdditionalInstructions(existingPrescription.additionalInstructions || "");
      setFormInitialised(true);
    } else if (existingPrescription === null) {
      // No existing prescription — generate a new number.
      setPrescriptionNumber(generatePrescriptionNumber());
      setFormInitialised(true);
    }
  }, [existingPrescription, appointment, formInitialised]);

  // Also set a prescription number when there is no appointment at all.
  useEffect(() => {
    if (formInitialised) return;
    if (appointment === null) {
      setPrescriptionNumber(generatePrescriptionNumber());
      setFormInitialised(true);
    }
  }, [appointment, formInitialised]);

  // ── Derived loading state ─────────────────────────────────────────────
  const isPatientLoading = !!patientId && patient === undefined;
  const isAppointmentLoading =
    patient !== undefined &&
    patient !== null &&
    appointment === undefined;
  const isPrescriptionLoading =
    appointment !== undefined &&
    appointment !== null &&
    existingPrescription === undefined;
  const isLoading = isPatientLoading || isAppointmentLoading || isPrescriptionLoading || !formInitialised;
  const showSkeleton = useDelayLoading(isLoading, 300);


  // Medication list handlers
  const handleMedicationChange = (
    index: number,
    field: keyof Medication,
    value: string
  ) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const addMedicationRow = () => {
    setMedications([
      ...medications,
      { medicine: "", dosage: "", frequency: "", duration: "" },
    ]);
  };

  const removeMedicationRow = (index: number) => {
    if (medications.length === 1) {
      setMedications([{ medicine: "", dosage: "", frequency: "", duration: "" }]);
      return;
    }
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleSave = async (triggerWhatsApp = false): Promise<string | null> => {
    if (!patient || !appointment) {
      showToast("Cannot save: Missing patient or appointment data.");
      return null;
    }

    // Filter out blank medication rows
    const validMedications = medications.filter(
      (m) => m.medicine.trim() !== ""
    );

    setSaving(true);
    try {
      const data: Omit<Prescription, "createdAt" | "updatedAt" | "prescriptionId"> & {
        prescriptionId?: string;
      } = {
        patientId: patient.id,
        patientName: patient.name,
        patientPhone: patient.phone,
        patientAge: patient.age || "",
        appointmentId: appointment.id,
        doctorId: "dr-julian-moore",
        prescriptionNumber,
        diagnosis,
        medications: validMedications,
        additionalInstructions,
      };

      if (prescriptionId !== "temp") {
        data.prescriptionId = prescriptionId;
      }

      const savedId = await savePrescription(data);
      setPrescriptionId(savedId);
      // Invalidate cache so the public page and future editor loads see fresh data.
      queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.byAppointment(appointment.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.byId(savedId) });
      showToast("Prescription saved successfully!");

      if (triggerWhatsApp) {
        const publicLink = `${window.location.origin}/prescriptions/${savedId}`;
        const cleanPhone = patient.phone.replace(/\D/g, "");
        const message = `Hello ${patient.name}! 👋 This is Sanjivani Dentals. Here is a link to view your digital prescription: ${publicLink}\n\nWish you a speedy recovery! 😊`;
        window.open(
          `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`,
          "_blank"
        );
        router.push("/admin/patients");
      }
      return savedId;
    } catch (err) {
      console.error("Failed to save prescription:", err);
      showToast("Error saving prescription.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  if (showSkeleton) {
    return <PrescriptionFormSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#f2f5f8] font-sans pb-12">
      {/* Top Navigation */}
      <header className="bg-white border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-primary">
              Prescription Workflow
            </h1>
            <p className="text-xs text-on-surface-variant">
              Sanjivani Dentals Clinical Registry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 border border-outline-variant/40 bg-white hover:bg-surface-container-low text-on-surface rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Save & Send to WhatsApp
          </button>
        </div>
      </header>

      {/* Main Form container */}
      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        
        {/* PART A: Patient & Appointment Details (Auto-filled / View-only) */}
        <section className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2 border-b border-outline-variant/10 pb-2">
            <FileText className="w-4 h-4" /> Part A: Administrative Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            {/* Column 1: Patient details */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Patient Info
              </p>
              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-on-surface">
                    {patient?.name}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    ID: #{patient?.id?.slice(0, 8)}
                    {patient?.age ? ` · Age ${patient?.age}` : ""}
                    {patient?.gender ? ` · ${patient?.gender}` : ""}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {patient?.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Column 2: Appointment details */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Appointment Info
              </p>
              {appointment ? (
                <div className="flex items-start gap-2.5">
                  <Activity className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-on-surface">
                      {appointment.service}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Date: {appointment.date}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Time: {appointment.time}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant italic">
                  No active/scheduled appointments found
                </p>
              )}
            </div>

            {/* Column 3: Prescription details */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Prescription Metadata
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-medium">
                    Doc Name:
                  </span>
                  <span className="font-semibold text-on-surface">
                    Dr. Julian Moore
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-medium">
                    Serial No:
                  </span>
                  <span className="font-semibold text-primary">
                    {prescriptionNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-medium">
                    Date:
                  </span>
                  <span className="font-semibold text-on-surface">
                    {new Date().toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnosis Input */}
          <div className="pt-2">
            <label
              htmlFor="diagnosis"
              className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider"
            >
              Diagnosis *
            </label>
            <input
              id="diagnosis"
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Tooth abscess, gingivitis, routine cleaning"
              className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </section>

        {/* PART B: Medications & Instructions (Doctor Inputs) */}
        <section className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-6 space-y-6">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2 border-b border-outline-variant/10 pb-2">
            <Stethoscope className="w-4 h-4" /> Part B: Doctor Prescription Inputs
          </h2>

          {/* Medications Dynamic List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Medications List
              </h3>
              <button
                type="button"
                onClick={addMedicationRow}
                className="flex items-center gap-1 text-xs text-primary font-semibold px-2 py-1 rounded-md hover:bg-secondary-container/50 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Add Medicine
              </button>
            </div>

            {/* Table Header (hidden on mobile, visible on sm+) */}
            <div className="hidden sm:grid grid-cols-12 gap-3 px-3 py-2 bg-surface-container-low rounded-lg text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              <div className="col-span-4">Medicine Name</div>
              <div className="col-span-2">Dosage</div>
              <div className="col-span-3">Frequency</div>
              <div className="col-span-2">Duration</div>
              <div className="col-span-1 text-center">Action</div>
            </div>

            {/* Rows */}
            <div className="space-y-3">
              {medications.map((med, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 p-3 sm:p-2 border border-outline-variant/20 sm:border-0 rounded-xl"
                >
                  {/* Medicine Name */}
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block sm:hidden text-xs font-bold text-on-surface-variant mb-1 uppercase">
                      Medicine
                    </label>
                    <input
                      type="text"
                      value={med.medicine}
                      onChange={(e) =>
                        handleMedicationChange(index, "medicine", e.target.value)
                      }
                      placeholder="e.g. Amoxicillin 500mg"
                      className="w-full px-3 py-2 border border-outline-variant/40 rounded-lg text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>

                  {/* Dosage */}
                  <div className="col-span-12 sm:col-span-2">
                    <label className="block sm:hidden text-xs font-bold text-on-surface-variant mb-1 uppercase">
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) =>
                        handleMedicationChange(index, "dosage", e.target.value)
                      }
                      placeholder="e.g. 1 tablet"
                      className="w-full px-3 py-2 border border-outline-variant/40 rounded-lg text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>

                  {/* Frequency */}
                  <div className="col-span-12 sm:col-span-3">
                    <label className="block sm:hidden text-xs font-bold text-on-surface-variant mb-1 uppercase">
                      Frequency
                    </label>
                    <input
                      type="text"
                      value={med.frequency}
                      onChange={(e) =>
                        handleMedicationChange(index, "frequency", e.target.value)
                      }
                      placeholder="e.g. Every 8 hours"
                      className="w-full px-3 py-2 border border-outline-variant/40 rounded-lg text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>

                  {/* Duration */}
                  <div className="col-span-12 sm:col-span-2">
                    <label className="block sm:hidden text-xs font-bold text-on-surface-variant mb-1 uppercase">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={med.duration}
                      onChange={(e) =>
                        handleMedicationChange(index, "duration", e.target.value)
                      }
                      placeholder="e.g. 7 days"
                      className="w-full px-3 py-2 border border-outline-variant/40 rounded-lg text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>

                  {/* Delete Button */}
                  <div className="col-span-12 sm:col-span-1 flex items-center justify-end sm:justify-center">
                    <button
                      type="button"
                      onClick={() => removeMedicationRow(index)}
                      className="p-2 sm:p-1.5 text-on-surface-variant hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove Row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Instructions */}
          <div>
            <label
              htmlFor="additionalInstructions"
              className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider"
            >
              Additional Instructions
            </label>
            <textarea
              id="additionalInstructions"
              rows={4}
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              placeholder="e.g. Do not consume alcohol while taking antibiotics. Rinse with antiseptic mouthwash twice daily."
              className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>
        </section>

      </main>

      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-4 md:right-6 z-50 bg-on-surface text-surface text-sm font-medium px-4 py-3 rounded-xl shadow-level-2 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {toast}
        </div>
      )}
    </div>
  );
}

export default function PrescriptionEditorPage() {
  return (
    <AdminAuthGuard>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[#f2f5f8]">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        }
      >
        <PrescriptionEditorContent />
      </Suspense>
    </AdminAuthGuard>
  );
}
