"use client";

import React, { useState, use } from "react";
import { Timestamp } from "firebase/firestore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
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
  IndianRupee,
  Receipt,
  TrendingUp,
  Users,
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
  getPatientsByReferrer,
} from "../../../../lib/services/patientService";
import { getDoctors } from "../../../../lib/services/doctorService";
import { addInvoice, getInvoicesByPatientId } from "../../../../lib/services/invoiceService";
import { queryKeys } from "../../../../lib/query/queryKeys";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { calculateSubtotal, calculateTax, calculateGrandTotal } from "../../../../lib/services/billingService";
import { sendInvoiceEmail } from "../../../../lib/services/emailService";
import { PatientDetailsModalSkeleton } from "../../../../components/ui/Skeletons";
import type { PatientMedicalProfile, PatientEncounter, EncounterStatus, Invoice } from "../../../../lib/types";
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

/** Format YYYY-MM-DD to "DD MMM YYYY" e.g. "05 Jul 2026" */
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

/** Sum fees from toothTreatments array */
function calculateTotalFees(encounter: PatientEncounter): number {
  if (!encounter.toothTreatments || encounter.toothTreatments.length === 0) return 0;
  return encounter.toothTreatments.reduce((sum, tt) => sum + (tt.fee || 0), 0);
}

/** Get unique sorted tooth numbers */
function getTeethNumbers(encounter: PatientEncounter): number[] {
  if (!encounter.toothTreatments || encounter.toothTreatments.length === 0) return [];
  return Array.from(new Set(encounter.toothTreatments.map((tt) => tt.toothNumber))).sort((a, b) => a - b);
}

