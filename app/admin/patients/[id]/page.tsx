"use client";

import React, { useState, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  User,
  Mail,
  Phone,
  Activity,
  FileText,
  AlertCircle,
  Calendar,
  Plus,
  AlertTriangle,
  Check,
  Stethoscope,
  ShieldAlert,
  Edit2,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Heart,
  FileSpreadsheet,
} from "lucide-react";
import { AdminAuthGuard } from "../../../../components/auth/AdminAuthGuard";
import { useAuth } from "../../../../lib/context/AuthContext";
import {
  getPatientById,
  getPatientMedicalProfile,
  savePatientMedicalProfile,
  getPatientEncounters,
  addPatientEncounter,
  updatePatientEncounter,
  deletePatientEncounter,
  logToothTreatment,
} from "../../../../lib/services/patientService";
import { getDoctors } from "../../../../lib/services/doctorService";
import { queryKeys } from "../../../../lib/query/queryKeys";
import { PatientDetailsModalSkeleton } from "../../../../components/ui/Skeletons";
import type { PatientMedicalProfile, PatientEncounter, EncounterStatus } from "../../../../lib/types";
import { DentalChart } from "../../../../components/dental-chart/DentalChart";
import { DentalChartModal } from "../../../../components/dental-chart/DentalChartModal";
import type { ToothRecord } from "../../../../components/dental-chart/types";

