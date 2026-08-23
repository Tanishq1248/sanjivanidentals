"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateInvoicePaymentDetailsAction } from "../../server/actions/billingActions";
import { X, Loader2 } from "lucide-react";
import type { Invoice, PaymentMethod, PaymentHistoryEntry, InstallmentPlan } from "../../lib/types";

interface PaymentDialogProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function formatINR(amount: any): string {
  const val = Number(amount || 0);
  const hasPaise = val % 1 !== 0;
  return val.toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

export function PaymentDialog({ invoice, isOpen, onClose, onSuccess }: PaymentDialogProps) {
  const queryClient = useQueryClient();

  // Form states
  const [paymentType, setPaymentType] = useState<"PAID" | "PARTIAL" | "PENDING">("PAID");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [discountApplied, setDiscountApplied] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Derived values from invoice
  const total = invoice ? (invoice.total !== undefined ? invoice.total : (invoice.netAmount !== undefined ? invoice.netAmount : (invoice.amount || 0))) : 0;
  const paid = invoice ? (invoice.paidAmount || 0) : 0;
  const remaining = Math.max(0, total - paid);

  // Initialize values when invoice changes or modal opens
  useEffect(() => {
    if (invoice) {
      setDiscountApplied("");
      setNotes("");
      setPaymentType("PAID");
      setAmountReceived(String(remaining));

      // Default due date: today + 7 days
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setDueDate(d.toISOString().split("T")[0]);
    }
  }, [invoice, isOpen]);

  // Adjust amount received based on payment type
  useEffect(() => {
    if (invoice) {
      if (paymentType === "PAID") {
        setAmountReceived(String(remaining));
      } else if (paymentType === "PENDING") {
        setAmountReceived("0");
      }
    }
  }, [paymentType, remaining]);

  const updateInvoiceMutation = useMutation({
    mutationFn: async (payload: {
      invoiceId: string;
      paymentType: "PAID" | "PARTIAL" | "PENDING";
      paymentMethod: string;
      amountReceived: number;
      discountApplied?: number;
      dueDate?: string;
      notes?: string;
    }) => {
      const res = await updateInvoicePaymentDetailsAction(payload);
      if (!res.success) {
        throw new Error(res.error || "Failed to update payment on server.");
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["finance", "stats"] });
      if (invoice) {
        queryClient.invalidateQueries({ queryKey: ["invoices", "patient", invoice.patientId] });
      }
      if (onSuccess) onSuccess();
      onClose();
    },
  });

  if (!isOpen || !invoice) return null;

  const handleSave = () => {
    const received =
      paymentType === "PAID"
        ? remaining
        : paymentType === "PENDING"
        ? 0
        : parseFloat(amountReceived) || 0;
    const addedDiscount = parseFloat(discountApplied) || 0;

    updateInvoiceMutation.mutate({
      invoiceId: invoice.id,
      paymentType,
      paymentMethod,
      amountReceived: received,
      discountApplied: addedDiscount,
      dueDate,
      notes,
    });
  };

  const isSaving = updateInvoiceMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 text-on-surface">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-outline-variant/10 bg-surface-container-lowest flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider font-sans">
              Collect Payment
            </h3>
            <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">
              Invoice ID: #{invoice.id.slice(0, 8).toUpperCase()} · {invoice.patientName || "Patient"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* Invoice Summary Card */}
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10 grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block">Total Billed</span>
              <span className="text-sm font-bold font-mono text-primary font-sans">₹{formatINR(total)}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block">Already Paid</span>
              <span className="text-sm font-bold font-mono text-emerald-600 font-sans">₹{formatINR(paid)}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block">Balance Due</span>
              <span className="text-sm font-black font-mono text-red-600 font-sans">₹{formatINR(remaining)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Payment Type */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Payment Type</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              >
                <option value="PAID">Full Payment</option>
                <option value="PARTIAL">Partial Payment</option>
                <option value="PENDING">Keep Pending</option>
              </select>
            </div>

            {/* Payment Method */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Payment Method</label>
              <select
                value={paymentMethod}
                disabled={paymentType === "PENDING"}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white disabled:opacity-50"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Amount Received */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Amount Received (INR)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-on-surface-variant">₹</span>
                <input
                  type="number"
                  min="0"
                  max={remaining}
                  disabled={paymentType !== "PARTIAL"}
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 rounded-lg border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white font-mono font-bold text-sm disabled:opacity-50"
                />
              </div>
            </div>

            {/* Next Due Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                {paymentType === "PAID" ? "Due Date (Closed)" : "Due Date"}
              </label>
              <input
                type="date"
                disabled={paymentType === "PAID"}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white font-semibold disabled:opacity-50"
              />
            </div>
          </div>

          {/* Discount & Notes */}
          <div className="grid grid-cols-2 gap-4">
            {/* Additional Discount */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Add Discount (Optional)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-semibold text-red-500">-₹</span>
                <input
                  type="number"
                  min="0"
                  max={remaining}
                  value={discountApplied}
                  onChange={(e) => setDiscountApplied(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white font-mono font-semibold text-red-600"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Notes / Memo</label>
              <textarea
                rows={1}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Paid via UPI GPay"
                className="w-full px-3 py-1.5 rounded-lg border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white resize-none"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-outline-variant/10 bg-surface-container-lowest flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold py-2 rounded-xl transition-all cursor-pointer border-none"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving || (paymentType === "PARTIAL" && (parseFloat(amountReceived) || 0) <= 0)}
            onClick={handleSave}
            className="flex-1 bg-primary text-white font-bold py-2 rounded-xl text-xs hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 border-none shadow-md"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save Payment
          </button>
        </div>

      </div>
    </div>
  );
}
