"use client";

import React, { useState, use, useEffect } from "react";
import dynamic from "next/dynamic";
import { Timestamp } from "firebase/firestore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Stethoscope,
  AlertCircle,
  XCircle,
  Loader2,
  Heart,
  Activity,
  Receipt,
  CheckCircle,
} from "lucide-react";

import { AdminAuthGuard } from "../../../../components/auth/AdminAuthGuard";
import { useAuth } from "../../../../lib/context/AuthContext";
import { PatientStickyHeader } from "../../../../components/admin/patient-workspace/PatientStickyHeader";
import { TabNavigation, type TabKey } from "../../../../components/admin/patient-workspace/TabNavigation";

import {
  getPatientById,
  getPatientMedicalProfile,
  savePatientMedicalProfile,
  getPatientEncounters,
  addPatientEncounter,
  updatePatientEncounter,
  deletePatientEncounter,
  logToothTreatment,
  getPatientsByReferrer,
} from "../../../../lib/services/patientService";
import { getDoctors } from "../../../../lib/services/doctorService";
import { addInvoice, getInvoicesByPatientId } from "../../../../lib/services/invoiceService";
import { getAppointmentsByPhone } from "../../../../lib/services/appointmentService";
import { queryKeys } from "../../../../lib/query/queryKeys";
import jsPDF from "jspdf";
import { calculateSubtotal, calculateTax, calculateGrandTotal } from "../../../../lib/services/billingService";
import { sendInvoiceEmail } from "../../../../lib/services/emailService";
import { PatientDetailsModalSkeleton } from "../../../../components/ui/Skeletons";
import { getTreatmentStatus, type PatientMedicalProfile, type PatientEncounter, type EncounterStatus, type Invoice, type Appointment, type SurfaceType } from "../../../../lib/types";
import { DentalChartModal } from "../../../../components/dental-chart/DentalChartModal";
import { PrescriptionModal } from "../../../../components/admin/encounters/PrescriptionModal";

/* ─── Loading Skeleton for Dynamic Tab Loading ─── */
function TabLoadingSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-8 border border-outline-variant/15 shadow-sm space-y-4 animate-pulse">
      <div className="h-6 bg-slate-200 rounded-md w-1/4"></div>
      <div className="h-24 bg-slate-100 rounded-xl w-full"></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-32 bg-slate-100 rounded-xl"></div>
        <div className="h-32 bg-slate-100 rounded-xl"></div>
        <div className="h-32 bg-slate-100 rounded-xl"></div>
      </div>
    </div>
  );
}

