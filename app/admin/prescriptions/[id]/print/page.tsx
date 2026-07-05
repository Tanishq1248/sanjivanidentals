"use client";

import React, { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { getPrescriptionById } from "../../../../../lib/services/prescriptionService";
import { getPatientById } from "../../../../../lib/services/patientService";
import { getAppointmentById } from "../../../../../lib/services/appointmentService";
import { queryKeys } from "../../../../../lib/query/queryKeys";
import type { Patient, Appointment, Prescription } from "../../../../../lib/types";

type PrintPageProps = {
  params: Promise<{ id: string }>;
};

export default function PrescriptionPrintPage({ params }: PrintPageProps) {
  const router = useRouter();
  const { id } = use(params);

  // ── Query 1: Prescription ────────────────────────────────────────────────
  const {
    data: prescription,
    isLoading: isPrescriptionLoading,
    isError: isPrescriptionError,
  } = useQuery<Prescription | null>({
    queryKey: queryKeys.prescriptions.byId(id),
    queryFn: () => getPrescriptionById(id),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    retry: 1,
  });

  // ── Query 2: Patient (dependent on prescription) ────────────────────────
  const {
    data: patient,
    isLoading: isPatientLoading,
  } = useQuery<Patient | null>({
    queryKey: queryKeys.patients.byId(prescription?.patientId ?? ""),
    queryFn: () => getPatientById(prescription!.patientId),
    enabled: !!prescription?.patientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });

  // ── Query 3: Appointment (dependent on prescription) ────────────────────
  const {
    data: appointment,
    isLoading: isAppointmentLoading,
  } = useQuery<Appointment | null>({
    queryKey: queryKeys.appointments.byId(prescription?.appointmentId ?? ""),
    queryFn: () => getAppointmentById(prescription!.appointmentId),
    enabled: !!prescription?.appointmentId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,    // 5 minutes
  });

  // Derive status states
  const isLoading =
    isPrescriptionLoading ||
    (!!prescription?.patientId && isPatientLoading) ||
    (!!prescription?.appointmentId && isAppointmentLoading);

  const hasError = isPrescriptionError || (!isPrescriptionLoading && !prescription);

  // Trigger print dialog once data is loaded and components are rendered
  useEffect(() => {
    if (!isLoading && prescription && patient) {
      const timer = setTimeout(() => {
        window.print();
      }, 800); // Small delay to ensure images/fonts and layout render fully
      return () => clearTimeout(timer);
    }
  }, [isLoading, prescription, patient]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#00bcd4] animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Preparing print document...</p>
        </div>
      </div>
    );
  }

  if (hasError || !prescription || !patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Print Job Failed</h2>
          <p className="text-sm text-gray-500 mt-1">{"Prescription not found or missing records."}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const printDate = new Date(prescription.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate next appointment date (defaults to 7 days after current date if not set)
  const nextApptDate = appointment
    ? new Date(new Date(appointment.date).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  // Default instructions fallback if none exist
  const instructionsList = prescription.additionalInstructions
    ? prescription.additionalInstructions.split("\n").filter((line) => line.trim() !== "")
    : [
        "Complete the full course of antibiotics even if you feel better before finishing them.",
        "Do not consume alcohol while taking antibiotics.",
        "Use a soft-bristled toothbrush to avoid irritation of gums.",
        "Rinse with antiseptic mouthwash twice daily.",
      ];

  return (
    <div className="bg-white min-h-screen text-gray-800 font-sans print:p-0">
      
      {/* ─── PAGE 1 ─── */}
      <div className="w-[210mm] min-h-[296mm] bg-white relative p-[20mm] flex flex-col justify-between mx-auto page-break shadow-sm print:shadow-none print:mx-0">
        
        {/* Decorative Top Curves */}
        <div className="absolute top-0 left-0 w-full h-[180px] pointer-events-none overflow-hidden select-none">
          {/* Top Left Circle Arc */}
          <svg className="absolute top-0 left-0 text-[#00bcd4]" width="180" height="150" viewBox="0 0 180 150" fill="none">
            <path d="M-50 -50 C60 -50, 100 40, 40 120 C10 160, -50 120, -50 120 Z" fill="currentColor" opacity="0.15" />
            <path d="M-60 -60 C40 -60, 60 20, 10 90 C-10 120, -60 90, -60 90 Z" fill="currentColor" />
          </svg>

          {/* Top Right Curved Banner */}
          <svg className="absolute top-0 right-0 text-[#00a8cc]" width="380" height="180" viewBox="0 0 380 180" fill="none">
            <path d="M120 0 C180 110, 240 140, 380 140 L 380 0 Z" fill="currentColor" />
            <path d="M80 0 C150 130, 220 160, 380 160 L 380 0 Z" fill="currentColor" opacity="0.1" />
          </svg>

          {/* Top Right Address Details Overlay */}
          <div className="absolute top-6 right-6 text-right text-white text-xs font-medium space-y-0.5 leading-tight z-10">
            <p>Raleigh, NC 27601</p>
            <p>inquire@smilecrest.mail</p>
            <p>template.net</p>
            <p>222 555 777</p>
          </div>
        </div>

        {/* Brand Header */}
        <div className="mt-16 flex items-center gap-2.5 z-10 relative">
          <div className="w-10 h-10 rounded-full border-2 border-[#00bcd4] flex items-center justify-center text-[#00bcd4]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>
          <span className="font-bold text-lg text-[#00bcd4] tracking-wide">SmileCrest Dental Clinic</span>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 mt-10 space-y-8">
          
          {/* Document Title */}
          <h1 className="text-2xl font-bold text-center text-gray-900 border-b-2 border-gray-100 pb-3 uppercase tracking-wide">
            Dental Clinic Prescription
          </h1>

          {/* Doctor & Prescription Meta */}
          <div className="space-y-1.5 text-sm">
            <h2 className="text-xl font-bold text-gray-900">Dr. Julian Moore</h2>
            <div className="space-y-0.5 font-medium text-gray-600">
              <p><span className="text-gray-900 font-semibold">Date:</span> {printDate}</p>
              <p><span className="text-gray-900 font-semibold">Prescription No.:</span> {prescription.prescriptionNumber}</p>
            </div>
          </div>

          {/* Section II: Prescription Details Table */}
          <div className="space-y-2.5">
            <h3 className="text-base font-bold text-gray-950 tracking-wide">Prescription Details</h3>
            <table className="w-full text-sm border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-1/3 text-left p-3 font-bold text-gray-700 border-r border-gray-200">Field</th>
                  <th className="text-left p-3 font-bold text-gray-700">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="p-3 font-semibold text-gray-800 border-r border-gray-200">Diagnosis</td>
                  <td className="p-3 text-gray-700">{prescription.diagnosis || "General Consult"}</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-gray-800 border-r border-gray-200">Duration</td>
                  <td className="p-3 text-gray-700">
                    {prescription.medications?.[0]?.duration || "7 Days"}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-gray-800 border-r border-gray-200">Next Appointment</td>
                  <td className="p-3 text-gray-700">{nextApptDate}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section III: Medications Table */}
          <div className="space-y-2.5">
            <h3 className="text-base font-bold text-gray-950 tracking-wide">III. Medications</h3>
            <table className="w-full text-sm border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left p-3 font-bold text-gray-700 border-r border-gray-200">Medication</th>
                  <th className="text-left p-3 font-bold text-gray-700 border-r border-gray-200">Dosage</th>
                  <th className="text-left p-3 font-bold text-gray-700 border-r border-gray-200">Frequency</th>
                  <th className="text-left p-3 font-bold text-gray-700">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {prescription.medications.length > 0 ? (
                  prescription.medications.map((med, i) => (
                    <tr key={i}>
                      <td className="p-3 font-medium text-gray-800 border-r border-gray-200">{med.medicine}</td>
                      <td className="p-3 text-gray-700 border-r border-gray-200">{med.dosage}</td>
                      <td className="p-3 text-gray-700 border-r border-gray-200">{med.frequency}</td>
                      <td className="p-3 text-gray-700">{med.duration}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-gray-500 italic">No medications prescribed.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Section IV: Additional Instructions */}
          <div className="space-y-2.5">
            <h3 className="text-base font-bold text-gray-950 tracking-wide">Additional Instructions</h3>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1.5 leading-relaxed">
              {instructionsList.map((inst, i) => (
                <li key={i}>{inst}</li>
              ))}
            </ul>
          </div>

        </div>

        {/* Footer Page Number */}
        <div className="flex justify-end text-xs font-bold text-gray-500 pt-6">
          01
        </div>
      </div>

      {/* ─── PAGE 2 ─── */}
      <div className="w-[210mm] min-h-[296mm] bg-white relative p-[20mm] flex flex-col justify-between mx-auto shadow-sm print:shadow-none print:mx-0">
        
        {/* Main Content Area */}
        <div className="flex-1 mt-10 space-y-6">
          <h2 className="text-lg font-bold text-gray-950 tracking-wide border-b border-gray-100 pb-2">Signature</h2>
          <div className="space-y-4 pt-4">
            <p className="text-sm font-semibold text-gray-700">Signature:</p>
            <div className="pl-6 py-2">
              <span className="font-serif italic text-2xl text-gray-800 tracking-wider select-none font-semibold">
                Signature
              </span>
            </div>
            <p className="text-sm text-gray-600 font-medium">
              <span className="text-gray-800 font-semibold">Date:</span> {printDate}
            </p>
          </div>
        </div>

        {/* Footer Page Number */}
        <div className="flex justify-end text-xs font-bold text-gray-500 pt-6">
          02
        </div>
      </div>

      {/* CSS Styles for exact A4 print rendering */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
            color: black;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
          /* Hide browser print headers/footers */
          @page {
            size: A4 portrait;
            margin: 0;
          }
          div {
            box-shadow: none !important;
          }
        }
      `}</style>

    </div>
  );
}
