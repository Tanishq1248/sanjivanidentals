"use client";

import React, { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, Printer, Stethoscope, FileText, Phone, Mail, MapPin } from "lucide-react";
import { getPrescriptionById } from "../../../lib/services/prescriptionService";
import { getAppointmentById } from "../../../lib/services/appointmentService";
import { getClinicInfo, formatClinicAddress, getDoctorCredentials } from "../../../lib/services/clinicSettingsService";
import type { Appointment, Prescription, ClinicBasicInfo } from "../../../lib/types";
import { queryKeys } from "../../../lib/query/queryKeys";
import { PublicPrescriptionSkeleton, useDelayLoading } from "../../../components/ui/Skeletons";

type PublicPrescriptionPageProps = {
  params: Promise<{ id: string }>;
};

export default function PublicPrescriptionPage({ params }: PublicPrescriptionPageProps) {
  const { id } = use(params);

  // Prescription query
  const {
    data: prescription,
    isLoading: isPrescriptionLoading,
    isError: isPrescriptionError,
  } = useQuery<Prescription | null>({
    queryKey: queryKeys.prescriptions.byId(id),
    queryFn: () => getPrescriptionById(id),
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    retry: 1,
  });

  // Appointment query
  const {
    data: appointment,
    isLoading: isAppointmentLoading,
  } = useQuery<Appointment | null>({
    queryKey: queryKeys.appointments.byId(prescription?.appointmentId ?? ""),
    queryFn: () => getAppointmentById(prescription!.appointmentId!),
    enabled: !!prescription?.appointmentId,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });

  // Clinic Info query for authentic pad header
  const { data: clinicInfo } = useQuery<ClinicBasicInfo>({
    queryKey: queryKeys.settings.clinicInfo,
    queryFn: getClinicInfo,
    staleTime: 10 * 60 * 1000,
  });

  const isLoading = isPrescriptionLoading || (!!prescription?.appointmentId && isAppointmentLoading);
  const showSkeleton = useDelayLoading(isLoading, 300);
  const hasError = isPrescriptionError || (!isPrescriptionLoading && !prescription);

  const handlePrint = () => {
    window.print();
  };

  if (showSkeleton) {
    return <PublicPrescriptionSkeleton />;
  }

  if (hasError || !prescription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
        <div className="text-center max-w-sm bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Prescription Not Found</h2>
          <p className="text-xs text-gray-500 mt-1">The requested prescription record could not be loaded.</p>
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

  const creds = getDoctorCredentials(clinicInfo, prescription.doctorName);
  const formattedAddress = formatClinicAddress(clinicInfo);

  return (
    <div className="bg-slate-100 min-h-screen py-6 print:py-0 print:bg-white text-gray-800 font-sans">
      {/* Top Floating Action Bar */}
      <div className="max-w-[210mm] mx-auto mb-4 px-4 flex justify-between items-center print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-sm font-bold text-gray-800">Clinic Prescription Pad</h1>
            <p className="text-[11px] text-gray-500">Official Patient Care Record</p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-sm cursor-pointer transition-all active:scale-95"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      {/* ─── SINGLE A4 PRESCRIPTION SHEET ─── */}
      <div className="w-[210mm] min-h-[297mm] bg-white relative p-8 md:p-10 flex flex-col justify-between mx-auto shadow-md print:shadow-none print:m-0 print:p-6 print:w-full print:min-h-0 border border-gray-200/80 rounded-2xl print:rounded-none">
        
        {/* TOP ACCENT LINE */}
        <div className="h-1.5 bg-primary rounded-t-xl -mt-8 -mx-8 md:-mt-10 md:-mx-10 mb-6 print:-mt-6 print:-mx-6 print:rounded-none" />

        <div className="flex-1 space-y-6">
          {/* HEADER: Clinic Details & Lead Doctor */}
          <div className="border-b-2 border-primary/20 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-start gap-3">
              {clinicInfo?.logoUrl || clinicInfo?.clinicLogoUrl ? (
                <img
                  src={clinicInfo.logoUrl || clinicInfo.clinicLogoUrl}
                  alt={clinicInfo.clinicName}
                  className="w-12 h-12 rounded-xl object-contain border border-gray-200 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold shrink-0 mt-0.5">
                  <Stethoscope className="w-6 h-6 text-primary" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight leading-tight">
                  {clinicInfo?.clinicName || "Sanjivani Dental Clinic"}
                </h1>
                <p className="text-xs text-gray-600 font-medium mt-0.5">
                  {formattedAddress}
                </p>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                  Ph: {clinicInfo?.primaryPhone || clinicInfo?.phone || "+91 98765 43210"} | Email: {clinicInfo?.email || "contact@sanjivanidentals.com"}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right border-l-2 sm:border-l-0 border-primary/20 pl-3 sm:pl-0 shrink-0">
              <h2 className="text-base font-extrabold text-gray-900 leading-tight">
                {creds.doctorName}
              </h2>
              <p className="text-xs text-primary font-bold">
                {creds.qualification}
              </p>
              <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                Reg. No: {creds.registrationNumber}
              </p>
            </div>
          </div>

          {/* PATIENT METADATA BAR */}
          <div className="bg-slate-50 rounded-xl border border-gray-200 p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-medium text-gray-800">
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
                  <th className="p-2.5 text-left border-r border-gray-200">Frequency</th>
                  <th className="p-2.5 text-left border-r border-gray-200">Timing</th>
                  <th className="p-2.5 text-center w-24">Duration</th>
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
                        {med.notes && <p className="text-[10px] text-gray-400 italic font-normal">Note: {med.notes}</p>}
                      </td>
                      <td className="p-2.5 border-r border-gray-200 font-medium text-gray-800">{med.frequency || "—"}</td>
                      <td className="p-2.5 border-r border-gray-200 text-gray-700">{med.timing || "—"}</td>
                      <td className="p-2.5 text-center font-bold text-primary">{med.duration || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-400 italic">No medications prescribed.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ADVICE & SPECIAL INSTRUCTIONS */}
          {(prescription.advice || prescription.dietInstructions || prescription.oralHygieneInstructions || prescription.additionalInstructions) && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-1">
                Advice &amp; Special Precautions
              </h4>
              <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1 leading-relaxed">
                {prescription.advice && <li>{prescription.advice}</li>}
                {prescription.dietInstructions && <li>Diet: {prescription.dietInstructions}</li>}
                {prescription.oralHygieneInstructions && <li>Oral Hygiene: {prescription.oralHygieneInstructions}</li>}
                {prescription.additionalInstructions && <li>Note: {prescription.additionalInstructions}</li>}
              </ul>
            </div>
          )}

          {/* FOLLOW UP VISIT */}
          {prescription.followUpDate && (
            <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-xl text-xs text-blue-900 font-medium">
              <span className="font-bold">🗓️ Next Follow-Up Visit: </span>
              <span>{prescription.followUpDate} {prescription.followUpReason ? `(${prescription.followUpReason})` : ""}</span>
            </div>
          )}
        </div>

        {/* FOOTER & SIGNATURE AREA */}
        <div className="pt-6 mt-8 border-t border-gray-200 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-6">
          <div className="text-[10px] text-gray-500 space-y-0.5 max-w-sm">
            <p className="font-bold text-gray-700">
              {clinicInfo?.prescriptionFooterNote || clinicInfo?.prescriptionFooterText || "Take medicines strictly as prescribed. For emergency assistance call clinic helpline."}
            </p>
            <p>Printed: {printDate} • System Generated Digital Prescription Pad</p>
          </div>

          <div className="text-center sm:text-right shrink-0">
            <div className="w-36 h-12 mx-auto sm:ml-auto flex items-end justify-center pb-1 text-gray-700 font-serif italic text-base font-bold border-b border-gray-400">
              {creds.doctorName}
            </div>
            <p className="text-xs font-bold text-gray-900 mt-1">Authorized Doctor Signature</p>
            <p className="text-[10px] text-gray-400 font-medium">{clinicInfo?.clinicName || "Clinic Stamp"}</p>
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
