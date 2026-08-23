"use client";

import React, { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, Printer, Building2, CheckCircle2 } from "lucide-react";
import { getInvoiceById, getInvoiceStatusDetails } from "../../../../../lib/services/invoiceService";
import { getPatientById } from "../../../../../lib/services/patientService";
import { queryKeys, CACHE_POLICIES } from "../../../../../lib/query/queryKeys";
import {
  getClinicSettings,
  formatClinicAddress,
  getDoctorCredentials,
} from "../../../../../lib/services/clinicSettingsService";
import type { Patient, Invoice, ClinicSettingsData } from "../../../../../lib/types";

type PrintPageProps = {
  params: Promise<{ id: string }>;
};

function formatAmount(amount: any, currency = "₹"): string {
  const val = Number(amount || 0);
  const hasPaise = val % 1 !== 0;
  const numStr = val.toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${currency}${numStr}`;
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

  // ── Query 3: Clinic Settings (Single Source of Truth) ──────────────────
  const {
    data: clinicSettings,
    isLoading: isSettingsLoading,
  } = useQuery<ClinicSettingsData>({
    queryKey: queryKeys.settings.clinicInfo,
    queryFn: getClinicSettings,
    ...CACHE_POLICIES.STATIC_METADATA,
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
      <div className="min-h-screen flex items-center justify-center bg-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Preparing tax invoice print document...</p>
        </div>
      </div>
    );
  }

  if (hasError || !invoice || !patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4 font-sans">
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

  // Clinic details derived from centralized settings
  const clinicName = clinicSettings?.clinicName || "Sanjivani Dental Clinic";
  const clinicPhone = clinicSettings?.primaryPhone || clinicSettings?.phone || "+91 98765 43210";
  const clinicEmail = clinicSettings?.email || "contact@sanjivanidentals.com";
  const clinicAddress = formatClinicAddress(clinicSettings);
  const clinicGstin = clinicSettings?.gstin || clinicSettings?.gstNumber;
  const currencySymbol = clinicSettings?.currencySymbol || "₹";
  const invoiceFooter = clinicSettings?.invoiceFooterNote || clinicSettings?.invoiceFooterText || "Thank you for choosing Sanjivani Dentals. Wishing you good dental health!";
  const creds = getDoctorCredentials(clinicSettings);

  const statusDetails = getInvoiceStatusDetails(invoice);

  const printDate = new Date(invoice.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const formattedVisitDate = invoice.visitDate
    ? new Date(invoice.visitDate + (invoice.visitDate.includes("T") ? "" : "T00:00:00")).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <div className="bg-slate-100 min-h-screen text-gray-800 font-sans print:bg-white print:p-0">
      
      {/* Print Float Trigger Button */}
      <div className="max-w-[210mm] mx-auto mb-4 px-4 pt-4 flex justify-between items-center print:hidden">
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Official Invoice</span>
          <h1 className="text-sm font-bold text-gray-700">Billing Statement &amp; Receipt</h1>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-primary text-white rounded-xl shadow-sm cursor-pointer transition-colors hover:bg-primary/95"
        >
          <Printer className="w-3.5 h-3.5" /> Print / Save PDF
        </button>
      </div>

      {/* ─── A4 PAGE ─── */}
      <div className="w-[210mm] min-h-[296mm] bg-white relative p-10 flex flex-col justify-between mx-auto shadow-md border border-gray-200/80 rounded-2xl print:shadow-none print:border-none print:rounded-none print:m-0 print:p-8 print:w-full print:min-h-0">
        
        {/* Top Accent Bar */}
        <div className="h-2 bg-primary rounded-t-xl -mt-10 -mx-10 mb-6 print:-mt-8 print:-mx-8 print:rounded-none" />

        <div className="flex-1 space-y-6">
          {/* HEADER: Clinic Identity & Tax Credentials */}
          <div className="border-b-2 border-primary/20 pb-5 flex flex-row justify-between items-start gap-4">
            <div className="flex items-start gap-3.5">
              {clinicSettings?.logoUrl ? (
                <img
                  src={clinicSettings.logoUrl}
                  alt={clinicName}
                  className="w-14 h-14 rounded-xl object-contain border border-gray-200 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold shrink-0 mt-0.5">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight leading-tight">
                  {clinicName}
                </h1>
                <p className="text-xs text-gray-600 font-medium mt-0.5 max-w-sm">
                  {clinicAddress}
                </p>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                  Ph: {clinicPhone} | Email: {clinicEmail}
                </p>
                {clinicGstin && (
                  <p className="text-[11px] font-bold text-primary mt-0.5">
                    GSTIN / Tax ID: <span className="font-mono">{clinicGstin}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-extrabold uppercase tracking-widest text-primary block">
                TAX INVOICE
              </span>
              <p className="text-lg font-black font-mono text-gray-900 mt-0.5">
                #{invoice.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Date: {printDate}
              </p>
              <div className="mt-2 flex justify-end">
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${statusDetails.bgClass}`}>
                  {statusDetails.label}
                </span>
              </div>
            </div>
          </div>

          {/* PATIENT & INVOICE METADATA BAR */}
          <div className="bg-slate-50 rounded-xl border border-gray-200 p-3.5 grid grid-cols-4 gap-3 text-xs font-medium text-gray-800">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 block">Billed To</span>
              <span className="font-bold text-gray-900 text-sm block truncate">{patient.name}</span>
              <span className="text-[11px] text-gray-500">ID: {patient.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 block">Contact</span>
              <span className="font-semibold text-gray-800 block">{patient.phone}</span>
              {patient.email && <span className="text-[11px] text-gray-500 block truncate">{patient.email}</span>}
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 block">Visit Date</span>
              <span className="font-semibold text-gray-800">{formattedVisitDate}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 block">Payment Mode</span>
              <span className="font-bold text-gray-800">
                {invoice.paymentMethod === "None" || !invoice.paymentMethod ? "Pending" : invoice.paymentMethod}
              </span>
            </div>
          </div>

          {/* BILLED ITEMS TABLE */}
          <div className="space-y-3 pt-1">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-200 pb-1.5">
              Itemized Procedures &amp; Services
            </h3>

            <table className="w-full text-xs border-collapse border border-gray-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-100/80 border-b border-gray-200 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                  <th className="p-2.5 text-center w-12 border-r border-gray-200">#</th>
                  <th className="p-2.5 text-center w-16 border-r border-gray-200">Tooth</th>
                  <th className="p-2.5 text-left border-r border-gray-200">Treatment Description</th>
                  <th className="p-2.5 text-right w-32">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-gray-50/50">
                      <td className="p-2.5 text-center font-bold text-gray-400 border-r border-gray-200">{idx + 1}</td>
                      <td className="p-2.5 text-center font-bold text-primary border-r border-gray-200">
                        {item.toothNumber !== undefined ? item.toothNumber : "—"}
                      </td>
                      <td className="p-2.5 border-r border-gray-200">
                        <p className="font-bold text-gray-900 text-xs">{item.treatmentName}</p>
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-gray-900">
                        {formatAmount(item.fee, currencySymbol)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-2.5 text-center font-bold text-gray-400 border-r border-gray-200">1</td>
                    <td className="p-2.5 text-center text-gray-400 border-r border-gray-200">—</td>
                    <td className="p-2.5 border-r border-gray-200 font-bold text-gray-900">General Dental Procedures</td>
                    <td className="p-2.5 text-right font-mono font-bold text-gray-900">
                      {formatAmount(invoice.subtotal || invoice.grossAmount || invoice.amount, currencySymbol)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* TOTALS & BREAKDOWN */}
          <div className="flex justify-end pt-2">
            {(() => {
              const subtotal = invoice.subtotal !== undefined ? invoice.subtotal : (invoice.grossAmount || 0);
              const discount = invoice.discount !== undefined ? invoice.discount : (invoice.discountAmount || 0);
              const tax = invoice.tax !== undefined ? invoice.tax : (invoice.taxAmount || 0);
              const total = invoice.total !== undefined ? invoice.total : (invoice.netAmount || invoice.amount || 0);
              const paidAmount = invoice.paidAmount || 0;
              const balance = Math.max(0, total - paidAmount);

              return (
                <div className="w-80 space-y-2 text-xs border border-gray-200 rounded-xl p-3.5 bg-slate-50/70">
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Subtotal / Gross:</span>
                    <span className="font-mono text-gray-800 font-bold">{formatAmount(subtotal, currencySymbol)}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-gray-600 font-medium">
                      <span>Discount{invoice.discountPercentage ? ` (${invoice.discountPercentage}%)` : ""}:</span>
                      <span className="font-mono text-rose-600 font-bold">-{formatAmount(discount, currencySymbol)}</span>
                    </div>
                  )}

                  {tax > 0 && (
                    <div className="flex justify-between text-gray-600 font-medium">
                      <span>Tax / GST:</span>
                      <span className="font-mono text-gray-800 font-bold">+{formatAmount(tax, currencySymbol)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-900 font-black border-t border-gray-200 pt-2 text-sm">
                    <span>Grand Total:</span>
                    <span className="font-mono text-primary">{formatAmount(total, currencySymbol)}</span>
                  </div>
                  
                  {paidAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                      <span>Amount Paid:</span>
                      <span className="font-mono">{formatAmount(paidAmount, currencySymbol)}</span>
                    </div>
                  )}

                  {balance > 0 ? (
                    <div className="flex justify-between text-rose-700 font-extrabold border-t border-dashed border-gray-200 pt-1">
                      <span>Balance Outstanding:</span>
                      <span className="font-mono">{formatAmount(balance, currencySymbol)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-emerald-700 font-bold border-t border-dashed border-gray-200 pt-1">
                      <span>Payment Status:</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Fully Settled</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* FOOTER & AUTHORIZED SIGNATURE */}
        <div className="pt-6 mt-6 border-t border-gray-200 flex flex-row items-end justify-between gap-6">
          <div className="text-[10px] text-gray-500 space-y-1 max-w-sm">
            <p className="font-bold text-gray-700">{invoiceFooter}</p>
            <p>Printed: {printDate} • System Generated Official Tax Invoice</p>
            {invoice.emailSent && invoice.emailSentAt && (
              <p className="text-emerald-600 font-semibold">
                Sent to patient email on {new Date(invoice.emailSentAt.seconds * 1000).toLocaleDateString("en-IN")}
              </p>
            )}
          </div>

          <div className="text-right shrink-0">
            <div className="w-40 h-10 ml-auto flex items-end justify-center pb-1 text-gray-800 font-serif italic text-sm font-bold border-b border-gray-400">
              {creds.doctorName}
            </div>
            <p className="text-xs font-bold text-gray-900 mt-1">Authorized Signatory</p>
            <p className="text-[10px] text-gray-400 font-medium">{clinicName}</p>
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
