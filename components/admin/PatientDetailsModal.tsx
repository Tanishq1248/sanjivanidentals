"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  X,
  Phone,
  Mail,
  Calendar,
  FileText,
  User,
  Heart,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  AlertTriangle,
  Activity,
  Check,
  ShieldAlert,
  CreditCard,
  Clock,
  XCircle,
} from "lucide-react";
import type { Patient, Appointment, Invoice } from "../../lib/types";
import { getAppointmentsByPhone } from "../../lib/services/appointmentService";
import { getPatientMedicalProfile, getPatientEncounters } from "../../lib/services/patientService";
import { getInvoicesByPatientId } from "../../lib/services/invoiceService";
import { queryKeys } from "../../lib/query/queryKeys";
import { PatientDetailsModalSkeleton, useDelayLoading } from "../ui/Skeletons";

/* ─── WhatsApp SVG Icon ─── */
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

interface PatientDetailsModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusStyles: Record<string, string> = {
  Confirmed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "In Progress": "bg-blue-50 text-blue-700 border border-blue-200",
  Pending: "bg-gray-100 text-gray-600 border border-gray-200",
  Cancelled: "bg-red-50 text-red-600 border border-red-200",
  Completed: "bg-violet-50 text-violet-700 border border-violet-200",
};

export function PatientDetailsModal({
  patient,
  isOpen,
  onClose,
}: PatientDetailsModalProps) {
  // ── Queries ──────────────────────────────────────────────────────────────
  // 1. Appointments history
  const { data: appointments = [], isLoading: isAptsLoading } = useQuery<Appointment[]>({
    queryKey: queryKeys.appointments.byPhone(patient?.phone ?? "", 20),
    queryFn: () => getAppointmentsByPhone(patient!.phone, 20),
    enabled: isOpen && !!patient && patient.id !== "Unregistered",
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // 2. Medical Profile
  const { data: medicalProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: queryKeys.patients.medicalProfile(patient?.id ?? ""),
    queryFn: () => getPatientMedicalProfile(patient!.id),
    enabled: isOpen && !!patient && patient.id !== "Unregistered",
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // 3. Encounters list
  const { data: encounters = [], isLoading: isEncountersLoading } = useQuery({
    queryKey: queryKeys.patients.encounters(patient?.id ?? ""),
    queryFn: () => getPatientEncounters(patient!.id),
    enabled: isOpen && !!patient && patient.id !== "Unregistered",
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // 4. Invoices list
  const { data: invoicesList = [], isLoading: isInvoicesLoading } = useQuery<Invoice[]>({
    queryKey: queryKeys.invoices.byPatientId(patient?.id ?? ""),
    queryFn: () => getInvoicesByPatientId(patient!.id),
    enabled: isOpen && !!patient && patient.id !== "Unregistered",
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const showSkeleton = useDelayLoading(isAptsLoading || isProfileLoading || isEncountersLoading || isInvoicesLoading, 300);

  if (!isOpen || !patient) return null;

  const initials = patient.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const cleanPhone = patient.phone.replace(/\D/g, "");
  const whatsappMsg = encodeURIComponent(
    `Hello ${patient.name}! 👋 This is Sanjivani Dentals. We are checking in regarding your treatment. Please let us know if you have any questions!`
  );
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${whatsappMsg}`;

  // Derive latest active encounter details
  const activeEncounter = encounters.find((e) => e.status === "In Progress");
  const currentTreatmentText = activeEncounter
    ? `${activeEncounter.chiefComplaint} (${activeEncounter.treatments.join(", ")})`
    : "No active treatment";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Section */}
        <div className="px-6 py-5 border-b border-outline-variant/10 bg-surface-container-lowest flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl ${patient.avatarColor || "bg-primary"} flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-sm`}
            >
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface leading-tight">
                {patient.name}
              </h2>
              <p className="text-xs text-on-surface-variant mt-1 font-semibold flex items-center gap-2">
                <span>Patient ID: #{patient.id.slice(0, 8)}</span>
                <span>•</span>
                <span className="bg-secondary-container text-primary px-2 py-0.5 rounded text-[10px] font-bold">
                  Active Profile
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#f8fafc]">
          
          {/* Row 1: Personal & Contact Information Panel */}
          <div className="bg-white rounded-xl p-5 border border-outline-variant/15 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Column 1: Personal Attributes */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5 border-b border-outline-variant/10 pb-2">
                <User className="w-4 h-4 text-primary" /> Patient Details
              </h3>
              <div className="space-y-1.5 text-sm font-medium text-on-surface">
                <p><span className="text-on-surface-variant">Age / DOB:</span> {patient.age || "—"}</p>
                <p><span className="text-on-surface-variant">Gender:</span> {patient.gender || "—"}</p>
                <p>
                  <span className="text-on-surface-variant">Blood Type:</span>{" "}
                  {medicalProfile?.bloodGroup ? (
                    <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-200 text-xs font-bold">
                      {medicalProfile.bloodGroup}
                    </span>
                  ) : (
                    <span className="text-xs text-on-surface-variant/75 italic">No blood group added</span>
                  )}
                </p>
              </div>
            </div>

            {/* Column 2: Contact Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5 border-b border-outline-variant/10 pb-2">
                <Phone className="w-4 h-4 text-primary" /> Contact Details
              </h3>
              <div className="space-y-2 text-sm font-medium">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-on-surface font-medium truncate">
                    <span>{patient.phone}</span>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-md bg-[#dcfce7] hover:bg-green-200 flex items-center justify-center transition-colors cursor-pointer"
                      title="WhatsApp Message"
                    >
                      <WhatsAppIcon className="w-4 h-4 text-green-600" />
                    </a>
                    <a
                      href={`tel:${cleanPhone}`}
                      className="w-7 h-7 rounded-md bg-secondary-container hover:bg-primary/10 flex items-center justify-center transition-colors cursor-pointer"
                      title="Phone Call"
                    >
                      <Phone className="w-3.5 h-3.5 text-primary" />
                    </a>
                  </div>
                </div>
                {patient.email && (
                  <p className="flex items-center gap-2 text-on-surface font-medium truncate">
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                    <a href={`mailto:${patient.email}`} className="hover:underline truncate">{patient.email}</a>
                  </p>
                )}
              </div>
            </div>

            {/* Column 3: Registration Status */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5 border-b border-outline-variant/10 pb-2">
                <Calendar className="w-4 h-4 text-primary" /> Clinic Summary
              </h3>
              <div className="space-y-1.5 text-sm font-medium text-on-surface">
                <p>
                  <span className="text-on-surface-variant">Condition:</span>{" "}
                  <span className="font-semibold text-primary">
                    {medicalProfile?.medicalConditions || <span className="text-on-surface-variant/75 italic">No medical conditions</span>}
                  </span>
                </p>
                <p>
                  <span className="text-on-surface-variant">Last Visit:</span>{" "}
                  {patient.lastVisit || "No recorded visits"}
                </p>
                <p className="truncate max-w-[240px]">
                  <span className="text-on-surface-variant">Active Treatment:</span>{" "}
                  <span className={`font-semibold ${activeEncounter ? "text-primary text-[11px]" : "text-on-surface-variant/75 italic text-xs"}`}>
                    {currentTreatmentText}
                  </span>
                </p>
              </div>
            </div>

          </div>

          {/* Row 2: Medical History & Active Treatment Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Medical History Section */}
            <div className="bg-white rounded-xl p-5 border border-outline-variant/15 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5 border-b border-outline-variant/10 pb-2">
                <ShieldAlert className="w-4 h-4 text-red-500" /> Medical History & allergies
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 bg-red-50/50 border border-red-200/50 rounded-xl space-y-1.5">
                  <span className="text-red-700 font-bold text-xs flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> ALLERGIES
                  </span>
                  <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                    {medicalProfile?.allergies || <span className="italic">No allergies recorded</span>}
                  </p>
                </div>
                <div className="p-3.5 bg-surface-container rounded-xl space-y-1.5">
                  <span className="text-on-surface font-bold text-xs">CHRONIC CONDITIONS</span>
                  <p className={`text-xs font-semibold leading-relaxed ${
                    medicalProfile?.chronicDiseases && medicalProfile.chronicDiseases !== "None" ? "text-red-600" : "text-on-surface-variant"
                  }`}>
                    {medicalProfile?.chronicDiseases || <span className="italic">No chronic conditions</span>}
                  </p>
                </div>
              </div>
              {medicalProfile?.clinicalNotes && (
                <div className="bg-surface-container-low rounded-xl p-3.5 border border-outline-variant/5">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Clinical Notes</p>
                  <p className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap">{medicalProfile.clinicalNotes}</p>
                </div>
              )}
            </div>

            {/* Treatment Timeline Section */}
            <div className="bg-white rounded-xl p-5 border border-outline-variant/15 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5 border-b border-outline-variant/10 pb-2">
                <Activity className="w-4 h-4 text-primary" /> Active Treatment Plan
              </h3>
              
              <div className="space-y-4 relative before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/20">
                {encounters.length === 0 ? (
                  <p className="text-xs text-on-surface-variant/75 italic py-2 pl-2">No encounter history</p>
                ) : (
                  encounters.slice(0, 3).map((e, idx) => {
                    const isCompleted = e.status === "Completed";
                    const isInProgress = e.status === "In Progress";
                    const isCancelled = e.status === "Cancelled";

                    return (
                      <div key={e.id || idx} className="relative pl-7">
                        {isCompleted ? (
                          <div className="absolute left-0 top-0.5 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-white shadow-sm text-white shrink-0">
                            <Check className="w-3 h-3 stroke-[3px]" />
                          </div>
                        ) : isInProgress ? (
                          <div className="absolute left-0 top-0.5 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-4 border-white shadow-sm text-white shrink-0 animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                        ) : isCancelled ? (
                          <div className="absolute left-0 top-0.5 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-4 border-white shadow-sm text-white shrink-0">
                            <XCircle className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="absolute left-0 top-0.5 w-6 h-6 bg-white rounded-full flex items-center justify-center border-4 border-outline-variant/20 shadow-sm"></div>
                        )}
                        
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-on-surface">{e.chiefComplaint || "Consultation"}</span>
                          <span className="text-[10px] text-on-surface-variant">{e.visitDate}</span>
                        </div>
                        {e.treatments && e.treatments.length > 0 && (
                          <p className="text-[10px] text-primary leading-normal line-clamp-1 font-semibold">
                            {e.treatments.join(", ")}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Row 3: Appointments List & Invoices Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Appointment History (Real from database) */}
            <div className="bg-white rounded-xl p-5 border border-outline-variant/15 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5 border-b border-outline-variant/10 pb-2">
                <Calendar className="w-4 h-4 text-primary" /> Appointment History
              </h3>

              {showSkeleton ? (
                <div className="space-y-2 py-4">
                  <div className="h-8 bg-surface-container animate-pulse rounded"></div>
                  <div className="h-8 bg-surface-container animate-pulse rounded"></div>
                </div>
              ) : appointments.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-outline-variant/30 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-on-surface-variant/40 mx-auto mb-2" />
                  <p className="text-xs text-on-surface-variant font-medium">
                    No appointments registered for this patient
                  </p>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto divide-y divide-outline-variant/10 pr-1">
                  {appointments.slice(0, 5).map((apt) => (
                    <div
                      key={apt.id}
                      className="py-2.5 flex items-center justify-between gap-2 hover:bg-surface-container-lowest transition-colors first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="text-xs font-bold text-on-surface">{apt.service}</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">
                          {apt.date} at {apt.time}
                        </p>
                      </div>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          statusStyles[apt.status] || statusStyles.Pending
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Invoices List */}
            <div className="bg-white rounded-xl p-5 border border-outline-variant/15 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5 border-b border-outline-variant/10 pb-2">
                <CreditCard className="w-4 h-4 text-primary" /> Billing Invoices
              </h3>
              
              <div className="max-h-48 overflow-y-auto divide-y divide-outline-variant/10 pr-1">
                {invoicesList.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-xs text-on-surface-variant italic">No invoices issued</p>
                  </div>
                ) : (
                  invoicesList.map((inv) => {
                    const isPaid = inv.paymentStatus === "Paid";
                    const isPending = inv.paymentStatus === "Pending";
                    return (
                      <div key={inv.id} className="py-2.5 flex items-center justify-between gap-2 first:pt-0 last:pb-0">
                        <div>
                          <p className="text-xs font-bold text-on-surface">
                            {inv.encounterId ? "Visit Encounter Treatment" : "General Consultation"}
                          </p>
                          <p className="text-[10px] text-on-surface-variant mt-0.5">
                            {inv.invoiceDate} · <span className="font-bold">${inv.amount.toFixed(2)}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isPaid
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isPending
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}>
                            {inv.paymentStatus}
                          </span>
                          <button
                            onClick={() => alert(`Downloading PDF for invoice #${inv.id.slice(0, 8)}`)}
                            className="p-1 rounded bg-surface hover:bg-surface-container border border-outline-variant/20 text-on-surface-variant cursor-pointer flex items-center justify-center shrink-0"
                            title="Download PDF"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-outline-variant/10 bg-surface-container-lowest flex items-center justify-end gap-2.5">
          <Link
            href={`/admin/patients/${patient.id}`}
            onClick={onClose}
            className="px-4 py-2 border border-outline-variant/40 hover:bg-surface-container-low text-on-surface font-semibold rounded-lg text-sm transition-colors cursor-pointer animate-pulse"
          >
            Open Doctor Clinical Workspace
          </Link>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg text-sm transition-colors active:scale-[0.99] cursor-pointer"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
}