/* ─── Dynamic Tab Imports for Lazy Loading & Performance ─── */
const OverviewTab = dynamic(
  () => import("../../../../components/admin/patient-workspace/tabs/OverviewTab").then((m) => m.OverviewTab),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const AppointmentsTab = dynamic(
  () => import("../../../../components/admin/patient-workspace/tabs/AppointmentsTab").then((m) => m.AppointmentsTab),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const EncountersTab = dynamic(
  () => import("../../../../components/admin/patient-workspace/tabs/EncountersTab").then((m) => m.EncountersTab),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const TreatmentPlanTab = dynamic(
  () => import("../../../../components/admin/patient-workspace/tabs/TreatmentPlanTab").then((m) => m.TreatmentPlanTab),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const DentalChartTab = dynamic(
  () => import("../../../../components/admin/patient-workspace/tabs/DentalChartTab").then((m) => m.DentalChartTab),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const MedicalHistoryTab = dynamic(
  () => import("../../../../components/admin/patient-workspace/tabs/MedicalHistoryTab").then((m) => m.MedicalHistoryTab),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const InvoicesPaymentsTab = dynamic(
  () => import("../../../../components/admin/patient-workspace/tabs/InvoicesPaymentsTab").then((m) => m.InvoicesPaymentsTab),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const NotesTab = dynamic(
  () => import("../../../../components/admin/patient-workspace/tabs/NotesTab").then((m) => m.NotesTab),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const RecordsTab = dynamic(
  () => import("../../../../components/admin/patient-workspace/tabs/RecordsTab").then((m) => m.RecordsTab),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const DocumentsTab = dynamic(
  () => import("../../../../components/admin/patient-workspace/tabs/DocumentsTab").then((m) => m.DocumentsTab),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

function formatVisitDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function calculateTotalFees(encounter: PatientEncounter): number {
  if (!encounter.toothTreatments || encounter.toothTreatments.length === 0) return 0;
  return encounter.toothTreatments.reduce((sum, tt) => sum + (tt.fee || 0), 0);
}

function getTeethNumbers(encounter: PatientEncounter): number[] {
  if (!encounter.toothTreatments || encounter.toothTreatments.length === 0) return [];
  return Array.from(new Set(encounter.toothTreatments.map((tt) => tt.toothNumber))).sort((a, b) => a - b);
}

function formatINR(amount: any): string {
  const val = Number(amount || 0);
  const hasPaise = val % 1 !== 0;
  return val.toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  });
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

  // Tab State & Caching State
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [visitedTabs, setVisitedTabs] = useState<Set<TabKey>>(new Set<TabKey>(["overview"]));

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    setVisitedTabs((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  // Toast notifications
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Modal UI States
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEncounterModalOpen, setIsEncounterModalOpen] = useState(false);
  const [isDentalChartOpen, setIsDentalChartOpen] = useState(false);
  const [prescriptionEncounter, setPrescriptionEncounter] = useState<PatientEncounter | null>(null);
  
  // Billing review workflow states
  const [selectedBillingItems, setSelectedBillingItems] = useState<Record<string, boolean>>({});
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [billingEncounter, setBillingEncounter] = useState<PatientEncounter | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [inMemoryPdf, setInMemoryPdf] = useState<jsPDF | null>(null);
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState<string | null>(null);
  const [isInvoiceSaved, setIsInvoiceSaved] = useState(false);

  // Form states
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
    treatments: "",
    status: "Completed" as EncounterStatus,
    visitDate: new Date().toISOString().split("T")[0],
    followUpDate: "",
    notes: "",
    doctorName: "Dr. Julian Moore",
  });

  // ── Billing Review Workflow Helpers ──
  const handleToggleBillingItem = (itemId: string) => {
    setSelectedBillingItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const getAllUnbilledCompletedTreatments = () => {
    const list: Array<{
      id: string;
      encounterId: string;
      treatmentName: string;
      toothNumber?: number;
      fee: number;
      visitDate: string;
    }> = [];

    encounters.forEach((enc) => {
      if (enc.toothTreatments && enc.toothTreatments.length > 0) {
        enc.toothTreatments.forEach((tt) => {
          const isCompleted = getTreatmentStatus(tt, enc.status) === "Completed";
          const isUnbilled = tt.billingStatus !== "Billed" && !tt.invoiceId;

          if (isCompleted && isUnbilled) {
            list.push({
              id: tt.id,
              encounterId: enc.id,
              treatmentName: tt.treatmentName,
              toothNumber: tt.toothNumber,
              fee: tt.fee || 0,
              visitDate: tt.date || enc.visitDate,
            });
          }
        });
      } else if (enc.treatments && enc.treatments.length > 0 && enc.status === "Completed") {
        list.push({
          id: `fallback-${enc.id}`,
          encounterId: enc.id,
          treatmentName: enc.treatments.join(" • "),
          fee: 0,
          visitDate: enc.visitDate,
        });
      }
    });

    return list;
  };

  const isEncounterAllBillingSelected = (encounter: PatientEncounter) => {
    if (encounter.toothTreatments && encounter.toothTreatments.length > 0) {
      const eligibleTTs = encounter.toothTreatments.filter(
        (tt) =>
          getTreatmentStatus(tt, encounter.status) === "Completed" &&
          tt.billingStatus !== "Billed" &&
          !tt.invoiceId
      );
      if (eligibleTTs.length === 0) return false;
      return eligibleTTs.every((tt) => !!selectedBillingItems[`tt-${tt.id}`]);
    } else if (encounter.treatments && encounter.treatments.length > 0) {
      return !!selectedBillingItems[`fallback-${encounter.id}`];
    }
    return false;
  };

  const handleToggleAllBillingItems = (encounter: PatientEncounter) => {
    const allSelected = isEncounterAllBillingSelected(encounter);
    const updated = { ...selectedBillingItems };

    if (encounter.toothTreatments && encounter.toothTreatments.length > 0) {
      const eligibleTTs = encounter.toothTreatments.filter(
        (tt) =>
          getTreatmentStatus(tt, encounter.status) === "Completed" &&
          tt.billingStatus !== "Billed" &&
          !tt.invoiceId
      );
      eligibleTTs.forEach((tt) => {
        if (allSelected) {
          delete updated[`tt-${tt.id}`];
        } else {
          updated[`tt-${tt.id}`] = true;
        }
      });
    } else if (encounter.treatments && encounter.treatments.length > 0) {
      if (allSelected) {
        delete updated[`fallback-${encounter.id}`];
      } else {
        updated[`fallback-${encounter.id}`] = true;
      }
    }
    setSelectedBillingItems(updated);
  };

  const getSelectedTreatmentsForEncounter = (encounter?: PatientEncounter | null) => {
    const allUnbilled = getAllUnbilledCompletedTreatments();
    if (!encounter) {
      return allUnbilled.filter(
        (item) =>
          !!selectedBillingItems[`tt-${item.id}`] ||
          !!selectedBillingItems[`fallback-${item.encounterId}`] ||
          !!selectedBillingItems[item.id]
      );
    }
    return allUnbilled.filter((item) => {
      const isSelected =
        !!selectedBillingItems[`tt-${item.id}`] ||
        !!selectedBillingItems[`fallback-${item.encounterId}`] ||
        !!selectedBillingItems[item.id];
      return isSelected && item.encounterId === encounter.id;
    });
  };

  const handleOpenBillingReview = (encounter?: PatientEncounter) => {
    const unbilled = getAllUnbilledCompletedTreatments();
    const targetEnc =
      encounter ||
      (unbilled.length > 0 ? encounters.find((e) => e.id === unbilled[0].encounterId) : encounters[0]) ||
      null;

    setBillingEncounter(targetEnc);

    // Auto-select unbilled completed items for targetEnc
    if (unbilled.length > 0) {
      const updated = { ...selectedBillingItems };
      let anySelected = unbilled.some(
        (item) => !!updated[`tt-${item.id}`] || !!updated[`fallback-${item.encounterId}`]
      );
      if (!anySelected) {
        unbilled.forEach((item) => {
          if (!targetEnc || item.encounterId === targetEnc.id) {
            updated[`tt-${item.id}`] = true;
            updated[`fallback-${item.encounterId}`] = true;
          }
        });
        setSelectedBillingItems(updated);
      }
    }

    setDiscountPercentage(0);
    setInMemoryPdf(null);
    setGeneratedInvoiceId(null);
    setIsInvoiceSaved(false);
    setIsBillingModalOpen(true);
  };

  // ── TanStack Queries ──
  // 1. Patient basic profile
  const { data: patient, isLoading: isPatientLoading, error: patientError } = useQuery({
    queryKey: queryKeys.patients.byId(patientId),
    queryFn: () => getPatientById(patientId),
    enabled: !!patientId,
  });

  // 2. Medical profile
  const { data: medicalProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: queryKeys.patients.medicalProfile(patientId),
    queryFn: () => getPatientMedicalProfile(patientId),
    enabled: !!patientId,
  });

  // 3. Encounters list
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

  // 5. Referred patients
  const { data: referredPatients = [] } = useQuery({
    queryKey: queryKeys.referrals.byReferrer(patientId),
    queryFn: () => getPatientsByReferrer(patientId),
    enabled: !!patientId,
  });

  // 6. Referrer details
  const { data: referrer } = useQuery({
    queryKey: queryKeys.patients.byId(patient?.referredByPatientId || ""),
    queryFn: () => getPatientById(patient?.referredByPatientId || ""),
    enabled: !!patient?.referredByPatientId,
  });

  // 7. Invoices list
  const { data: patientInvoices = [] } = useQuery<Invoice[]>({
    queryKey: queryKeys.invoices.byPatientId(patientId),
    queryFn: () => getInvoicesByPatientId(patientId),
    enabled: !!patientId,
  });

  // 8. Patient Appointments
  const { data: patientAppointments = [] } = useQuery<Appointment[]>({
    queryKey: queryKeys.appointments.byPhone(patient?.phone || "", 50),
    queryFn: () => (patient?.phone ? getAppointmentsByPhone(patient.phone, 50) : Promise.resolve([])),
    enabled: !!patient?.phone,
  });

  // ── Mutations ──
  const saveProfileMutation = useMutation({
    mutationFn: (data: Partial<PatientMedicalProfile>) => savePatientMedicalProfile(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.medicalProfile(patientId) });
      showToast("Clinical medical profile updated!");
      setIsEditProfileOpen(false);
    },
    onError: () => showToast("Failed to save medical profile."),
  });

  const addEncounterMutation = useMutation({
    mutationFn: (data: Omit<PatientEncounter, "id" | "createdAt" | "updatedAt">) => addPatientEncounter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.encounters(patientId) });
      showToast("Visit encounter logged!");
      setIsEncounterModalOpen(false);
    },
    onError: () => showToast("Failed to log visit encounter."),
  });

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

  const deleteEncounterMutation = useMutation({
    mutationFn: (id: string) => deletePatientEncounter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.encounters(patientId) });
      showToast("Encounter deleted.");
    },
    onError: () => showToast("Failed to delete encounter."),
  });

  const logToothTreatmentMutation = useMutation({
    mutationFn: ({
      toothNumber,
      treatmentData,
    }: {
      toothNumber: number;
      treatmentData: {
        treatmentName: string;
        status: string;
        fee: number;
        notes?: string;
        surfaces?: SurfaceType[];
      };
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

  // Invoice Handlers
  const handleGenerateInvoice = async () => {
    if (!billingEncounter || !patient) {
      showToast("Missing billing context.");
      return;
    }

    const selectedTreatments = getSelectedTreatmentsForEncounter(billingEncounter);
    if (selectedTreatments.length === 0) {
      showToast("Empty invoice: Please select at least one treatment.");
      return;
    }

    setIsGeneratingInvoice(true);

    try {
      const subtotal = calculateSubtotal(selectedTreatments);
      const tax = calculateTax(subtotal);
      const discount = discountPercentage;
      const total = calculateGrandTotal(subtotal, tax, discount);

      const invoiceDateStr = new Date().toISOString().split("T")[0];
      const invoiceData = {
        patientId: patient.id,
        patientName: patient.name,
        encounterId: billingEncounter.id,
        encounterIds: [billingEncounter.id],
        visitDate: billingEncounter.visitDate,
        subtotal,
        tax,
        discount,
        total,
        amount: total,
        status: "UNPAID" as const,
        paymentStatus: "UNPAID" as const,
        paymentMethod: "None" as const,
        invoiceDate: invoiceDateStr,
        treatments: selectedTreatments.map((t) => t.treatmentName),
        items: selectedTreatments,
        createdAt: Timestamp.now(),
        emailSent: false,
        grossAmount: subtotal,
        netAmount: total,
        paidAmount: 0,
        remainingAmount: total,
        dueDate: invoiceDateStr,
        paymentHistory: [],
        installmentPlan: null,
        updatedAt: Timestamp.now(),
        invoiceGenerated: true,
      };

      const invoiceId = await addInvoice(invoiceData);
      setGeneratedInvoiceId(invoiceId);

      // Update billingStatus & invoiceId on selected toothTreatments across all encounter documents in Firestore
      const selectedItemIds = new Set(selectedTreatments.map((st) => st.id));

      await Promise.all(
        encounters.map(async (enc) => {
          if (!enc.toothTreatments || enc.toothTreatments.length === 0) return;

          let hasChanges = false;
          const updatedToothTreatments = enc.toothTreatments.map((tt) => {
            if (selectedItemIds.has(tt.id) || selectedItemIds.has(`tt-${tt.id}`)) {
              hasChanges = true;
              return {
                ...tt,
                billingStatus: "Billed" as const,
                invoiceId: invoiceId,
              };
            }
            return tt;
          });

          if (hasChanges) {
            await updatePatientEncounter(enc.id, {
              toothTreatments: updatedToothTreatments,
            });
          }
        })
      );

      // Clean up selected state for billed items
      setSelectedBillingItems((prev) => {
        const next = { ...prev };
        selectedTreatments.forEach((st) => {
          delete next[`tt-${st.id}`];
          delete next[st.id];
        });
        if (billingEncounter) delete next[`fallback-${billingEncounter.id}`];
        return next;
      });

      queryClient.invalidateQueries({ queryKey: queryKeys.patients.encounters(patient.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.byPatientId(patient.id) });

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      doc.setFillColor(0, 188, 212);
      doc.ellipse(0, 0, 80, 50, "F");

      doc.setFillColor(0, 168, 204);
      doc.ellipse(210, 0, 120, 60, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Sanjivani Dentals", 190, 12, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("123 Dental Excellence Way, Medical District", 190, 17, { align: "right" });
      doc.text("+91 77750 89777", 190, 22, { align: "right" });
      doc.text("support@sanjivanidentals.com", 190, 27, { align: "right" });

      doc.setTextColor(33, 33, 33);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("TAX INVOICE", 105, 55, { align: "center" });

      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.5);
      doc.line(20, 60, 190, 60);

      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.setFont("helvetica", "bold");
      doc.text("PATIENT DETAILS", 20, 70);
      doc.text("INVOICE DETAILS", 120, 70);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(33, 33, 33);
      doc.text(`Name: ${patient.name}`, 20, 77);
      doc.text(`Phone: ${patient.phone}`, 20, 83);
      doc.text(`Email: ${patient.email || "—"}`, 20, 89);
      doc.text(`Patient ID: ${patient.id.slice(0, 8).toUpperCase()}`, 20, 95);

      doc.text(`Invoice No: #${invoiceId.slice(0, 8).toUpperCase()}`, 120, 77);
      doc.text(`Invoice Date: ${new Date().toLocaleDateString("en-GB")}`, 120, 83);
      doc.text(`Visit Date: ${new Date(billingEncounter.visitDate + "T00:00:00").toLocaleDateString("en-GB")}`, 120, 89);
      doc.text(`Payment Status: Pending`, 120, 95);

      doc.setDrawColor(220, 220, 220);
      doc.setFillColor(248, 248, 248);
      doc.rect(20, 110, 170, 8, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text("Tooth", 28, 115.5, { align: "center" });
      doc.text("Treatment Description", 40, 115.5);
      doc.text("Fee", 180, 115.5, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(33, 33, 33);
      let currentY = 118;
      selectedTreatments.forEach((item) => {
        currentY += 8;
        doc.rect(20, currentY - 5, 170, 8);
        doc.text(item.toothNumber !== undefined ? String(item.toothNumber) : "—", 28, currentY, { align: "center" });
        doc.text(item.treatmentName, 40, currentY);
        doc.text(`INR ${formatINR(item.fee)}`, 180, currentY, { align: "right" });
      });

      currentY += 15;
      doc.setFont("helvetica", "normal");
      doc.text("Subtotal:", 130, currentY);
      doc.text(`INR ${formatINR(subtotal)}`, 180, currentY, { align: "right" });

      if (discount > 0) {
        currentY += 6;
        doc.text("Discount:", 130, currentY);
        doc.setTextColor(220, 50, 50);
        doc.text(`-INR ${formatINR(discount)}`, 180, currentY, { align: "right" });
        doc.setTextColor(33, 33, 33);
      }

      currentY += 6;
      doc.text("Tax (18%):", 130, currentY);
      doc.text(`INR ${formatINR(tax)}`, 180, currentY, { align: "right" });

      currentY += 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Grand Total:", 130, currentY);
      doc.setTextColor(0, 188, 212);
      doc.text(`INR ${formatINR(total)}`, 180, currentY, { align: "right" });

      currentY += 25;
      doc.setTextColor(150, 150, 150);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Thank you for choosing Sanjivani Dentals.", 20, currentY);
      doc.text("This is a computer-generated invoice and requires no physical signature.", 20, currentY + 4);

      doc.setTextColor(33, 33, 33);
      doc.setFont("helvetica", "bold");
      doc.line(130, currentY + 5, 180, currentY + 5);
      doc.text("Authorized Signatory", 155, currentY + 10, { align: "center" });

      setInMemoryPdf(doc);
      setIsInvoiceSaved(true);
      showToast("Invoice generated successfully!");
    } catch (e: any) {
      console.error("Firestore save or PDF generation failed:", e);
      showToast(e.message || "Firestore save failed.");
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!inMemoryPdf || !generatedInvoiceId) {
      showToast("No invoice generated in memory.");
      return;
    }
    try {
      inMemoryPdf.save(`invoice_${generatedInvoiceId.slice(0, 8)}.pdf`);
      showToast("PDF downloaded successfully!");
    } catch (err) {
      console.error(err);
      showToast("Download failed.");
    }
  };

  const handleSendEmail = async () => {
    if (!generatedInvoiceId || !patient) {
      showToast("Invoice must be generated before sending.");
      return;
    }

    if (!patient.email) {
      showToast("Missing patient email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(patient.email)) {
      showToast("Invalid patient email address.");
      return;
    }

    setIsSendingEmail(true);

    try {
      await sendInvoiceEmail({
        invoiceId: generatedInvoiceId,
        patientEmail: patient.email,
        patientName: patient.name,
        clinicName: "Sanjivani Dentals",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.byPatientId(patient.id) });
      showToast("Invoice emailed successfully!");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Unable to send email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Form Handlers
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

  const handleToothTreatmentStatusChange = (
    encounterId: string,
    treatmentId: string,
    newStatus: "Planned" | "In Progress" | "Completed"
  ) => {
    const target = encounters.find((e) => e.id === encounterId);
    if (!target || !target.toothTreatments) return;

    const updatedTTs = target.toothTreatments.map((tt) => {
      if (tt.id === treatmentId) {
        return {
          ...tt,
          status: newStatus,
          treatmentStatus: newStatus,
        };
      }
      return tt;
    });

    const dataToUpdate: Partial<PatientEncounter> = {
      toothTreatments: updatedTTs,
    };

    const allCompleted = updatedTTs.every(
      (tt) => getTreatmentStatus(tt) === "Completed"
    );
    const anyInProgress = updatedTTs.some(
      (tt) => getTreatmentStatus(tt) === "In Progress"
    );
    const anyCompleted = updatedTTs.some(
      (tt) => getTreatmentStatus(tt) === "Completed"
    );

    if (allCompleted) {
      dataToUpdate.status = "Completed";
    } else if (anyInProgress || anyCompleted) {
      dataToUpdate.status = "In Progress";
    } else {
      dataToUpdate.status = "Pending";
    }

    updateEncounterMutation.mutate({ id: encounterId, data: dataToUpdate });
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
              This patient record does not exist or has been deleted from the registry.
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
          
          {/* Top Header Bar */}
          <header className="bg-white border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
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
                  <Stethoscope className="w-5 h-5 text-primary" /> Patient Clinical Workspace
                </h1>
                <p className="text-xs text-on-surface-variant">Streamlined diagnostic workspace & comprehensive treatment records</p>
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

          <main className="flex-grow p-4 sm:p-6 lg:p-8 space-y-6">
            
            {/* 1. COMPACT STICKY PATIENT SUMMARY HEADER */}
            <PatientStickyHeader
              patient={patient}
              medicalProfile={medicalProfile}
              encounters={encounters}
              invoices={patientInvoices}
              referrer={referrer}
              referredPatients={referredPatients}
              onOpenEditProfile={openEditProfile}
              onOpenAddEncounter={openAddEncounter}
              onOpenDentalChart={() => setIsDentalChartOpen(true)}
              whatsappUrl={whatsappUrl}
            />

            {/* 2. HORIZONTAL TAB NAVIGATION */}
            <TabNavigation
              activeTab={activeTab}
              onTabChange={handleTabChange}
              encountersCount={encounters.length}
              appointmentsCount={patientAppointments.length}
              invoicesCount={patientInvoices.length}
              hasMedicalAlert={!!medicalProfile?.allergies}
            />

            {/* 3. TAB CONTENT CONTAINER (CACHED DOM CONTAINERS FOR PERFORMANCE) */}
            <div className="pt-2">
              
              {/* Overview Tab */}
              {visitedTabs.has("overview") && (
                <div className={activeTab === "overview" ? "block" : "hidden"}>
                  <OverviewTab
                    patient={patient}
                    medicalProfile={medicalProfile}
                    encounters={encounters}
                    invoices={patientInvoices}
                    appointments={patientAppointments}
                    onSwitchTab={handleTabChange}
                    onOpenEditProfile={openEditProfile}
                    onOpenAddEncounter={openAddEncounter}
                    onOpenDentalChart={() => setIsDentalChartOpen(true)}
                  />
                </div>
              )}

              {/* Appointments Tab */}
              {visitedTabs.has("appointments") && (
                <div className={activeTab === "appointments" ? "block" : "hidden"}>
                  <AppointmentsTab
                    appointments={patientAppointments}
                    patientId={patientId}
                    patientPhone={patient.phone}
                  />
                </div>
              )}

              {/* Encounters Tab */}
              {visitedTabs.has("encounters") && (
                <div className={activeTab === "encounters" ? "block" : "hidden"}>
                  <EncountersTab
                    encounters={encounters}
                    isLoading={isEncountersLoading}
                    onLogFirstVisit={openAddEncounter}
                    selectedBillingItems={selectedBillingItems}
                    onToggleBillingItem={handleToggleBillingItem}
                    isEncounterAllBillingSelected={isEncounterAllBillingSelected}
                    onToggleAllBillingItems={handleToggleAllBillingItems}
                    calculateTotalFees={calculateTotalFees}
                    getTeethNumbers={getTeethNumbers}
                    onStatusChange={handleStatusChange}
                    onToothTreatmentStatusChange={handleToothTreatmentStatusChange}
                    onEditEncounter={openEditEncounter}
                    onDeleteEncounter={handleDeleteEncounter}
                    onPrescription={(e) => setPrescriptionEncounter(e)}
                    onInvoice={(e) => handleOpenBillingReview(e)}
                    onPrint={() => window.print()}
                    formatVisitDate={formatVisitDate}
                    formatINR={formatINR}
                  />
                </div>
              )}

              {/* Treatment Plan Tab */}
              {visitedTabs.has("treatment-plan") && (
                <div className={activeTab === "treatment-plan" ? "block" : "hidden"}>
                  <TreatmentPlanTab
                    encounters={encounters}
                    onOpenDentalChart={() => setIsDentalChartOpen(true)}
                  />
                </div>
              )}

              {/* Dental Chart Tab */}
              {visitedTabs.has("dental-chart") && (
                <div className={activeTab === "dental-chart" ? "block" : "hidden"}>
                  <DentalChartTab
                    patientId={patientId}
                    patientName={patient.name}
                    encounters={encounters}
                    onSaveTreatment={async (toothNumber, data) => {
                      await logToothTreatmentMutation.mutateAsync({ toothNumber, treatmentData: data });
                    }}
                    isSaving={logToothTreatmentMutation.isPending}
                  />
                </div>
              )}

              {/* Medical History Tab */}
              {visitedTabs.has("medical-history") && (
                <div className={activeTab === "medical-history" ? "block" : "hidden"}>
                  <MedicalHistoryTab
                    patient={patient}
                    medicalProfile={medicalProfile}
                    onOpenEditProfile={openEditProfile}
                  />
                </div>
              )}

              {/* Invoices & Payments Tab */}
              {visitedTabs.has("invoices") && (
                <div className={activeTab === "invoices" ? "block" : "hidden"}>
                  <InvoicesPaymentsTab
                    invoices={patientInvoices}
                    encounters={encounters}
                    patient={patient}
                    onOpenBillingReview={handleOpenBillingReview}
                  />
                </div>
              )}

              {/* Notes Tab */}
              {visitedTabs.has("notes") && (
                <div className={activeTab === "notes" ? "block" : "hidden"}>
                  <NotesTab
                    medicalProfile={medicalProfile}
                    encounters={encounters}
                    onOpenEditProfile={openEditProfile}
                  />
                </div>
              )}

              {/* Records Tab */}
              {visitedTabs.has("records") && (
                <div className={activeTab === "records" ? "block" : "hidden"}>
                  <RecordsTab />
                </div>
              )}

              {/* Documents Tab */}
              {visitedTabs.has("documents") && (
                <div className={activeTab === "documents" ? "block" : "hidden"}>
                  <DocumentsTab />
                </div>
              )}

            </div>
          </main>
        </div>
      </div>

      {/* ── EDIT MEDICAL PROFILE MODAL ── */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/55 backdrop-blur-xs" onClick={() => setIsEditProfileOpen(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-xl border border-outline-variant/10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-outline-variant/10 bg-surface-container-lowest flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2 font-sans">
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
          <div className="fixed inset-0 bg-black/55 backdrop-blur-xs" onClick={() => setIsEncounterModalOpen(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-xl border border-outline-variant/10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-outline-variant/10 bg-surface-container-lowest flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2 font-sans">
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

      {/* ── BILLING REVIEW MODAL ── */}
      {isBillingModalOpen && billingEncounter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/55 backdrop-blur-xs" onClick={() => setIsBillingModalOpen(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-xl border border-outline-variant/10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-outline-variant/10 bg-surface-container-lowest flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2 font-sans">
                <Receipt className="w-5 h-5 text-primary" />
                Billing Review
              </h3>
              <button
                onClick={() => setIsBillingModalOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant cursor-pointer transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/10 space-y-2">
                <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Patient Details</h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-on-surface-variant font-medium block text-[10px] uppercase">Name</span>
                    <span className="text-on-surface font-bold truncate block">{patient?.name}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-medium block text-[10px] uppercase">Mobile</span>
                    <span className="text-on-surface font-bold truncate block">{patient?.phone || "—"}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-medium block text-[10px] uppercase">Email</span>
                    <span className="text-on-surface font-bold truncate block" title={patient?.email || "No email"}>
                      {patient?.email || "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Select Completed Unbilled Treatments</h4>
                <div className="border border-outline-variant/15 rounded-lg overflow-hidden max-h-48 overflow-y-auto font-sans">
                  {getAllUnbilledCompletedTreatments().length === 0 ? (
                    <div className="p-4 text-center text-xs text-on-surface-variant/70 italic bg-surface-container-lowest">
                      No unbilled completed treatments found for this patient.
                    </div>
                  ) : (
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container border-b border-outline-variant/15 text-[10px] uppercase font-bold text-on-surface-variant">
                          <th className="p-2 w-10 text-center">Include</th>
                          <th className="p-2 border-r border-outline-variant/10 w-16 text-center">Tooth</th>
                          <th className="p-2 border-r border-outline-variant/10">Treatment</th>
                          <th className="p-2 text-right w-28">Unit Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10 font-medium">
                        {getAllUnbilledCompletedTreatments().map((item) => {
                          const isChecked =
                            !!selectedBillingItems[`tt-${item.id}`] ||
                            !!selectedBillingItems[`fallback-${item.encounterId}`] ||
                            !!selectedBillingItems[item.id];
                          return (
                            <tr key={item.id} className="hover:bg-surface-container-low/20">
                              <td className="p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleBillingItem(`tt-${item.id}`)}
                                  className="w-4 h-4 rounded text-primary cursor-pointer"
                                />
                              </td>
                              <td className="p-2 border-r border-outline-variant/10 text-center text-on-surface-variant font-semibold">
                                {item.toothNumber !== undefined ? `#${item.toothNumber}` : "General"}
                              </td>
                              <td className="p-2 border-r border-outline-variant/10 text-on-surface font-semibold">
                                <div>{item.treatmentName}</div>
                                <div className="text-[10px] text-on-surface-variant/70 font-normal">Date: {formatVisitDate(item.visitDate)}</div>
                              </td>
                              <td className="p-2 text-right font-extrabold text-on-surface font-mono">
                                ₹{formatINR(item.fee)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {(() => {
                const selectedItems = getSelectedTreatmentsForEncounter();
                const subtotal = calculateSubtotal(selectedItems);
                const tax = calculateTax(subtotal);
                const discount = discountPercentage;
                const total = calculateGrandTotal(subtotal, tax, discount);

                return (
                  <div className="border-t border-outline-variant/15 pt-3 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-on-surface-variant">
                      <span>Subtotal</span>
                      <span className="font-bold text-on-surface font-mono">₹{formatINR(subtotal)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Discount (INR)</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-on-surface-variant font-mono">₹</span>
                        <input
                          type="number"
                          min="0"
                          disabled={isInvoiceSaved}
                          value={discountPercentage || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (isNaN(val)) setDiscountPercentage(0);
                            else if (val < 0) setDiscountPercentage(0);
                            else setDiscountPercentage(val);
                          }}
                          className={`w-24 px-1.5 py-0.5 rounded border border-outline-variant text-right text-xs font-semibold focus:outline-none focus:border-primary bg-white text-on-surface ${
                            isInvoiceSaved ? "opacity-60 cursor-not-allowed" : ""
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-on-surface-variant">
                      <span>Tax (18% GST)</span>
                      <span className="font-bold text-on-surface font-mono">₹{formatINR(tax)}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm font-bold border-t border-outline-variant/10 pt-2 text-on-surface bg-white sticky bottom-0 z-10">
                      <span>Grand Total</span>
                      <span className="text-primary font-mono text-base">₹{formatINR(total)}</span>
                    </div>
                  </div>
                );
              })()}

              {!patient?.email && (
                <p className="text-[10px] text-amber-600 font-semibold italic bg-amber-50 p-2 rounded border border-amber-200">
                  * Patient does not have a registered email address. Email sending will be disabled.
                </p>
              )}
            </div>

            <div className="px-5 py-4 border-t border-outline-variant/10 bg-surface-container-lowest flex gap-3">
              {!isInvoiceSaved ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsBillingModalOpen(false)}
                    className="flex-1 border border-outline-variant/40 text-on-surface font-semibold py-2 rounded-lg text-xs hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isGeneratingInvoice}
                    onClick={handleGenerateInvoice}
                    className="flex-1 bg-primary text-white font-semibold py-2 rounded-lg text-xs hover:bg-primary/95 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingInvoice && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Generate Invoice
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsBillingModalOpen(false)}
                    className="border border-outline-variant/40 text-on-surface font-semibold px-4 py-2 rounded-lg text-xs hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="flex-1 bg-primary text-white font-semibold py-2.5 rounded-lg text-xs hover:bg-primary/95 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm font-sans"
                  >
                    Download PDF
                  </button>
                  <button
                    type="button"
                    disabled={!patient?.email || isSendingEmail}
                    onClick={handleSendEmail}
                    className="flex-1 bg-slate-800 text-white font-semibold py-2.5 rounded-lg text-xs hover:bg-slate-900 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 shadow-sm font-sans"
                    title={!patient?.email ? "Patient has no registered email" : "Email invoice PDF to patient"}
                  >
                    {isSendingEmail && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Send Email
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Prescription Modal */}
      {prescriptionEncounter && patient && (
        <PrescriptionModal
          isOpen={!!prescriptionEncounter}
          onClose={() => setPrescriptionEncounter(null)}
          encounter={prescriptionEncounter}
          patient={patient}
        />
      )}

      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-on-surface text-surface text-xs font-semibold px-4.5 py-3.5 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          {toastMsg}
        </div>
      )}
    </AdminAuthGuard>
  );
}
