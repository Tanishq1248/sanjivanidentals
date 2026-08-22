"use client";

import React, { useState } from "react";
import {
  IndianRupee,
  Receipt,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Mail,
  Plus,
  FileSpreadsheet,
  Printer,
  FileText,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../../lib/query/queryKeys";
import { getClinicSettings } from "../../../../lib/services/clinicSettingsService";
import type { Invoice, PatientEncounter, Patient, ClinicSettingsData } from "../../../../lib/types";
import { sendWhatsAppMessage } from "../../../../lib/services/whatsappService";
import { DocumentStorageService } from "../../../../lib/services/documentStorageService";
import { sendInvoiceEmail } from "../../../../lib/services/emailService";

interface InvoicesPaymentsTabProps {
  invoices: Invoice[];
  encounters: PatientEncounter[];
  patient: Patient;
  onOpenBillingReview: (encounter?: PatientEncounter) => void;
}

function formatINR(amount: any): string {
  const val = Number(amount || 0);
  const hasPaise = val % 1 !== 0;
  return val.toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

function formatVisitDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr + (dateStr.includes("T") ? "" : "T00:00:00"));
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export const InvoicesPaymentsTab: React.FC<InvoicesPaymentsTabProps> = ({
  invoices,
  encounters,
  patient,
  onOpenBillingReview,
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [emailingId, setEmailingId] = useState<string | null>(null);
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const { data: clinicSettings } = useQuery<ClinicSettingsData>({
    queryKey: queryKeys.settings.clinicInfo,
    queryFn: getClinicSettings,
    staleTime: 10 * 60 * 1000,
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Financial metrics
  const totalBilled = invoices.reduce(
    (sum, inv) => sum + (inv.total || inv.amount || 0),
    0
  );

  const totalPaid = invoices.reduce((sum, inv) => {
    const history = inv.paymentHistory || [];
    if (history.length > 0) {
      return (
        sum +
        history.reduce(
          (s: number, pay: any) =>
            pay.paymentType !== "Generated" ? s + pay.amountReceived : s,
          0
        )
      );
    }
    return (
      sum +
      (inv.paymentStatus === "Paid" || inv.paymentStatus === "PAID"
        ? inv.total || inv.amount || 0
        : inv.paidAmount || 0)
    );
  }, 0);

  const outstanding = Math.max(0, totalBilled - totalPaid);

  // Overdue calculation
  const overdueInvoices = invoices.filter((inv) => {
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

  const overdueAmount = overdueInvoices.reduce(
    (sum, inv) =>
      sum +
      (inv.remainingAmount !== undefined
        ? inv.remainingAmount
        : (inv.total || inv.amount || 0) - (inv.paidAmount || 0)),
    0
  );

  // Combined payment history timeline
  const allPayments: Array<{
    date: string;
    amount: number;
    method: string;
    invoiceNo: string;
  }> = [];

  invoices.forEach((inv) => {
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

  allPayments.sort((a, b) => b.date.localeCompare(a.date));

  // Handler for downloading invoice PDF via DocumentStorageService
  const handleDownloadPdf = async (inv: Invoice) => {
    setDownloadingId(inv.id);
    try {
      const res = await DocumentStorageService.getOrEnsureInvoicePdf(inv.id, inv);
      if (res.downloadUrl) {
        window.open(res.downloadUrl, "_blank");
      } else {
        showToast("Generating PDF invoice...");
      }
    } catch (err: any) {
      showToast("PDF retrieval error: " + (err?.message || "Storage error"));
    } finally {
      setDownloadingId(null);
    }
  };

  // Handler for emailing invoice
  const handleEmailInvoice = async (inv: Invoice) => {
    if (!patient.email) {
      showToast("Patient does not have an email address on file.");
      return;
    }
    setEmailingId(inv.id);
    try {
      const res = await sendInvoiceEmail({
        invoiceId: inv.id,
        patientEmail: patient.email,
        patientName: patient.name,
      });
      if (res.success) {
        showToast("Invoice sent successfully to " + patient.email);
      } else {
        showToast(res.message || "Failed to send invoice email.");
      }
    } catch (err: any) {
      showToast("Email error: " + (err?.message || "Delivery failed"));
    } finally {
      setEmailingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── 1. Header Bar with Actions ── */}
      <div className="bg-white p-5 rounded-2xl border border-outline-variant/15 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-on-surface">
              Patient Billing & Collections Workspace
            </h2>
            <p className="text-xs text-on-surface-variant">
              Comprehensive invoices ledger, partial payment tracking, receipts, and digital delivery.
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenBillingReview(encounters.length > 0 ? encounters[0] : undefined)}
          className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Invoice</span>
        </button>
      </div>

      {/* ── 2. Financial Summary KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 bg-white border border-outline-variant/15 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Billed
          </span>
          <span className="font-black text-slate-900 text-xl sm:text-2xl font-mono block">
            ₹{formatINR(totalBilled)}
          </span>
        </div>

        <div className="p-4 sm:p-5 bg-emerald-50/60 border border-emerald-100 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
            Total Paid
          </span>
          <span className="font-black text-emerald-700 text-xl sm:text-2xl font-mono block">
            ₹{formatINR(totalPaid)}
          </span>
        </div>

        <div className="p-4 sm:p-5 bg-red-50/60 border border-red-100 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block">
            Outstanding Balance
          </span>
          <span className="font-black text-red-700 text-xl sm:text-2xl font-mono block">
            ₹{formatINR(outstanding)}
          </span>
        </div>

        <div className="p-4 sm:p-5 bg-amber-50/60 border border-amber-100 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
            Overdue Amount
          </span>
          <span className="font-black text-amber-700 text-xl sm:text-2xl font-mono block">
            ₹{formatINR(overdueAmount)}
          </span>
        </div>
      </div>

      {/* ── 3. Main Tables (Invoices Ledger & Payment Timeline) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Invoices Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-outline-variant/15 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 font-sans">
              <Receipt className="w-4.5 h-4.5 text-primary" />
              Invoice History ({invoices.length})
            </h3>

            <button
              onClick={() => onOpenBillingReview(encounters.length > 0 ? encounters[0] : undefined)}
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> New Invoice
            </button>
          </div>

          {invoices.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No invoices generated yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Completed dental treatments will appear in the invoice generation drawer.
              </p>
              <button
                onClick={() => onOpenBillingReview(encounters.length > 0 ? encounters[0] : undefined)}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer mt-2"
              >
                Create First Invoice
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Treatments</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold font-mono text-slate-900">
                        #{inv.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="p-3 text-slate-600 whitespace-nowrap">
                        {formatVisitDate(inv.invoiceDate)}
                      </td>
                      <td className="p-3 text-slate-800">
                        <div className="font-medium max-w-[200px] truncate" title={inv.treatments?.join(", ") || "Dental Treatment"}>
                          {inv.treatments?.join(", ") || "Dental Treatment"}
                        </div>
                      </td>
                      <td className="p-3 text-right font-black text-slate-900 font-mono">
                        ₹{formatINR(inv.total || inv.amount)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            inv.paymentStatus === "Paid" || inv.paymentStatus === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {inv.paymentStatus || "UNPAID"}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* PDF Download */}
                          <button
                            type="button"
                            disabled={downloadingId === inv.id}
                            onClick={() => handleDownloadPdf(inv)}
                            className="p-1.5 text-slate-600 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Download Invoice PDF"
                          >
                            {downloadingId === inv.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Email Invoice */}
                          {patient.email && (
                            <button
                              type="button"
                              disabled={emailingId === inv.id}
                              onClick={() => handleEmailInvoice(inv)}
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Email Invoice"
                            >
                              {emailingId === inv.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                              ) : (
                                <Mail className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          {/* WhatsApp Invoice */}
                          <button
                            type="button"
                            disabled={sendingInvoiceId === inv.id}
                            onClick={async () => {
                              if (sendingInvoiceId === inv.id) return;
                              setSendingInvoiceId(inv.id);
                              try {
                                const clinicName = clinicSettings?.clinicName || "Sanjivani Dental Clinic";
                                const currency = clinicSettings?.currencySymbol || "₹";
                                const res = await sendWhatsAppMessage({
                                  messageType: "invoice",
                                  recipient: patient.phone,
                                  patientId: patient.id,
                                  patientName: patient.name,
                                  invoiceId: inv.id,
                                  clinicName,
                                });
                                if (res.success) {
                                  showToast(res.message);
                                } else if (res.code === "REQUEST_ALREADY_IN_PROGRESS") {
                                  showToast("Message is already being sent.");
                                } else {
                                  const digits = patient.phone.replace(/\D/g, "");
                                  const msg = `Hello ${patient.name}!\n\nYour invoice #${inv.id.slice(0, 8).toUpperCase()} for ${currency}${formatINR(inv.total || inv.amount)} from ${clinicName} has been generated.\n\nThank you!`;
                                  window.open(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`, "_blank");
                                }
                              } finally {
                                setSendingInvoiceId(null);
                              }
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 rounded-lg text-[11px] font-bold border border-emerald-200 transition-colors cursor-pointer disabled:opacity-50"
                            title="Send invoice via WhatsApp"
                          >
                            {sendingInvoiceId === inv.id ? "Sending..." : "WhatsApp"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Payment Timeline (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-outline-variant/15 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 font-sans">
              <Clock className="w-4.5 h-4.5 text-primary" />
              Payment Timeline
            </h3>
          </div>

          {allPayments.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No payment transactions logged yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {allPayments.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-center shadow-2xs"
                >
                  <div>
                    <span className="font-black text-slate-900 font-mono block">
                      ₹{formatINR(p.amount)} via {p.method}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Invoice #{p.invoiceNo} • {formatVisitDate(p.date)}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md">
                    Received
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};

export const BillingTab = InvoicesPaymentsTab;
