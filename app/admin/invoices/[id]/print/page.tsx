"use client";

import React, { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, Printer } from "lucide-react";
import { getInvoiceById } from "../../../../../lib/services/invoiceService";
import { getPatientById } from "../../../../../lib/services/patientService";
import { queryKeys } from "../../../../../lib/query/queryKeys";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../../lib/firebase";
import { COLLECTIONS } from "../../../../../lib/services/firestoreConfig";
import type { Patient, Invoice } from "../../../../../lib/types";

type PrintPageProps = {
  params: Promise<{ id: string }>;
};

function formatINR(amount: any): string {
  const val = Number(amount || 0);
  const hasPaise = val % 1 !== 0;
  return val.toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

async function getClinicSettings() {
  const docRef = doc(db, COLLECTIONS.CLINIC_SETTINGS, "config");
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data();
}

export default function InvoicePrintPage({ params }: PrintPageProps) {
  const router = useRouter();
  const { id } = use(params);

  // ── Query 1: Invoice ───────────────────────────────────────────────────
  const {
    data: invoice,
    isLoading: isInvoiceLoading,
    isError: isInvoiceError,
  } = useQuery<Invoice | null>({
    queryKey: queryKeys.invoices.byId(id),
    queryFn: () => getInvoiceById(id),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // ── Query 2: Patient (dependent on invoice) ───────────────────────────
  const {
    data: patient,
    isLoading: isPatientLoading,
  } = useQuery<Patient | null>({
    queryKey: queryKeys.patients.byId(invoice?.patientId ?? ""),
    queryFn: () => getPatientById(invoice!.patientId),
    enabled: !!invoice?.patientId,
    staleTime: 5 * 60 * 1000,
  });

  // ── Query 3: Clinic Settings ──────────────────────────────────────────
  const {
    data: clinicSettings,
    isLoading: isSettingsLoading,
  } = useQuery({
    queryKey: ["clinicSettings", "config"],
    queryFn: getClinicSettings,
    staleTime: 10 * 60 * 1000,
  });

  // Derive loading and error states
  const isLoading =
    isInvoiceLoading ||
    (!!invoice?.patientId && isPatientLoading) ||
    isSettingsLoading;

  const hasError = isInvoiceError || (!isInvoiceLoading && !invoice);

  // Trigger print dialog once loaded
  useEffect(() => {
    if (!isLoading && invoice && patient) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isLoading, invoice, patient]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Preparing print document...</p>
        </div>
      </div>
    );
  }

  if (hasError || !invoice || !patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Print Job Failed</h2>
          <p className="text-sm text-gray-500 mt-1">Invoice not found or missing records.</p>
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

  // Clinic details fallbacks
  const clinicName = clinicSettings?.clinicName || "Sanjivani Dentals";
  const clinicPhone = clinicSettings?.phone || "+91 77750 89777";
  const clinicAddress = clinicSettings?.address || "123 Dental Excellence Way, Medical District";

  const printDate = new Date(invoice.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const formattedVisitDate = invoice.visitDate ? new Date(invoice.visitDate + "T00:00:00").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }) : "—";

  return (
    <div className="bg-white min-h-screen text-gray-800 font-sans print:p-0">
      
      {/* Print Float Trigger Button */}
      <div className="max-w-[210mm] mx-auto mb-4 px-4 pt-4 flex justify-between items-center print:hidden">
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice PDF</span>
          <h1 className="text-sm font-bold text-gray-700">Billing Statement</h1>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-primary text-white rounded-lg shadow-sm cursor-pointer transition-colors hover:bg-primary/95"
        >
          <Printer className="w-3.5 h-3.5" /> Print / Save PDF
        </button>
      </div>

      {/* ─── A4 PAGE ─── */}
      <div className="w-[210mm] min-h-[296mm] bg-white relative p-[20mm] flex flex-col justify-between mx-auto shadow-sm print:shadow-none print:mx-0">
        
        {/* Decorative Top Banner */}
        <div className="absolute top-0 left-0 w-full h-[180px] pointer-events-none overflow-hidden select-none">
          <svg className="absolute top-0 left-0 text-primary/10" width="180" height="150" viewBox="0 0 180 150" fill="none">
            <path d="M-50 -50 C60 -50, 100 40, 40 120 C10 160, -50 120, -50 120 Z" fill="currentColor" opacity="0.4" />
            <path d="M-60 -60 C40 -60, 60 20, 10 90 C-10 120, -60 90, -60 90 Z" fill="currentColor" className="text-primary" />
          </svg>

          <svg className="absolute top-0 right-0 text-primary/20" width="380" height="180" viewBox="0 0 380 180" fill="none">
            <path d="M120 0 C180 110, 240 140, 380 140 L 380 0 Z" fill="currentColor" className="text-primary" />
            <path d="M80 0 C150 130, 220 160, 380 160 L 380 0 Z" fill="currentColor" opacity="0.1" />
          </svg>

          {/* Clinic Address Overlay */}
          <div className="absolute top-6 right-6 text-right text-white text-xs font-medium space-y-0.5 leading-tight z-10">
            <p>{clinicAddress}</p>
            <p>{clinicPhone}</p>
            <p>support@sanjivanidentals.com</p>
          </div>
        </div>

        {/* Brand Header */}
        <div className="mt-16 flex items-center gap-2.5 z-10 relative">
          <div className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center text-primary bg-white">
            <span className="font-bold text-xl leading-none">S</span>
          </div>
          <span className="font-bold text-lg text-primary tracking-wide">{clinicName}</span>
        </div>

        {/* Document Content */}
        <div className="flex-1 mt-10 space-y-6">
          <h1 className="text-2xl font-bold text-center text-gray-900 border-b-2 border-gray-100 pb-3 uppercase tracking-wide">
            Tax Invoice / Bill Statement
          </h1>

          {/* Invoice Metadata Grid */}
          <div className="grid grid-cols-2 gap-6 text-sm border border-gray-200/60 rounded-xl p-4 bg-gray-50/50">
            <div className="space-y-1.5">
              <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wider">Patient Details</h3>
              <p className="text-gray-800"><span className="font-semibold">Name:</span> {patient.name}</p>
              <p className="text-gray-600"><span className="font-semibold text-gray-800">Phone:</span> {patient.phone}</p>
              {patient.email && <p className="text-gray-600"><span className="font-semibold text-gray-800">Email:</span> {patient.email}</p>}
              <p className="text-gray-600"><span className="font-semibold text-gray-800">Patient ID:</span> {patient.id.slice(0, 8).toUpperCase()}</p>
            </div>

            <div className="space-y-1.5 text-right md:text-left">
              <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wider text-right">Invoice Metadata</h3>
              <p className="text-gray-800 text-right"><span className="font-semibold">Invoice No:</span> #{invoice.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-gray-600 text-right"><span className="font-semibold text-gray-800">Invoice Date:</span> {printDate}</p>
              <p className="text-gray-600 text-right"><span className="font-semibold text-gray-800">Visit Date:</span> {formattedVisitDate}</p>
              <div className="flex justify-end gap-1.5 mt-1">
                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                  (invoice.status || invoice.paymentStatus) === "Paid"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {invoice.status || invoice.paymentStatus}
                </span>
                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold border bg-gray-50 text-gray-700 border-gray-200">
                  {invoice.paymentMethod === "None" ? "Unpaid" : invoice.paymentMethod}
                </span>
              </div>
            </div>
          </div>

          {/* Table of selected treatments */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-bold text-gray-950 tracking-wide uppercase">Billed Items</h3>
            <table className="w-full text-sm border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-20 text-center p-2.5 font-bold text-gray-700 border-r border-gray-200">Tooth</th>
                  <th className="text-left p-2.5 font-bold text-gray-700 border-r border-gray-200">Treatment Description</th>
                  <th className="w-32 text-right p-2.5 font-bold text-gray-700">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="p-2.5 text-center font-medium text-gray-800 border-r border-gray-200">
                        {item.toothNumber !== undefined ? item.toothNumber : "—"}
                      </td>
                      <td className="p-2.5 text-gray-800 border-r border-gray-200">
                        {item.treatmentName}
                      </td>
                      <td className="p-2.5 text-right font-mono text-gray-800">
                        ₹{formatINR(item.fee)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-2.5 text-center font-medium text-gray-800 border-r border-gray-200">—</td>
                    <td className="p-2.5 text-gray-800 border-r border-gray-200">General Dental Procedures</td>
                    <td className="p-2.5 text-right font-mono text-gray-800">
                      ₹{formatINR(invoice.subtotal || invoice.grossAmount || invoice.amount)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pricing Totals Section */}
          <div className="flex justify-end pt-4">
            {(() => {
              const subtotal = invoice.subtotal !== undefined ? invoice.subtotal : (invoice.grossAmount || 0);
              const discount = invoice.discount !== undefined ? invoice.discount : (invoice.discountAmount || 0);
              const tax = invoice.tax !== undefined ? invoice.tax : (invoice.taxAmount || 0);
              const total = invoice.total !== undefined ? invoice.total : (invoice.netAmount || invoice.amount || 0);
              return (
                <div className="w-80 space-y-2 text-sm border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Subtotal / Gross:</span>
                    <span className="font-mono text-gray-800">₹{formatINR(subtotal)}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-gray-600 font-medium">
                      <span>Discount{invoice.discountPercentage ? ` (${invoice.discountPercentage}%)` : ""}:</span>
                      <span className="font-mono text-red-600">-₹{formatINR(discount)}</span>
                    </div>
                  )}

                  {tax > 0 && (
                    <div className="flex justify-between text-gray-600 font-medium">
                      <span>Tax (18%):</span>
                      <span className="font-mono text-gray-800">₹{formatINR(tax)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-900 font-bold border-t border-gray-200/80 pt-2 text-base">
                    <span>Grand Total:</span>
                    <span className="font-mono text-primary">₹{formatINR(total)}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Footer and Signatures */}
        <div className="border-t border-gray-100 pt-6">
          <div className="flex justify-between items-end">
            <div className="space-y-1 text-[11px] text-gray-500 font-medium">
              <p>Thank you for choosing Sanjivani Dentals.</p>
              <p>This is a computer-generated invoice and requires no physical signature.</p>
              {invoice.emailSent && invoice.emailSentAt && (
                <p className="text-emerald-600 font-semibold">Sent to Patient Email on {new Date(invoice.emailSentAt.seconds * 1000).toLocaleString("en-IN")}</p>
              )}
            </div>

            <div className="text-center w-48 space-y-4">
              <div className="border-b border-gray-200/60 pb-1.5">
                <span className="font-serif italic text-lg text-gray-700 font-semibold select-none">
                  Sanjivani Dentals
                </span>
              </div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Authorized Signatory</p>
            </div>
          </div>

          <div className="flex justify-end text-[10px] font-bold text-gray-400 pt-6">
            PAGE 1 OF 1
          </div>
        </div>
      </div>
    </div>
  );
}
