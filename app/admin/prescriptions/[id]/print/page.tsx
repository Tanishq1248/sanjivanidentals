"use client";

import React, { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, Stethoscope } from "lucide-react";
import { getPrescriptionById } from "../../../../../lib/services/prescriptionService";
import { getPatientById } from "../../../../../lib/services/patientService";
import { getAppointmentById } from "../../../../../lib/services/appointmentService";
import { getClinicInfo } from "../../../../../lib/services/settingsService";
import { queryKeys } from "../../../../../lib/query/queryKeys";
import type { Patient, Appointment, Prescription, ClinicBasicInfo } from "../../../../../lib/types";

type PrintPageProps = {
  params: Promise<{ id: string }>;
};

export default function PrescriptionPrintPage({ params }: PrintPageProps) {
  const router = useRouter();
  const { id } = use(params);

  // Prescription Query
  const {
    data: prescription,
    isLoading: isPrescriptionLoading,
    isError: isPrescriptionError,
  } = useQuery<Prescription | null>({
    queryKey: queryKeys.prescriptions.byId(id),
    queryFn: () => getPrescriptionById(id),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  // Patient Query
  const {
    data: patient,
    isLoading: isPatientLoading,
  } = useQuery<Patient | null>({
    queryKey: queryKeys.patients.byId(prescription?.patientId ?? ""),
    queryFn: () => getPatientById(prescription!.patientId),
    enabled: !!prescription?.patientId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Appointment Query
  const {
    data: appointment,
    isLoading: isAppointmentLoading,
  } = useQuery<Appointment | null>({
    queryKey: queryKeys.appointments.byId(prescription?.appointmentId ?? ""),
    queryFn: () => getAppointmentById(prescription!.appointmentId!),
    enabled: !!prescription?.appointmentId,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Clinic Info Query
  const { data: clinicInfo } = useQuery<ClinicBasicInfo>({
    queryKey: queryKeys.settings.clinicInfo,
    queryFn: getClinicInfo,
    staleTime: 10 * 60 * 1000,
  });

  const isLoading =
    isPrescriptionLoading ||
    (!!prescription?.patientId && isPatientLoading) ||
    (!!prescription?.appointmentId && isAppointmentLoading);

  const hasError = isPrescriptionError || (!isPrescriptionLoading && !prescription);

  useEffect(() => {
    if (!isLoading && prescription) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isLoading, prescription]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Preparing prescription print document...</p>
        </div>
      </div>
    );
  }

  if (hasError || !prescription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4 font-sans">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Print Job Failed</h2>
          <p className="text-sm text-gray-500 mt-1">Prescription record not found.</p>
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

  const printDate = new Date(prescription.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const instructionsList = prescription.additionalInstructions
    ? prescription.additionalInstructions.split("\n").filter((line) => line.trim() !== "")
    : [
        "Take medicines strictly after food unless specified otherwise.",
        "Complete the full course of antibiotics prescribed.",
        "Rinse mouth with lukewarm saline water 3-4 times daily.",
        "Avoid very hot, cold, or hard food items during recovery.",
      ];

  return (
    <div className="bg-white min-h-screen text-gray-800 font-sans print:p-0">
      {/* ─── SINGLE A4 PRESCRIPTION SHEET FOR PRINT ─── */}
      <div className="w-[210mm] min-h-[297mm] bg-white relative p-8 md:p-10 flex flex-col justify-between mx-auto print:m-0 print:p-6 print:w-full print:min-h-0">
        
        {/* TOP ACCENT LINE */}
        <div className="h-1.5 bg-primary rounded-t-xl -mt-8 -mx-8 md:-mt-10 md:-mx-10 mb-6 print:-mt-6 print:-mx-6 print:rounded-none" />

        <div className="flex-1 space-y-6">
          {/* HEADER: Clinic Details & Lead Doctor */}
          <div className="border-b-2 border-primary/20 pb-4 flex flex-row justify-between items-center gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold shrink-0 mt-0.5">
                <Stethoscope className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight leading-tight">
                  {clinicInfo?.clinicName || "Sanjivani Dental Clinic"}
                </h1>
                <p className="text-xs text-gray-600 font-medium mt-0.5">
                  {clinicInfo?.addressLine1
                    ? `${clinicInfo.addressLine1}${clinicInfo.addressLine2 ? `, ${clinicInfo.addressLine2}` : ""}, ${clinicInfo.city}, ${clinicInfo.state} ${clinicInfo.pincode}`
                    : "Suite 402, Medical Enclave, M.G. Road, Pune, MH 411001"}
                </p>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                  Ph: {clinicInfo?.phone || "+91 98765 43210"} | Email: {clinicInfo?.email || "contact@sanjivanidentals.com"}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <h2 className="text-base font-extrabold text-gray-900 leading-tight">
                {clinicInfo?.doctorName || "Dr. Rajesh Sharma"}
              </h2>
              <p className="text-xs text-primary font-bold">
                {clinicInfo?.qualification || "BDS, MDS (Oral & Maxillofacial Surgery)"}
              </p>
              <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                Reg. No: {clinicInfo?.registrationNumber || "MH-D-18492"}
              </p>
            </div>
          </div>

          {/* PATIENT METADATA BAR */}
          <div className="bg-slate-50 rounded-xl border border-gray-200 p-3.5 grid grid-cols-4 gap-3 text-xs font-medium text-gray-800">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 block">Patient Name</span>
              <span className="font-bold text-gray-900 text-sm">{prescription.patientName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 block">Age / Phone</span>
              <span className="font-semibold text-gray-800">
                {prescription.patientAge ? `${prescription.patientAge} yrs` : "N/A"} • {prescription.patientPhone}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 block">Date</span>
              <span className="font-semibold text-gray-800">{printDate}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 block">Prescription No.</span>
              <span className="font-bold text-primary font-mono">{prescription.prescriptionNumber}</span>
            </div>
          </div>

          {/* DIAGNOSIS BANNER */}
          <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-100 flex items-center justify-between">
            <div className="text-xs">
              <span className="font-extrabold text-teal-800 uppercase tracking-wider text-[10px] mr-2">Clinical Diagnosis:</span>
              <span className="font-bold text-gray-900">{prescription.diagnosis || "General Consultation"}</span>
            </div>
          </div>

          {/* MEDICATIONS TABLE WITH ℞ SYMBOL */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
              <span className="text-3xl font-serif text-primary font-black italic select-none leading-none">℞</span>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Prescribed Medications</h3>
            </div>

            <table className="w-full text-xs border-collapse border border-gray-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-100/80 border-b border-gray-200 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                  <th className="p-2.5 text-center w-10 border-r border-gray-200">#</th>
                  <th className="p-2.5 text-left border-r border-gray-200">Medicine &amp; Dosage</th>
                  <th className="p-2.5 text-left border-r border-gray-200">Frequency / Timing</th>
                  <th className="p-2.5 text-center w-28">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium">
                {prescription.medications && prescription.medications.length > 0 ? (
                  prescription.medications.map((med, i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="p-2.5 text-center font-bold text-gray-400 border-r border-gray-200">{i + 1}</td>
                      <td className="p-2.5 border-r border-gray-200">
                        <p className="font-bold text-gray-900 text-xs">{med.medicine}</p>
                        <p className="text-[11px] text-gray-500">{med.dosage}</p>
                      </td>
                      <td className="p-2.5 border-r border-gray-200 font-medium text-gray-800">{med.frequency}</td>
                      <td className="p-2.5 text-center font-bold text-primary">{med.duration}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-gray-400 italic">No medications prescribed.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ADVICE & INSTRUCTIONS */}
          {instructionsList.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-1">
                Advice &amp; Special Precautions
              </h4>
              <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1 leading-relaxed">
                {instructionsList.map((inst, i) => (
                  <li key={i}>{inst}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* FOOTER & SIGNATURE AREA */}
        <div className="pt-6 mt-8 border-t border-gray-200 flex flex-row items-center justify-between gap-6">
          <div className="text-[10px] text-gray-500 space-y-0.5 max-w-sm">
            <p className="font-bold text-gray-700">
              {clinicInfo?.prescriptionFooterText || "Take medicines strictly as prescribed. For emergency assistance call clinic helpline."}
            </p>
            <p>Printed: {printDate} • System Generated Digital Prescription Pad</p>
          </div>

          <div className="text-right shrink-0">
            <div className="w-36 h-12 ml-auto flex items-end justify-center pb-1 text-gray-700 font-serif italic text-base font-bold border-b border-gray-400">
              {clinicInfo?.doctorName || "Dr. Rajesh Sharma"}
            </div>
            <p className="text-xs font-bold text-gray-900 mt-1">Authorized Doctor Signature</p>
            <p className="text-[10px] text-gray-400 font-medium">Clinic Stamp</p>
          </div>
        </div>
      </div>

      {/* CSS Styles for exact A4 print rendering */}
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
        }
      `}</style>
    </div>
  );
}
