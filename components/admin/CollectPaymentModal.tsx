"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, CreditCard, Search, ArrowRight, CheckCircle2, Phone, Calendar, User } from "lucide-react";
import { getInvoices } from "../../lib/services/invoiceService";
import { getPatients } from "../../lib/services/patientService";
import { PaymentDialog } from "./PaymentDialog";
import type { Invoice, Patient } from "../../lib/types";
import { queryKeys } from "../../lib/query/queryKeys";

interface CollectPaymentModalProps {
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

export function CollectPaymentModal({
  isOpen,
  onClose,
  onSuccess,
}: CollectPaymentModalProps) {
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: queryKeys.invoices.all,
    queryFn: getInvoices,
    enabled: isOpen,
    staleTime: 30 * 1000,
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: queryKeys.patients.all,
    queryFn: getPatients,
    enabled: isOpen,
    staleTime: 2 * 60 * 1000,
  });

  const patientMap = useMemo(() => {
    const map = new Map<string, Patient>();
    patients.forEach((p) => map.set(p.id, p));
    return map;
  }, [patients]);

  const pendingInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices
      .filter((inv) => {
        const total = inv.total ?? inv.netAmount ?? inv.amount ?? 0;
        const paid = inv.paidAmount || 0;
        const remaining = total - paid;
        return remaining > 0 && inv.paymentStatus !== "Paid";
      })
      .filter((inv) => {
        if (!q) return true;
        const p = patientMap.get(inv.patientId);
        const name = inv.patientName || p?.name || "";
        const phone = p?.phone || "";
        return (
          name.toLowerCase().includes(q) ||
          phone.includes(q) ||
          inv.id.toLowerCase().includes(q)
        );
      });
  }, [invoices, search, patientMap]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden font-sans flex flex-col max-h-[85vh]">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-4 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Quick Payment Collection
                </h2>
                <p className="text-xs text-slate-300">
                  Select an outstanding invoice to collect payment immediately
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by patient name, phone, or invoice..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Invoices List */}
          <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
            {pendingInvoices.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No Pending Invoices</p>
                <p className="text-xs text-slate-500">
                  All clinic accounts are fully settled or no records matched your search.
                </p>
              </div>
            ) : (
              pendingInvoices.map((inv) => {
                const total = inv.total ?? inv.netAmount ?? inv.amount ?? 0;
                const paid = inv.paidAmount || 0;
                const balance = Math.max(0, total - paid);
                const patientObj = patientMap.get(inv.patientId);
                const pName = inv.patientName || patientObj?.name || "Patient";
                const pPhone = patientObj?.phone || "";

                return (
                  <div
                    key={inv.id}
                    className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50 px-3 rounded-xl transition-colors cursor-pointer"
                    onClick={() => setSelectedInvoice(inv)}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{pName}</span>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          #{inv.id.slice(0, 8)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        {pPhone && <span className="font-mono">{pPhone}</span>}
                        <span>•</span>
                        <span>Date: {inv.invoiceDate || inv.visitDate || "—"}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div>
                        <span className="text-xs font-extrabold text-rose-600 block">
                          ₹{formatINR(balance)} Due
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Total: ₹{formatINR(total)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        Collect <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Embedded Payment Dialog */}
      {selectedInvoice && (
        <PaymentDialog
          invoice={selectedInvoice}
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onSuccess={() => {
            setSelectedInvoice(null);
            if (onSuccess) onSuccess();
          }}
        />
      )}
    </>
  );
}