/* ─── WhatsApp SVG Icon ─── */
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTimestamp(ts: any) {
  if (!ts) return "—";
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return "—";
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PatientProfilePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const patientId = resolvedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Toast / Alert notifications
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // ── Modal UI States ──────────────────────────────────────────────────────
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEncounterModalOpen, setIsEncounterModalOpen] = useState(false);
  const [isDentalChartOpen, setIsDentalChartOpen] = useState(false);
  
  // Modals form states
  const [profileForm, setProfileForm] = useState({
    bloodGroup: "",
    allergies: "",
    chronicDiseases: "",
    medicalConditions: "",
    clinicalNotes: "",
    emergencyContact: "",
  });

  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null);
  const [encounterForm, setEncounterForm] = useState({
    chiefComplaint: "",
    diagnosis: "",
    treatments: "", // bound to a comma-separated string input
    status: "Completed" as EncounterStatus,
    visitDate: new Date().toISOString().split("T")[0],
    followUpDate: "",
    notes: "",
    doctorName: "Dr. Julian Moore",
  });

  // ── TanStack Queries ─────────────────────────────────────────────────────
  // 1. Patient basic profile
  const { data: patient, isLoading: isPatientLoading, error: patientError } = useQuery({
    queryKey: queryKeys.patients.byId(patientId),
    queryFn: () => getPatientById(patientId),
    enabled: !!patientId,
  });

  // 2. Medical profile (stored in separate document)
  const { data: medicalProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: queryKeys.patients.medicalProfile(patientId),
    queryFn: () => getPatientMedicalProfile(patientId),
    enabled: !!patientId,
  });

  // 3. Encounters list (ordered by visitDate desc)
  const { data: encounters = [], isLoading: isEncountersLoading } = useQuery({
    queryKey: queryKeys.patients.encounters(patientId),
    queryFn: () => getPatientEncounters(patientId),
    enabled: !!patientId,
  });

  // 4. Doctors list
  const { data: doctorsList = [] } = useQuery({
    queryKey: queryKeys.doctors.all,
    queryFn: getDoctors,
  });

  // Derive latest active encounter details
  const activeEncounter = encounters.find((e) => e.status === "In Progress");
  const currentTreatmentText = activeEncounter
    ? `${activeEncounter.chiefComplaint} (${activeEncounter.treatments.join(", ")})`
    : "No active treatment";

  // ── Mutations ────────────────────────────────────────────────────────────
  // 1. Save/Update medical profile
  const saveProfileMutation = useMutation({
    mutationFn: (data: Partial<PatientMedicalProfile>) =>
      savePatientMedicalProfile(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.medicalProfile(patientId) });
      showToast("Clinical medical profile updated!");
      setIsEditProfileOpen(false);
    },
    onError: () => showToast("Failed to save medical profile."),
  });

  // 2. Add Patient Encounter
  const addEncounterMutation = useMutation({
    mutationFn: (data: Omit<PatientEncounter, "id" | "createdAt" | "updatedAt">) =>
      addPatientEncounter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.encounters(patientId) });
      showToast("Visit encounter logged to timeline!");
      setIsEncounterModalOpen(false);
    },
    onError: () => showToast("Failed to log visit encounter."),
  });

  // 3. Update Patient Encounter (handles edits & status changes)
  const updateEncounterMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PatientEncounter> }) =>
      updatePatientEncounter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.encounters(patientId) });
      showToast("Visit encounter updated!");
      setIsEncounterModalOpen(false);
    },
    onError: () => showToast("Failed to update encounter."),
  });

  // 4. Delete Patient Encounter
  const deleteEncounterMutation = useMutation({
    mutationFn: (id: string) => deletePatientEncounter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.encounters(patientId) });
      showToast("Encounter record deleted from timeline.");
    },
    onError: () => showToast("Failed to delete encounter."),
  });

  // 5. Log Tooth Treatment (updates/creates PatientEncounter automatically)
  const logToothTreatmentMutation = useMutation({
    mutationFn: ({ toothNumber, treatmentData }: {
      toothNumber: number;
      treatmentData: {
        treatmentName: string;
        status: string;
        fee: number;
        notes?: string;
      }
    }) => {
      const docId = doctorsList[0]?.id || "dr-julian-moore";
      const docName = doctorsList[0]?.fullName || "Dr. Julian Moore";
      return logToothTreatment(patientId, toothNumber, treatmentData, docId, docName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.encounters(patientId) });
      showToast("Tooth treatment logged successfully!");
    },
    onError: () => {
      showToast("Failed to log tooth treatment.");
    },
  });

  // ── Form Handlers ────────────────────────────────────────────────────────
  const openEditProfile = () => {
    setProfileForm({
      bloodGroup: medicalProfile?.bloodGroup || "",
      allergies: medicalProfile?.allergies || "",
      chronicDiseases: medicalProfile?.chronicDiseases || "",
      medicalConditions: medicalProfile?.medicalConditions || "",
      clinicalNotes: medicalProfile?.clinicalNotes || "",
      emergencyContact: medicalProfile?.emergencyContact || "",
    });
    setIsEditProfileOpen(true);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfileMutation.mutate(profileForm);
  };

  const openAddEncounter = () => {
    setSelectedEncounterId(null);
    setEncounterForm({
      chiefComplaint: "",
      diagnosis: "",
      treatments: "",
      status: "Completed",
      visitDate: new Date().toISOString().split("T")[0],
      followUpDate: "",
      notes: "",
      doctorName: doctorsList[0]?.fullName || "Dr. Julian Moore",
    });
    setIsEncounterModalOpen(true);
  };

  const openEditEncounter = (enc: PatientEncounter) => {
    setSelectedEncounterId(enc.id);
    setEncounterForm({
      chiefComplaint: enc.chiefComplaint || "",
      diagnosis: enc.diagnosis || "",
      treatments: (enc.treatments || []).join(", "),
      status: enc.status,
      visitDate: enc.visitDate,
      followUpDate: enc.followUpDate || "",
      notes: enc.notes || "",
      doctorName: enc.doctorName || "Dr. Julian Moore",
    });
    setIsEncounterModalOpen(true);
  };

  const handleEncounterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!encounterForm.chiefComplaint || !encounterForm.visitDate) return;

    // Parse treatments comma-separated string into a clean string[] array
    const treatmentsArray = encounterForm.treatments
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const selectedDoc = doctorsList.find((d) => d.fullName === encounterForm.doctorName) || doctorsList[0];
    const payload = {
      patientId,
      doctorId: selectedDoc?.id || "dr-julian-moore",
      doctorName: selectedDoc?.fullName || encounterForm.doctorName || "Dr. Julian Moore",
      visitDate: encounterForm.visitDate,
      chiefComplaint: encounterForm.chiefComplaint,
      diagnosis: encounterForm.diagnosis,
      treatments: treatmentsArray,
      prescriptionId: "",
      followUpDate: encounterForm.followUpDate || "",
      status: encounterForm.status,
      notes: encounterForm.notes,
    };

    if (selectedEncounterId) {
      updateEncounterMutation.mutate({
        id: selectedEncounterId,
        data: payload,
      });
    } else {
      addEncounterMutation.mutate(payload);
    }
  };

  const handleStatusChange = (id: string, status: EncounterStatus) => {
    updateEncounterMutation.mutate({ id, data: { status } });
  };

  const handleDeleteEncounter = (id: string) => {
    if (confirm("Are you sure you want to delete this encounter visit record?")) {
      deleteEncounterMutation.mutate(id);
    }
  };

  if (isPatientLoading || isProfileLoading) {
    return (
      <AdminAuthGuard>
        <div className="min-h-screen bg-[#f2f5f8] flex items-center justify-center p-8">
          <div className="bg-white rounded-xl shadow-sm p-6 w-full max-w-4xl">
            <div className="flex items-center gap-2 mb-6">
              <ChevronLeft className="w-5 h-5 text-on-surface-variant cursor-pointer" onClick={() => router.push("/admin/patients")} />
              <h2 className="text-lg font-bold text-primary animate-pulse">Fetching workspace records...</h2>
            </div>
            <PatientDetailsModalSkeleton />
          </div>
        </div>
      </AdminAuthGuard>
    );
  }

  if (patientError || !patient) {
    return (
      <AdminAuthGuard>
        <div className="min-h-screen bg-[#f2f5f8] flex items-center justify-center p-8">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-on-surface mb-2">Patient Records Error</h2>
            <p className="text-sm text-on-surface-variant mb-6">
              This patient record does not exist or has been deleted from the registration registry.
            </p>
            <button
              onClick={() => router.push("/admin/patients")}
              className="bg-primary text-white font-semibold py-2 px-4 rounded-lg text-sm hover:bg-primary/95 transition-colors cursor-pointer"
            >
              Go to Patients Directory
            </button>
          </div>
        </div>
      </AdminAuthGuard>
    );
  }

  const initials = getInitials(patient.name);
  const cleanPhone = patient.phone.replace(/\D/g, "");
  const whatsappMsg = encodeURIComponent(
    `Hello ${patient.name}! 👋 This is Sanjivani Dentals. We hope you are doing well. Please feel free to reply if you need any follow-up scheduling!`
  );
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${whatsappMsg}`;

  return (
    <AdminAuthGuard>
      <div className="min-h-screen flex bg-[#f2f5f8] font-sans">
        
        {/* Main Work Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Header Bar */}
          <header className="bg-white border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/admin/patients")}
                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer flex items-center justify-center border border-outline-variant/30 bg-white"
                title="Go Back"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-primary flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-primary" /> Doctor's Clinical Workspace
                </h1>
                <p className="text-xs text-on-surface-variant">Manage diagnostic notes, medical histories & dynamic visit encounters</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-on-surface leading-tight">
                  {user?.email || "Admin"}
                </p>
                <p className="text-xs text-on-surface-variant font-medium">Logged in Clinician</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                {user?.email?.[0]?.toUpperCase() || "A"}
              </div>
            </div>
          </header>

          <main className="flex-grow p-6 lg:p-8 space-y-6">
            
            {/* CLINICAL PATIENT HEADER */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-outline-variant/15 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-20 h-20 rounded-2xl ${patient.avatarColor || "bg-primary"} flex items-center justify-center text-white font-bold text-2xl shadow-sm shrink-0`}>
                  {initials}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-on-surface leading-tight">{patient.name}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm text-on-surface-variant font-medium">
                    <span className="bg-secondary-container text-primary px-2.5 py-0.5 rounded-full text-xs font-semibold">
                      Basic Info Verified
                    </span>
                    <span className="text-outline-variant/60">•</span>
                    <span className="text-on-surface">Registered: {formatTimestamp(patient.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={openEditProfile}
                  className="flex items-center gap-1.5 px-4 py-2 border border-primary text-primary hover:bg-secondary-container rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" /> Edit Medical Profile
                </button>
                <button
                  onClick={openAddEncounter}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-98 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Log Patient Encounter
                </button>
                <button
                  onClick={() => setIsDentalChartOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                >
                  <Activity className="w-4 h-4" /> Log Treatment
                </button>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#dcfce7] hover:bg-green-200 text-green-800 rounded-xl text-sm font-semibold transition-colors border border-green-200"
                >
                  <WhatsAppIcon className="w-4 h-4 text-green-600" /> Patient WhatsApp
                </a>
              </div>
            </div>

            {/* CLINICAL SPEC GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* Left Column: Basic & Medical Profile Info (4 Cols) */}
              <div className="xl:col-span-4 space-y-6">
                
                {/* Basic Details Card */}
                <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm overflow-hidden">
                  <div className="p-4 bg-surface-container-lowest border-b border-outline-variant/10">
                    <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" /> Basic Information
                    </h3>
                  </div>
                  <div className="p-5 space-y-3.5 text-sm font-medium text-on-surface">
                    <p><span className="text-on-surface-variant">Age / DOB:</span> {patient.age || "—"}</p>
                    <p><span className="text-on-surface-variant">Gender:</span> {patient.gender || "—"}</p>
                    <p><span className="text-on-surface-variant">Phone:</span> {patient.phone}</p>
                    {patient.email && <p className="truncate"><span className="text-on-surface-variant">Email:</span> {patient.email}</p>}
                    <p><span className="text-on-surface-variant">Address:</span> {patient.address || <span className="text-on-surface-variant/60 italic font-normal">No address provided</span>}</p>
                  </div>
                </div>

                {/* Medical Profile Card */}
                <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm overflow-hidden">
                  <div className="p-4 bg-surface-container-lowest border-b border-outline-variant/10 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-primary" /> Medical Profile
                    </h3>
                    <button onClick={openEditProfile} className="text-primary text-xs font-bold hover:underline cursor-pointer">
                      Edit
                    </button>
                  </div>
                  
                  <div className="p-5 space-y-4 text-sm font-medium text-on-surface">
                    {/* Blood Group */}
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Blood Group</p>
                      {medicalProfile?.bloodGroup ? (
                        <span className="bg-red-50 text-red-700 px-2.5 py-0.5 rounded border border-red-200 text-xs font-bold inline-block">
                          {medicalProfile.bloodGroup}
                        </span>
                      ) : (
                        <p className="text-xs text-on-surface-variant/75 italic font-normal">No blood group added</p>
                      )}
                    </div>

                    {/* Allergies */}
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Allergies</p>
                      {medicalProfile?.allergies ? (
                        <p className="text-xs text-red-800 bg-red-50 border border-red-200/50 p-2 rounded-lg leading-relaxed font-semibold">
                          {medicalProfile.allergies}
                        </p>
                      ) : (
                        <p className="text-xs text-on-surface-variant/75 italic font-normal">No allergies recorded</p>
                      )}
                    </div>

                    {/* Chronic Conditions */}
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Chronic Diseases</p>
                      {medicalProfile?.chronicDiseases && medicalProfile.chronicDiseases !== "None" ? (
                        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200/50 p-2 rounded-lg leading-relaxed font-semibold">
                          {medicalProfile.chronicDiseases}
                        </p>
                      ) : (
                        <p className="text-xs text-on-surface-variant/75 italic font-normal">No chronic conditions</p>
                      )}
                    </div>

                    {/* Medical Conditions */}
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Medical Conditions</p>
                      <p className="text-xs text-on-surface-variant font-medium">
                        {medicalProfile?.medicalConditions || <span className="italic font-normal">No medical conditions recorded</span>}
                      </p>
                    </div>

                    {/* Current Treatment */}
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Current Treatment Status</p>
                      <p className={`text-xs font-semibold ${activeEncounter ? "text-primary" : "text-on-surface-variant/75 italic font-normal"}`}>
                        {currentTreatmentText}
                      </p>
                    </div>

                    {/* Emergency Contact */}
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Emergency Contact</p>
                      <p className="text-xs text-on-surface font-semibold flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-primary" />
                        {medicalProfile?.emergencyContact || <span className="text-on-surface-variant/75 italic font-normal">No emergency contact added</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Clinical Notes */}
                <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm overflow-hidden">
                  <div className="p-4 bg-surface-container-lowest border-b border-outline-variant/10">
                    <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> Clinical Notes
                    </h3>
                  </div>
                  <div className="p-5">
                    {medicalProfile?.clinicalNotes ? (
                      <p className="text-xs text-on-surface font-medium leading-relaxed whitespace-pre-wrap">
                        {medicalProfile.clinicalNotes}
                      </p>
                    ) : (
                      <p className="text-xs text-on-surface-variant/75 italic font-normal">No clinical notes</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: Dynamic visit encounters (8 Cols) */}
              <div className="xl:col-span-8 space-y-6">
                
                {/* Timeline Card */}
                <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
                    <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      Patient Visit Encounter Logs
                    </h2>
                    <button
                      onClick={openAddEncounter}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Log Visit
                    </button>
                  </div>

                  {isEncountersLoading ? (
                    <div className="space-y-4 py-8">
                      <div className="h-16 bg-surface-container animate-pulse rounded-lg"></div>
                      <div className="h-16 bg-surface-container animate-pulse rounded-lg"></div>
                    </div>
                  ) : encounters.length === 0 ? (
                    <div className="py-16 text-center border-2 border-dashed border-outline-variant/20 rounded-2xl">
                      <FileSpreadsheet className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
                      <h3 className="font-bold text-on-surface text-base">No Visit Encounters</h3>
                      <p className="text-xs text-on-surface-variant mt-1 mb-5">
                        This patient has no registered visit records. Log an encounter to create a clinical timeline.
                      </p>
                      <button
                        onClick={openAddEncounter}
                        className="bg-primary text-white font-semibold py-2 px-4 rounded-lg text-xs hover:bg-primary/95 transition-all cursor-pointer shadow-sm"
                      >
                        Log First Clinical Visit
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6 relative before:content-[''] before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/20">
                      {encounters.map((e) => {
                        const isCompleted = e.status === "Completed";
                        const isInProgress = e.status === "In Progress";
                        const isCancelled = e.status === "Cancelled";

                        return (
                          <div key={e.id} className="relative pl-9 space-y-2 group">
                            {/* Circle Indicator */}
                            {isCompleted ? (
                              <div className="absolute left-0 top-1 w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-white shadow-sm text-white shrink-0 z-10">
                                <Check className="w-4.5 h-4.5 stroke-[3px]" />
                              </div>
                            ) : isInProgress ? (
                              <div className="absolute left-0 top-1 w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center border-4 border-white shadow-sm text-white shrink-0 z-10 animate-pulse">
                                <Clock className="w-4.5 h-4.5" />
                              </div>
                            ) : isCancelled ? (
                              <div className="absolute left-0 top-1 w-9 h-9 bg-red-500 rounded-full flex items-center justify-center border-4 border-white shadow-sm text-white shrink-0 z-10">
                                <XCircle className="w-4.5 h-4.5" />
                              </div>
                            ) : (
                              <div className="absolute left-0 top-1 w-9 h-9 bg-gray-400 rounded-full flex items-center justify-center border-4 border-white shadow-sm text-white shrink-0 z-10">
                                <Clock className="w-4.5 h-4.5" />
                              </div>
                            )}

                            {/* Details Panel */}
                            <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-4 space-y-3 group-hover:shadow-sm transition-shadow">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                <div>
                                  <h4 className="text-sm font-bold text-on-surface">
                                    Encounter: {e.chiefComplaint || "Routine consultation"}
                                  </h4>
                                  <p className="text-xs text-on-surface-variant mt-0.5">
                                    Clinician: <span className="font-semibold">{e.doctorName || "Dr. Moore"}</span> · Visit Date: {e.visitDate}
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                    isCompleted
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : isInProgress
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : isCancelled
                                      ? "bg-red-50 text-red-700 border-red-200"
                                      : "bg-gray-50 text-gray-700 border-gray-200"
                                  }`}>
                                    {e.status}
                                  </span>
                                </div>
                              </div>

                              {e.diagnosis && (
                                <p className="text-xs text-on-surface font-semibold bg-white/60 border border-outline-variant/5 rounded-lg p-2.5">
                                  <span className="text-on-surface-variant text-[11px] block font-bold mb-0.5 uppercase tracking-wider">Diagnosis</span>
                                  {e.diagnosis}
                                </p>
                              )}

                              {e.treatments && e.treatments.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-on-surface-variant text-[11px] font-bold block uppercase tracking-wider">Treatments Administered</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {e.treatments.map((tr, idx) => (
                                      <span key={idx} className="bg-primary-container text-primary border border-primary/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                        {tr}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {e.toothTreatments && e.toothTreatments.length > 0 && (
                                <div className="space-y-1 mt-2">
                                  <span className="text-on-surface-variant text-[11px] font-bold block uppercase tracking-wider">Teeth Treated</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {Array.from(new Set(e.toothTreatments.map((tt) => tt.toothNumber))).sort((a, b) => a - b).map((num) => (
                                      <span key={num} className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                        Tooth #{num}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {e.notes && (
                                <div className="text-[11px] text-on-surface-variant leading-relaxed bg-[#f8fafc] border border-outline-variant/5 rounded-lg p-2.5">
                                  <span className="font-bold text-on-surface">Clinical Notes:</span> {e.notes}
                                </div>
                              )}

                              {/* Prescription status placeholder */}
                              <div className="text-[11px] text-slate-500 italic bg-slate-50 border border-slate-100/50 rounded-lg p-2.5 flex items-center justify-between">
                                <span>Prescription Status: No prescriptions issued for this session</span>
                                <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">Pending Integration</span>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/10 pt-3">
                                <div className="text-[11px] font-semibold text-on-surface-variant flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-primary" />
                                  {e.followUpDate ? `Follow-up Visit: ${e.followUpDate}` : "No scheduled follow-up"}
                                </div>
                                
                                {/* Status Actions */}
                                <div className="flex items-center gap-1.5">
                                  {!isCompleted && (
                                    <button
                                      onClick={() => handleStatusChange(e.id, "Completed")}
                                      className="p-1 rounded bg-emerald-50 hover:bg-emerald-500 hover:text-white border border-emerald-200 text-emerald-700 transition-colors text-[10px] font-bold cursor-pointer"
                                      title="Mark Completed"
                                    >
                                      Mark Completed
                                    </button>
                                  )}
                                  {!isInProgress && !isCompleted && (
                                    <button
                                      onClick={() => handleStatusChange(e.id, "In Progress")}
                                      className="p-1 rounded bg-blue-50 hover:bg-blue-500 hover:text-white border border-blue-200 text-blue-700 transition-colors text-[10px] font-bold cursor-pointer"
                                      title="Set In Progress"
                                    >
                                      Start
                                    </button>
                                  )}
                                  {!isCancelled && (
                                    <button
                                      onClick={() => handleStatusChange(e.id, "Cancelled")}
                                      className="p-1 rounded bg-red-50 hover:bg-red-500 hover:text-white border border-red-200 text-red-700 transition-colors text-[10px] font-bold cursor-pointer"
                                      title="Cancel Encounter"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                  <button
                                    onClick={() => openEditEncounter(e)}
                                    className="p-1 rounded bg-white hover:bg-surface-container border border-outline-variant/30 text-on-surface-variant transition-colors cursor-pointer"
                                    title="Edit Visit Encounter"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEncounter(e.id)}
                                    className="p-1 rounded bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 border border-outline-variant/30 text-on-surface-variant transition-colors cursor-pointer"
                                    title="Delete Encounter"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── Dental Chart Section ── */}
                <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm overflow-hidden select-none">
                  <div className="p-4 bg-[#1b5e20] text-white flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 font-sans">
                      <Activity className="w-4 h-4" />
                      Dental Chart & Interactive Diagnostics
                    </h3>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                      Interactive Workspace
                    </span>
                  </div>
                  <div className="p-6 text-center space-y-4">
                    <p className="text-xs font-medium text-on-surface-variant max-w-md mx-auto leading-relaxed">
                      Access the full anatomical 32-tooth and pediatric dental chart workspace to log specific tooth conditions, treatments, and plans.
                    </p>
                    <button
                      onClick={() => setIsDentalChartOpen(true)}
                      className="px-5 py-2 bg-[#1b5e20] hover:bg-[#123f15] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm inline-flex items-center gap-1.5"
                    >
                      <Activity className="w-4 h-4" /> Open Dental Chart Workspace
                    </button>
                  </div>
                </div>

              </div>{/* end right column xl:col-span-8 */}

            </div>{/* end grid xl:grid-cols-12 */}

          </main>
        </div>
      </div>

      {/* ── EDIT MEDICAL PROFILE MODAL ── */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setIsEditProfileOpen(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-xl border border-outline-variant/10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-outline-variant/10 bg-surface-container-lowest flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" /> Edit Clinical Medical Profile
              </h3>
              <button onClick={() => setIsEditProfileOpen(false)} className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-blood" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                    Blood Group
                  </label>
                  <select
                    id="modal-blood"
                    value={profileForm.bloodGroup}
                    onChange={(e) => setProfileForm({ ...profileForm, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="modal-emergency" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                    Emergency Contact
                  </label>
                  <input
                    id="modal-emergency"
                    type="text"
                    value={profileForm.emergencyContact}
                    onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                    placeholder="e.g. Spouse: +1 (555) 123-4567"
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="modal-allergies" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Allergies
                </label>
                <input
                  id="modal-allergies"
                  type="text"
                  value={profileForm.allergies}
                  onChange={(e) => setProfileForm({ ...profileForm, allergies: e.target.value })}
                  placeholder="e.g. Penicillin (Severe), Latex (Mild)"
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface"
                />
              </div>

              <div>
                <label htmlFor="modal-chronic" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Chronic Diseases
                </label>
                <input
                  id="modal-chronic"
                  type="text"
                  value={profileForm.chronicDiseases}
                  onChange={(e) => setProfileForm({ ...profileForm, chronicDiseases: e.target.value })}
                  placeholder="e.g. Sugar (Diabetes), Blood Pressure (Hypertension)"
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface"
                />
              </div>

              <div>
                <label htmlFor="modal-conditions" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Medical Conditions
                </label>
                <input
                  id="modal-conditions"
                  type="text"
                  value={profileForm.medicalConditions}
                  onChange={(e) => setProfileForm({ ...profileForm, medicalConditions: e.target.value })}
                  placeholder="e.g. Root Canal Treatment pending, Gum sensitivity"
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface"
                />
              </div>

              {/* Current treatment status is dynamically derived from active encounters */}

              <div>
                <label htmlFor="modal-notes" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Clinical Notes
                </label>
                <textarea
                  id="modal-notes"
                  value={profileForm.clinicalNotes}
                  onChange={(e) => setProfileForm({ ...profileForm, clinicalNotes: e.target.value })}
                  placeholder="Enter diagnosis notes or general clinical instructions..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 border border-outline-variant/40 text-on-surface font-semibold py-2 rounded-lg text-sm hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveProfileMutation.isPending}
                  className="flex-1 bg-primary text-white font-semibold py-2 rounded-lg text-sm hover:bg-primary/90 flex items-center justify-center gap-1 cursor-pointer"
                >
                  {saveProfileMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Medical Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD/EDIT CLINICAL ENCOUNTER MODAL ── */}
      {isEncounterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setIsEncounterModalOpen(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-xl border border-outline-variant/10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-outline-variant/10 bg-surface-container-lowest flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                {selectedEncounterId ? "Edit Visit Encounter Record" : "Log Patient Visit Encounter"}
              </h3>
              <button onClick={() => setIsEncounterModalOpen(false)} className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEncounterSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div>
                <label htmlFor="enc-complaint" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Chief Complaint *
                </label>
                <input
                  id="enc-complaint"
                  type="text"
                  required
                  value={encounterForm.chiefComplaint}
                  onChange={(e) => setEncounterForm({ ...encounterForm, chiefComplaint: e.target.value })}
                  placeholder="e.g. Sharp pain in lower right molar"
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface"
                />
              </div>

              <div>
                <label htmlFor="enc-diagnosis" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Diagnosis
                </label>
                <input
                  id="enc-diagnosis"
                  type="text"
                  value={encounterForm.diagnosis}
                  onChange={(e) => setEncounterForm({ ...encounterForm, diagnosis: e.target.value })}
                  placeholder="e.g. Deep dental caries with pulp exposure"
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface"
                />
              </div>

              <div>
                <label htmlFor="enc-treatments" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Treatments Performed (comma-separated list)
                </label>
                <input
                  id="enc-treatments"
                  type="text"
                  value={encounterForm.treatments}
                  onChange={(e) => setEncounterForm({ ...encounterForm, treatments: e.target.value })}
                  placeholder="e.g. Molar root canal, temporary filling, scaling"
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="enc-status" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                    Visit Status
                  </label>
                  <select
                    id="enc-status"
                    value={encounterForm.status}
                    onChange={(e) => setEncounterForm({ ...encounterForm, status: e.target.value as EncounterStatus })}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface"
                  >
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="enc-doctor" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                    Assigned Doctor
                  </label>
                  <select
                    id="enc-doctor"
                    value={encounterForm.doctorName}
                    onChange={(e) => setEncounterForm({ ...encounterForm, doctorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface"
                  >
                    {doctorsList.map((d) => (
                      <option key={d.id} value={d.fullName}>
                        {d.fullName} ({d.specialization})
                      </option>
                    ))}
                    {doctorsList.length === 0 && (
                      <option value="Dr. Julian Moore">Dr. Julian Moore (General Dentistry)</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="enc-date" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                    Visit Date *
                  </label>
                  <input
                    id="enc-date"
                    type="date"
                    required
                    value={encounterForm.visitDate}
                    onChange={(e) => setEncounterForm({ ...encounterForm, visitDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface"
                  />
                </div>
                <div>
                  <label htmlFor="enc-followup" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                    Follow-up Date (Optional)
                  </label>
                  <input
                    id="enc-followup"
                    type="date"
                    value={encounterForm.followUpDate}
                    onChange={(e) => setEncounterForm({ ...encounterForm, followUpDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="enc-notes" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Clinical Visit Notes
                </label>
                <textarea
                  id="enc-notes"
                  value={encounterForm.notes}
                  onChange={(e) => setEncounterForm({ ...encounterForm, notes: e.target.value })}
                  placeholder="Enter detailed clinical logs or prognosis details..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEncounterModalOpen(false)}
                  className="flex-1 border border-outline-variant/40 text-on-surface font-semibold py-2 rounded-lg text-sm hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addEncounterMutation.isPending || updateEncounterMutation.isPending}
                  className="flex-1 bg-primary text-white font-semibold py-2 rounded-lg text-sm hover:bg-primary/90 flex items-center justify-center gap-1 cursor-pointer"
                >
                  {(addEncounterMutation.isPending || updateEncounterMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Encounter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DENTAL CHART MODAL ── */}
      {isDentalChartOpen && (
        <DentalChartModal
          patient={patient}
          encounters={encounters}
          onSaveTreatment={async (toothNumber, data) => {
            await logToothTreatmentMutation.mutateAsync({ toothNumber, treatmentData: data });
          }}
          isSaving={logToothTreatmentMutation.isPending}
          onClose={() => setIsDentalChartOpen(false)}
        />
      )}

      {/* Toast Alert overlay */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-on-surface text-surface text-xs font-semibold px-4.5 py-3.5 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          {toastMsg}
        </div>
      )}
    </AdminAuthGuard>
  );
}
