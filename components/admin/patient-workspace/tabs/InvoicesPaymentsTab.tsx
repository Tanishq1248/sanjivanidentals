"use client";

import React from "react";
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
} from "lucide-react";
import type { Invoice, PatientEncounter, Patient } from "../../../../lib/types";

interface InvoicesPaymentsTabProps {
  invoices: Invoice[];
  encounters: PatientEncounter[];
  patient: Patient;
  onOpenBillingReview: (encounter: PatientEncounter) => void;
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

export const InvoicesPaymentsTab: React.FC<InvoicesPaymentsTabProps> = ({
  invoices,
  encounters,
  patient,
  onOpenBillingReview,
}) => {
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-outline-variant/15 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Billed
          </span>
          <span className="font-black text-slate-900 text-2xl font-mono block">
            ₹{formatINR(totalBilled)}
          </span>
        </div>

        <div className="p-5 bg-emerald-50/60 border border-emerald-100 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
            Total Paid
          </span>
          <span className="font-black text-emerald-700 text-2xl font-mono block">
            ₹{formatINR(totalPaid)}
          </span>
        </div>

        <div className="p-5 bg-red-50/60 border border-red-100 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block">
            Outstanding Balance
          </span>
          <span className="font-black text-red-700 text-2xl font-mono block">
            ₹{formatINR(outstanding)}
          </span>
        </div>

        <div className="p-5 bg-amber-50/60 border border-amber-100 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
            Overdue Amount
          </span>
          <span className="font-black text-amber-700 text-2xl font-mono block">
            ₹{formatINR(overdueAmount)}
          </span>
        </div>
      </div>

      {/* Main Financial Tables (Invoices & Payment History) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Invoice History Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-outline-variant/15 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 font-sans">
              <Receipt className="w-4.5 h-4.5 text-primary" />
              Invoice History ({invoices.length})
            </h3>

            {encounters.length > 0 && (
              <button
                onClick={() => onOpenBillingReview(encounters[0])}
                className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Generate Invoice
              </button>
            )}
          </div>

          {invoices.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">No invoices generated yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                    <th className="p-3">Invoice No</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Treatments</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold font-mono text-slate-900">
                        #{inv.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="p-3 text-slate-600">
                        {formatVisitDate(inv.invoiceDate)}
                      </td>
                      <td className="p-3 text-slate-800">
                        {inv.treatments?.join(", ") || "Dental Treatment"}
                      </td>
                      <td className="p-3 text-right font-extrabold text-slate-900 font-mono">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Payment Timeline (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-outline-variant/15 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 font-sans">
              <Clock className="w-4.5 h-4.5 text-primary" />
              Payment Timeline
            </h3>
          </div>

          {allPayments.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No payments recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {allPayments.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-center shadow-2xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 font-mono block">
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
    </div>
  );
};