/** Format currency to INR without paise if .00 */
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
  const [expandedEncounterId, setExpandedEncounterId] = useState<string | null>(null);
  
  // Billing review workflow states
  const [selectedBillingItems, setSelectedBillingItems] = useState<Record<string, boolean>>({});
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [billingEncounter, setBillingEncounter] = useState<PatientEncounter | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState(0); // Used as flat discount amount
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [inMemoryPdf, setInMemoryPdf] = useState<jsPDF | null>(null);
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState<string | null>(null);
  const [isInvoiceSaved, setIsInvoiceSaved] = useState(false);
  
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

  // ── Billing Review Workflow Helpers ────────────────────────────────────────
  const handleToggleBillingItem = (itemId: string) => {
    setSelectedBillingItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const isEncounterAllBillingSelected = (encounter: PatientEncounter) => {
    if (encounter.toothTreatments && encounter.toothTreatments.length > 0) {
      const completedTTs = encounter.toothTreatments.filter(tt => tt.status === "Completed");
      if (completedTTs.length === 0) return false;
      return completedTTs.every(tt => !!selectedBillingItems[`tt-${tt.id}`]);
    } else if (encounter.treatments && encounter.treatments.length > 0) {
      return !!selectedBillingItems[`fallback-${encounter.id}`];
    }
    return false;
  };

  const handleToggleAllBillingItems = (encounter: PatientEncounter) => {
    const allSelected = isEncounterAllBillingSelected(encounter);
    const updated = { ...selectedBillingItems };

    if (encounter.toothTreatments && encounter.toothTreatments.length > 0) {
      const completedTTs = encounter.toothTreatments.filter(tt => tt.status === "Completed");
      completedTTs.forEach(tt => {
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

  const getSelectedTreatmentsForEncounter = (encounter: PatientEncounter) => {
    const list: Array<{ id: string; treatmentName: string; toothNumber?: number; fee: number }> = [];
    if (encounter.toothTreatments && encounter.toothTreatments.length > 0) {
      encounter.toothTreatments.forEach(tt => {
        if (tt.status === "Completed" && selectedBillingItems[`tt-${tt.id}`]) {
          list.push({
            id: tt.id,
            treatmentName: tt.treatmentName,
            toothNumber: tt.toothNumber,
            fee: tt.fee || 0
          });
        }
      });
    } else if (encounter.treatments && encounter.treatments.length > 0) {
      if (selectedBillingItems[`fallback-${encounter.id}`]) {
        list.push({
          id: `fallback-${encounter.id}`,
          treatmentName: encounter.treatments.join(" • "),
          fee: 0
        });
      }
    }
    return list;
  };

  const handleOpenBillingReview = (encounter: PatientEncounter) => {
    setBillingEncounter(encounter);
    setDiscountPercentage(0);
    setInMemoryPdf(null);
    setGeneratedInvoiceId(null);
    setIsInvoiceSaved(false);
    setIsBillingModalOpen(true);
  };

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

  // 5. Referred patients by this patient
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

  // 7. Invoices list for payment summary
  const { data: patientInvoices = [] } = useQuery<Invoice[]>({
    queryKey: queryKeys.invoices.byPatientId(patientId),
    queryFn: () => getInvoicesByPatientId(patientId),
    enabled: !!patientId,
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

  // ── Invoice Generation & Resend Email Workflow Handlers ─────────────────
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
      const discount = discountPercentage; // Flat discount input amount in ₹
      const total = calculateGrandTotal(subtotal, tax, discount);

      const invoiceDateStr = new Date().toISOString().split("T")[0];
      // Create new invoice in Firestore invoices collection matching the required schema
      const invoiceData = {
        patientId: patient.id,
        patientName: patient.name,
        encounterId: billingEncounter.id,
        encounterIds: [billingEncounter.id], // supports future multi-encounter invoicing
        visitDate: billingEncounter.visitDate,
        subtotal,
        tax,
        discount,
        total,
        amount: total, // for backward compatibility
        status: "UNPAID" as const,
        paymentStatus: "UNPAID" as const, // for backward compatibility
        paymentMethod: "None" as const, // for backward compatibility
        invoiceDate: invoiceDateStr,
        treatments: selectedTreatments.map(t => t.treatmentName),
        items: selectedTreatments,
        createdAt: Timestamp.now(),
        emailSent: false,
        
        // Extended payment fields
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

      // Save document to Firestore using the existing invoices collection configuration
      const invoiceId = await addInvoice(invoiceData);
      setGeneratedInvoiceId(invoiceId);

      // Invalidate queries to refresh the invoices list
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.byPatientId(patient.id) });

      // Generate PDF using jsPDF and store in memory (using INR text for character compatibility)
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Top brand banners
      doc.setFillColor(0, 188, 212); // #00bcd4
      doc.ellipse(0, 0, 80, 50, "F");

      doc.setFillColor(0, 168, 204); // #00a8cc
      doc.ellipse(210, 0, 120, 60, "F");

      // Clinic details
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Sanjivani Dentals", 190, 12, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("123 Dental Excellence Way, Medical District", 190, 17, { align: "right" });
      doc.text("+91 77750 89777", 190, 22, { align: "right" });
      doc.text("support@sanjivanidentals.com", 190, 27, { align: "right" });

      // Invoice title
      doc.setTextColor(33, 33, 33);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("TAX INVOICE", 105, 55, { align: "center" });

      // Divider
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.5);
      doc.line(20, 60, 190, 60);

      // Metadata grid headers
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

      // Billed Items Table Header
      doc.setDrawColor(220, 220, 220);
      doc.setFillColor(248, 248, 248);
      doc.rect(20, 110, 170, 8, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text("Tooth", 28, 115.5, { align: "center" });
      doc.text("Treatment Description", 40, 115.5);
      doc.text("Fee", 180, 115.5, { align: "right" });

      // Table Rows
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(33, 33, 33);
      let currentY = 118;
      selectedTreatments.forEach((item, idx) => {
        currentY += 8;
        doc.rect(20, currentY - 5, 170, 8);
        doc.text(item.toothNumber !== undefined ? String(item.toothNumber) : "—", 28, currentY, { align: "center" });
        doc.text(item.treatmentName, 40, currentY);
        doc.text(`INR ${formatINR(item.fee)}`, 180, currentY, { align: "right" });
      });

      // Totals
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
      doc.setTextColor(0, 188, 212); // Primary color
      doc.text(`INR ${formatINR(total)}`, 180, currentY, { align: "right" });

      // Signature Footer
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

      // Save PDF in state memory
      setInMemoryPdf(doc);
      setIsInvoiceSaved(true);
      showToast("Invoice generated successfully!");
    } catch (e: any) {
      console.error("Firestore save or PDF generation failed:", e);
      showToast(e.message || "Firestore save failed. Please try again.");
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
      showToast("Download failed. Please try again.");
    }
  };

  const handleSendEmail = async () => {
    if (!inMemoryPdf || !generatedInvoiceId || !patient) {
      showToast("Invoice must be generated before sending.");
      return;
    }

    if (!patient.email) {
      showToast("Missing patient email address.");
      return;
    }

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(patient.email)) {
      showToast("Invalid patient email address.");
      return;
    }

    setIsSendingEmail(true);

    try {
      // Get base64-encoded PDF from in-memory document
      const pdfBase64 = inMemoryPdf.output("datauristring").split(",")[1];

      // Invoke the client-side sendInvoiceEmail service
      await sendInvoiceEmail({
        invoiceId: generatedInvoiceId,
        patientEmail: patient.email,
        patientName: patient.name,
        pdfBase64,
        clinicName: "Sanjivani Dentals",
      });

      // Invalidate queries to refresh the invoices list
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.byPatientId(patient.id) });

      showToast("Invoice emailed successfully!");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Unable to send email. Please try again.");
    } finally {
      setIsSendingEmail(false);
    }
  };

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
            <div className="bg-white p-6 rounded-2xl border border-outline-variant/15 shadow-sm space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className={`w-20 h-20 rounded-2xl ${patient.avatarColor || "bg-primary"} flex items-center justify-center text-white font-bold text-2xl shadow-sm shrink-0`}>
                    {initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold text-on-surface leading-tight">{patient.name}</h1>
                      <span className="bg-secondary-container text-primary px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        Verified Patient
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-on-surface-variant font-medium">
                      <span>Registered: {formatTimestamp(patient.createdAt)}</span>
                      {patient.referralSource && (
                        <span>• Referral: <strong className="text-on-surface font-semibold">{patient.referralSource}</strong></span>
                      )}
                      {referrer && (
                        <span>• Referred By: <Link href={`/admin/patients/${referrer.id}`} className="text-primary font-bold hover:underline">{referrer.name}</Link></span>
                      )}
                      {referredPatients.length > 0 && (
                        <span>• Referred ({referredPatients.length}): <span className="text-on-surface font-semibold">{referredPatients.map(rp => rp.name).join(", ")}</span></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2.5">
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

              {/* Quick Basic Information Row Bar */}
              <div className="pt-4 border-t border-outline-variant/10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
                <div className="bg-slate-50/80 p-3 rounded-xl border border-outline-variant/10">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">Age / DOB</span>
                  <span className="font-semibold text-on-surface text-sm">{patient.age || "—"}</span>
                </div>
                <div className="bg-slate-50/80 p-3 rounded-xl border border-outline-variant/10">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">Gender</span>
                  <span className="font-semibold text-on-surface text-sm">{patient.gender || "—"}</span>
                </div>
                <div className="bg-slate-50/80 p-3 rounded-xl border border-outline-variant/10">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">Phone Number</span>
                  <span className="font-semibold text-on-surface text-sm">{patient.phone}</span>
                </div>
                <div className="bg-slate-50/80 p-3 rounded-xl border border-outline-variant/10">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">Email Address</span>
                  <span className="font-semibold text-on-surface text-sm truncate block" title={patient.email || "—"}>{patient.email || "—"}</span>
                </div>
                <div className="bg-slate-50/80 p-3 rounded-xl border border-outline-variant/10 col-span-2 sm:col-span-4 lg:col-span-1">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">Address</span>
                  <span className="font-semibold text-on-surface text-sm truncate block" title={patient.address || "—"}>{patient.address || "No address provided"}</span>
                </div>
              </div>
            </div>

            {/* CLINICAL SPEC GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Medical Profile & Clinical Notes Only (4 Cols) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Unified Card: Medical Profile & Clinical Notes */}
                <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm overflow-hidden flex flex-col h-fit">
                  <div className="p-6 space-y-6">

                    {/* Section 1: Medical Profile */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-primary" /> Medical Profile
                        </h3>
                        <button onClick={openEditProfile} className="text-primary text-xs font-bold hover:underline cursor-pointer">
                          Edit
                        </button>
                      </div>
                      <div className="space-y-3 pl-6">
                        <div>
                          <span className="text-on-surface-variant font-normal text-xs block mb-1">Blood Group</span>
                          {medicalProfile?.bloodGroup ? (
                            <span className="bg-red-50 text-red-700 px-2.5 py-0.5 rounded border border-red-200 text-xs font-bold inline-block">
                              {medicalProfile.bloodGroup}
                            </span>
                          ) : (
                            <p className="text-xs text-on-surface-variant/75 italic font-normal">No blood group added</p>
                          )}
                        </div>
                        <div>
                          <span className="text-on-surface-variant font-normal text-xs block mb-1">Allergies</span>
                          {medicalProfile?.allergies ? (
                            <p className="text-xs text-red-800 bg-red-50 border border-red-200/50 p-2 rounded-lg leading-relaxed font-semibold">
                              {medicalProfile.allergies}
                            </p>
                          ) : (
                            <p className="text-xs text-on-surface-variant/75 italic font-normal">No allergies recorded</p>
                          )}
                        </div>
                        <div>
                          <span className="text-on-surface-variant font-normal text-xs block mb-1">Chronic Diseases</span>
                          {medicalProfile?.chronicDiseases && medicalProfile.chronicDiseases !== "None" ? (
                            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200/50 p-2 rounded-lg leading-relaxed font-semibold">
                              {medicalProfile.chronicDiseases}
                            </p>
                          ) : (
                            <p className="text-xs text-on-surface-variant/75 italic font-normal">No chronic conditions</p>
                          )}
                        </div>
                        <div>
                          <span className="text-on-surface-variant font-normal text-xs block mb-1">Medical Conditions</span>
                          <p className="text-xs text-on-surface font-medium">
                            {medicalProfile?.medicalConditions || <span className="italic font-normal text-on-surface-variant/70">No medical conditions recorded</span>}
                          </p>
                        </div>
                        <div>
                          <span className="text-on-surface-variant font-normal text-xs block mb-1">Current Treatment Status</span>
                          <p className={`text-xs font-semibold ${activeEncounter ? "text-primary" : "text-on-surface-variant/75 italic font-normal"}`}>
                            {currentTreatmentText}
                          </p>
                        </div>
                        <div>
                          <span className="text-on-surface-variant font-normal text-xs block mb-1">Emergency Contact</span>
                          <p className="text-xs text-on-surface font-semibold flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-primary" />
                            {medicalProfile?.emergencyContact || <span className="text-on-surface-variant/75 italic font-normal">No emergency contact added</span>}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-outline-variant/10" />

                    {/* Section 2: Clinical Notes */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" /> Clinical Notes
                      </h3>
                      <div className="pl-6">
                        {medicalProfile?.clinicalNotes ? (
                          <p className="text-xs text-on-surface font-medium leading-relaxed whitespace-pre-wrap">
                            {medicalProfile.clinicalNotes}
                          </p>
                        ) : (
                          <p className="text-xs text-on-surface-variant/75 italic font-normal">No clinical notes recorded</p>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* Right Column: Dynamic visit encounters (8 Cols) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Timeline Card */}
                <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm p-6 flex flex-col h-[350px]">
                  <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4 shrink-0">
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

                  <div className="flex-1 overflow-y-auto mt-4 pr-1 scrollbar-thin">

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
                    <div className="space-y-2">
                      {encounters.map((e) => {
                        const isCompleted = e.status === "Completed";
                        const isInProgress = e.status === "In Progress";
                        const isCancelled = e.status === "Cancelled";
                        const isExpanded = expandedEncounterId === e.id;
                        const totalFees = calculateTotalFees(e);
                        const teethNums = getTeethNumbers(e);

                        // Compact treatment summary: first 3 with • separator
                        const treatments = e.treatments || [];
                        const treatmentPreview = treatments.slice(0, 3).join(" • ");
                        const hasMoreTreatments = treatments.length > 3;

                        const statusColor = isCompleted
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : isInProgress
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : isCancelled
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-gray-50 text-gray-700 border-gray-200";

                        const statusDot = isCompleted
                          ? "bg-emerald-500"
                          : isInProgress
                          ? "bg-blue-500 animate-pulse"
                          : isCancelled
                          ? "bg-red-500"
                          : "bg-gray-400";

                        return (
                          <div
                            key={e.id}
                            className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                              isExpanded
                                ? "border-primary/25 shadow-md bg-white"
                                : "border-outline-variant/15 bg-white hover:border-outline-variant/30 hover:shadow-sm"
                            }`}
                          >
                            {/* ─── Compact Summary Header ─── */}
                            <div className="flex items-center gap-2 px-3 py-2.5">
                              {/* Billing checkbox */}
                              <input
                                type="checkbox"
                                checked={isEncounterAllBillingSelected(e)}
                                onChange={() => handleToggleAllBillingItems(e)}
                                className="w-3.5 h-3.5 rounded border-outline-variant/30 cursor-pointer shrink-0"
                                title="Toggle all completed treatments for billing"
                                onClick={(ev) => ev.stopPropagation()}
                              />

                              {/* Status dot */}
                              <div className={`w-2 h-2 rounded-full shrink-0 ${statusDot}`} />

                              {/* Clickable summary content */}
                              <button
                                type="button"
                                onClick={() => setExpandedEncounterId(isExpanded ? null : e.id)}
                                className="flex-1 min-w-0 text-left cursor-pointer focus:outline-none group"
                              >
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Date */}
                                  <span className="text-[13px] font-semibold text-on-surface whitespace-nowrap">
                                    {formatVisitDate(e.visitDate)}
                                  </span>

                                  <span className="text-outline-variant/40 text-xs">|</span>

                                  {/* Doctor */}
                                  <span className="text-xs text-on-surface-variant font-medium whitespace-nowrap">
                                    {e.doctorName || "Dr. Moore"}
                                  </span>

                                  <span className="text-outline-variant/40 text-xs">|</span>

                                  {/* Status */}
                                  <span className={`inline-flex px-1.5 py-px rounded text-[9px] font-bold border ${statusColor}`}>
                                    {e.status}
                                  </span>

                                  {/* Fees */}
                                  {totalFees > 0 && (
                                    <>
                                      <span className="text-outline-variant/40 text-xs">|</span>
                                      <span className="text-xs font-bold text-on-surface whitespace-nowrap">
                                        ₹{formatINR(totalFees)}
                                      </span>
                                    </>
                                  )}
                                </div>

                                {/* Second line: Treatments + Teeth */}
                                <div className="flex items-center gap-2 mt-1 text-[11px]">
                                  {treatmentPreview && (
                                    <span className="text-on-surface-variant font-medium truncate max-w-[280px]" title={treatments.join(", ")}>
                                      {treatmentPreview}{hasMoreTreatments ? ` +${treatments.length - 3}` : ""}
                                    </span>
                                  )}
                                  {teethNums.length > 0 && (
                                    <>
                                      <span className="text-outline-variant/30">|</span>
                                      <span className="text-on-surface-variant/70 font-medium whitespace-nowrap">
                                        Teeth: <span className="text-on-surface font-semibold">{teethNums.join(", ")}</span>
                                      </span>
                                    </>
                                  )}
                                </div>
                              </button>

                              {/* Expand chevron */}
                              <button
                                type="button"
                                onClick={() => setExpandedEncounterId(isExpanded ? null : e.id)}
                                className="shrink-0 p-1 rounded text-on-surface-variant/40 hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>

                            {/* ─── Expanded Detail Panel ─── */}
                            {isExpanded && (
                              <div className="border-t border-outline-variant/10 bg-surface-container-low/30 px-4 py-2 space-y-2">

                                {/* Treatment Table — main content */}
                                {e.toothTreatments && e.toothTreatments.length > 0 ? (
                                  <div className="rounded-lg border border-outline-variant/10 overflow-hidden">
                                    {/* Table header */}
                                    <div className="grid grid-cols-[50px_1fr_80px_70px_60px] gap-1 px-3 py-1.5 bg-surface-container-lowest text-[10px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/10">
                                      <span>Tooth</span>
                                      <span>Treatment</span>
                                      <span>Status</span>
                                      <span className="text-right">Fee</span>
                                      <span className="text-center">Billing</span>
                                    </div>
                                    {/* Table rows */}
                                    {e.toothTreatments.map((tt) => (
                                      <div key={tt.id} className="grid grid-cols-[50px_1fr_80px_70px_60px] gap-1 px-3 py-1.5 text-xs border-b border-outline-variant/5 last:border-b-0 items-center">
                                        <span className="text-on-surface-variant font-medium">{tt.toothNumber}</span>
                                        <span className="text-on-surface font-semibold">{tt.treatmentName}</span>
                                        <span className={`inline-flex items-center px-1.5 py-px rounded text-[9px] font-bold w-fit ${
                                          tt.status === "Completed" ? "bg-emerald-50 text-emerald-700" :
                                          tt.status === "In Progress" ? "bg-blue-50 text-blue-700" :
                                          "bg-gray-50 text-gray-600"
                                        }`}>{tt.status}</span>
                                        <span className="text-right font-bold text-on-surface">₹{formatINR(tt.fee)}</span>
                                        <span className="flex justify-center">
                                          <input
                                            type="checkbox"
                                            disabled={tt.status !== "Completed"}
                                            checked={!!selectedBillingItems[`tt-${tt.id}`]}
                                            onChange={() => handleToggleBillingItem(`tt-${tt.id}`)}
                                            className={`w-3.5 h-3.5 rounded border-outline-variant/30 cursor-pointer ${
                                              tt.status !== "Completed" ? "opacity-30 cursor-not-allowed" : ""
                                            }`}
                                            title={tt.status !== "Completed" ? "Only completed treatments can be billed" : "Select for billing"}
                                          />
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : treatments.length > 0 ? (
                                  /* Fallback: if only manual treatments exist (no toothTreatments) */
                                  <div className="flex items-center justify-between text-xs py-1 px-1 bg-surface-container-lowest rounded border border-outline-variant/10">
                                    <div className="flex items-baseline gap-2">
                                      <span className="text-on-surface-variant/70 font-bold uppercase tracking-wider text-[10px] shrink-0">Treatments</span>
                                      <span className="text-on-surface font-medium">{treatments.join(" • ")}</span>
                                    </div>
                                    <span className="flex items-center gap-1 text-[10px] text-on-surface-variant font-medium">
                                      Billing:{" "}
                                      <input
                                        type="checkbox"
                                        checked={!!selectedBillingItems[`fallback-${e.id}`]}
                                        onChange={() => handleToggleBillingItem(`fallback-${e.id}`)}
                                        className="w-3.5 h-3.5 rounded border-outline-variant/30 cursor-pointer"
                                      />
                                    </span>
                                  </div>
                                ) : null}

                                {/* Follow-up — simple inline text below the table */}
                                <div className="text-xs text-on-surface-variant/80 font-medium">
                                  <span>Follow-up: </span>
                                  <span className="text-on-surface font-semibold">
                                    {e.followUpDate ? formatVisitDate(e.followUpDate) : "None scheduled"}
                                  </span>
                                </div>

                                {/* Actions row */}
                                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-outline-variant/10">
                                  {/* Status actions */}
                                  <div className="flex items-center gap-1.5">
                                    {!isCompleted && (
                                      <button
                                        onClick={() => handleStatusChange(e.id, "Completed")}
                                        className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-500 hover:text-white border border-emerald-200 text-emerald-700 transition-colors text-[10px] font-bold cursor-pointer"
                                      >
                                        Mark Completed
                                      </button>
                                    )}
                                    {!isInProgress && !isCompleted && (
                                      <button
                                        onClick={() => handleStatusChange(e.id, "In Progress")}
                                        className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-500 hover:text-white border border-blue-200 text-blue-700 transition-colors text-[10px] font-bold cursor-pointer"
                                      >
                                        Start
                                      </button>
                                    )}
                                    {!isCancelled && (
                                      <button
                                        onClick={() => handleStatusChange(e.id, "Cancelled")}
                                        className="px-2 py-1 rounded bg-red-50 hover:bg-red-500 hover:text-white border border-red-200 text-red-700 transition-colors text-[10px] font-bold cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                  </div>

                                  {/* Edit / Delete / Generate Invoice */}
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => openEditEncounter(e)}
                                      className="p-1 rounded bg-white hover:bg-surface-container border border-outline-variant/30 text-on-surface-variant transition-colors cursor-pointer"
                                      title="Edit"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteEncounter(e.id)}
                                      className="p-1 rounded bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 border border-outline-variant/30 text-on-surface-variant transition-colors cursor-pointer"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    {(() => {
                                      const selectedItems = getSelectedTreatmentsForEncounter(e);
                                      const hasSelected = selectedItems.length > 0;
                                      return (
                                        <button
                                          type="button"
                                          disabled={!hasSelected}
                                          onClick={() => handleOpenBillingReview(e)}
                                          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                                            hasSelected
                                              ? "bg-emerald-50 hover:bg-emerald-500 hover:text-white border-emerald-200 text-emerald-700 cursor-pointer"
                                              : "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-50"
                                          }`}
                                          title={hasSelected ? "Open Billing Review" : "Select completed treatments to bill"}
                                        >
                                          <Receipt className="w-3 h-3" />
                                          Generate Invoice
                                        </button>
                                      );
                                    })()}
                                  </div>
                                </div>

                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  </div>
                </div>

                {/* 2. Dental Chart Section (DOMINATING, height 480px) */}
                <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm overflow-hidden select-none flex flex-col h-[480px]">
                  <div className="p-4 bg-[#1b5e20] text-white flex items-center justify-between shrink-0">
                    <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 font-sans">
                      <Activity className="w-4 h-4" />
                      Dental Chart & Interactive Diagnostics
                    </h3>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                      Interactive Workspace
                    </span>
                  </div>
                  <div className="p-8 flex-1 flex flex-col items-center justify-between text-center bg-slate-50">
                    <div className="space-y-2">
                      <h4 className="text-base font-bold text-on-surface">Visual Dental Chart Workspace</h4>
                      <p className="text-xs font-medium text-on-surface-variant max-w-md mx-auto leading-relaxed">
                        Access the full anatomical 32-tooth and pediatric dental chart workspace to diagnose specific tooth conditions, log treatments, and schedule restorations.
                      </p>
                    </div>
                    
                    {/* Stylized representation of dental arches */}
                    <div className="w-full max-w-sm py-4 opacity-75 hover:opacity-100 transition-opacity">
                      <svg viewBox="0 0 200 100" className="w-full h-auto text-primary">
                        <path d="M20,90 Q100,10 180,90" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="4 6" className="text-[#1b5e20]/40" />
                        <path d="M30,90 Q100,30 170,90" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 4" className="text-[#1b5e20]/20" />
                        {/* Draw stylized teeth */}
                        {[30, 50, 70, 90, 110, 130, 150, 170].map((cx, i) => {
                          const t = (cx - 20) / 160;
                          const cy = (1-t)*(1-t)*90 + 2*(1-t)*t*10 + t*t*90;
                          return (
                            <g key={i}>
                              <circle cx={cx} cy={cy} r="6" fill="#ffffff" stroke="#1b5e20" strokeWidth="1.5" className="hover:fill-[#1b5e20]/10 cursor-pointer" onClick={() => setIsDentalChartOpen(true)} />
                              <rect x={cx-1.5} y={cy+6} width="3" height="10" fill="#1b5e20" />
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    <button
                      onClick={() => setIsDentalChartOpen(true)}
                      className="px-6 py-3 bg-[#1b5e20] hover:bg-[#123f15] text-white text-sm font-semibold rounded-xl transition-all hover:scale-[1.01] active:scale-95 cursor-pointer shadow-sm flex items-center gap-2"
                    >
                      <Activity className="w-4 h-4" /> Open Dental Chart Workspace
                    </button>
                  </div>
                </div>

                {/* 3. Payment Summary (KPI-style card relocated below Dental Chart) */}
                <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm overflow-hidden">
                  <div className="p-4 bg-surface-container-lowest border-b border-outline-variant/10 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2 font-sans">
                      <IndianRupee className="w-4 h-4 text-primary" /> Financial Overview & Payments
                    </h3>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                      {patientInvoices.length} Invoice{patientInvoices.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {(() => {
                      const totalBilled = patientInvoices.reduce((sum, inv: Invoice) => sum + (inv.total || inv.amount || 0), 0);
                      const totalPaid = patientInvoices.reduce((sum, inv: Invoice) => {
                        const history = inv.paymentHistory || [];
                        if (history.length > 0) {
                          return sum + history.reduce((s: number, pay: any) => pay.paymentType !== "Generated" ? s + pay.amountReceived : s, 0);
                        }
                        return sum + ((inv.paymentStatus === "Paid" || inv.paymentStatus === "PAID") ? (inv.total || inv.amount || 0) : (inv.paidAmount || 0));
                      }, 0);
                      const outstanding = Math.max(0, totalBilled - totalPaid);

                      // Partial payments calculation
                      const partialInvoices = patientInvoices.filter((inv: Invoice) => {
                        const paidAmt = inv.paidAmount || 0;
                        const totAmt = inv.total || inv.amount || 0;
                        return paidAmt > 0 && paidAmt < totAmt;
                      });
                      const partialCount = partialInvoices.length;
                      const partialBalance = partialInvoices.reduce((sum, inv: Invoice) => sum + (inv.remainingAmount !== undefined ? inv.remainingAmount : ((inv.total || inv.amount || 0) - (inv.paidAmount || 0))), 0);

                      // Overdue amount calculation
                      const overdueInvoices = patientInvoices.filter((inv: Invoice) => {
                        const paidAmt = inv.paidAmount || 0;
                        const totAmt = inv.total || inv.amount || 0;
                        if (paidAmt >= totAmt) return false;
                        
                        const dueDateStr = inv.dueDate || inv.invoiceDate;
                        if (!dueDateStr) return false;

                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const [year, month, day] = dueDateStr.split("-").map(Number);
                        const due = new Date(year, month - 1, day);
                        due.setHours(0, 0, 0, 0);
                        return due.getTime() < today.getTime();
                      });
                      const overdueAmount = overdueInvoices.reduce((sum, inv: Invoice) => sum + (inv.remainingAmount !== undefined ? inv.remainingAmount : ((inv.total || inv.amount || 0) - (inv.paidAmount || 0))), 0);

                      // Combined payment events
                      const allPayments: Array<{ date: string; amount: number; method: string; invoiceNo: string }> = [];
                      patientInvoices.forEach((inv: Invoice) => {
                        const history = inv.paymentHistory || [];
                        const invNo = inv.id.slice(0, 8).toUpperCase();
                        history.forEach((pay: any) => {
                          if (pay.paymentType !== "Generated" && pay.amountReceived > 0) {
                            allPayments.push({
                              date: pay.paymentDate,
                              amount: pay.amountReceived,
                              method: pay.paymentMethod,
                              invoiceNo: invNo,
                            });
                          }
                        });
                      });
                      // Sort by date descending
                      allPayments.sort((a, b) => b.date.localeCompare(a.date));
                      const recentPayments = allPayments.slice(0, 3);

                      return (
                        <div className="space-y-6">
                          {/* KPI Cards Grid */}
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-4 bg-slate-50 border border-outline-variant/10 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
                              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Total Billed</span>
                              <span className="font-extrabold text-on-surface text-xl font-mono block">₹{formatINR(totalBilled)}</span>
                            </div>
                            <div className="p-4 bg-emerald-50/40 border border-emerald-100/50 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
                              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">Total Paid</span>
                              <span className="font-extrabold text-emerald-600 text-xl font-mono block">₹{formatINR(totalPaid)}</span>
                            </div>
                            <div className="p-4 bg-red-50/40 border border-red-100/50 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
                              <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block mb-1">Outstanding Balance</span>
                              <span className="font-black text-red-600 text-xl font-mono block">₹{formatINR(outstanding)}</span>
                            </div>
                            <div className="p-4 bg-amber-50/40 border border-amber-100/50 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
                              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">Overdue Amount</span>
                              <span className="font-extrabold text-amber-700 text-xl font-mono block">₹{formatINR(overdueAmount)}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-outline-variant/10">
                            {/* Left Col: Partial Payments Info */}
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                                <Receipt className="w-3.5 h-3.5 text-primary" /> Partial Payments Status
                              </h4>
                              <div className="bg-slate-50 border border-outline-variant/10 p-4 rounded-xl text-xs space-y-2 font-medium">
                                <div className="flex justify-between items-center text-on-surface-variant">
                                  <span>Partial Payment Invoices:</span>
                                  <span className="font-bold text-on-surface text-sm">{partialCount}</span>
                                </div>
                                <div className="flex justify-between items-center text-on-surface-variant">
                                  <span>Remaining Due on Partials:</span>
                                  <span className="font-bold text-red-600 font-mono text-sm">₹{formatINR(partialBalance)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Right Col: Recent Payments timeline */}
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-primary" /> Recent Payments History
                              </h4>
                              {recentPayments.length === 0 ? (
                                <p className="text-xs text-on-surface-variant italic font-normal py-3 bg-slate-50/50 border border-dashed border-outline-variant/10 rounded-xl text-center">No payment history recorded</p>
                              ) : (
                                <div className="space-y-2.5">
                                  {recentPayments.map((p, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-slate-50 border border-outline-variant/10 p-3 rounded-xl text-xs shadow-sm hover:shadow-md transition-shadow">
                                      <div className="min-w-0">
                                        <span className="font-bold text-on-surface block truncate">₹{formatINR(p.amount)} via {p.method}</span>
                                        <span className="text-[10px] text-on-surface-variant/80 font-medium">Invoice #{p.invoiceNo} · {p.date}</span>
                                      </div>
                                      <span className="px-2 py-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md shrink-0">
                                        Received
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

              </div>{/* end right column lg:col-span-8 */}

            </div>{/* end grid lg:grid-cols-12 */}

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

      {/* ── BILLING REVIEW MODAL ── */}
      {isBillingModalOpen && billingEncounter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setIsBillingModalOpen(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-xl border border-outline-variant/10 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
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

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Patient Information Grid */}
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

              {/* Selected Treatments Table */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Selected Treatments</h4>
                <div className="border border-outline-variant/15 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container border-b border-outline-variant/15 text-[10px] uppercase font-bold text-on-surface-variant">
                        <th className="p-2 border-r border-outline-variant/10 w-16 text-center">Tooth</th>
                        <th className="p-2 border-r border-outline-variant/10">Treatment</th>
                        <th className="p-2 text-right w-28">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {getSelectedTreatmentsForEncounter(billingEncounter).map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-surface-container-low/20">
                          <td className="p-2 border-r border-outline-variant/10 text-center text-on-surface-variant font-medium">
                            {item.toothNumber !== undefined ? item.toothNumber : "—"}
                          </td>
                          <td className="p-2 border-r border-outline-variant/10 text-on-surface font-semibold">
                            {item.treatmentName}
                          </td>
                          <td className="p-2 text-right font-bold text-on-surface font-mono">
                            ₹{formatINR(item.fee)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Billing Summary Calculations */}
              {(() => {
                const selectedItems = getSelectedTreatmentsForEncounter(billingEncounter);
                const subtotal = calculateSubtotal(selectedItems);
                const tax = calculateTax(subtotal);
                const discount = discountPercentage; // flat INR discount
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

              {/* Validations & Warnings */}
              {!patient?.email && (
                <p className="text-[10px] text-amber-600 font-semibold italic bg-amber-50 p-2 rounded border border-amber-200">
                  * Patient does not have a registered email address. Email resending will be disabled.
                </p>
              )}
            </div>

            {/* Modal Buttons Footer */}
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
