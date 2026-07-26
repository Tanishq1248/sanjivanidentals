"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Save, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { queryKeys } from "../../../../lib/query/queryKeys";
import {
  getBillingSettings,
  createOrUpdateBillingSettings,
  validateBillingSettings,
} from "../../../../lib/services/settingsService";
import type { BillingSettingsData } from "../../../../lib/types";

export default function BillingSettingsSection() {
  const queryClient = useQueryClient();
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { data: settingsData } = useQuery({
    queryKey: queryKeys.settings.billingSettings,
    queryFn: getBillingSettings,
    staleTime: 5 * 60_000,
  });

  const [formData, setFormData] = useState<BillingSettingsData>({
    invoiceNumberPrefix: "DP-INV-",
    nextInvoiceNumber: 1001,
    defaultGstRate: 18,
    systemCurrency: "INR",
    currencySymbol: "₹",
    taxIncludedMode: false,
    invoiceFooterText: "Thank you for choosing Sanjivani Dentals.",
    paymentInstructions: "Pay via UPI / Card / Cash at reception or NEFT/Bank Transfer.",
  });

  useEffect(() => {
    if (settingsData) {
      setFormData(settingsData);
    }
  }, [settingsData]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<BillingSettingsData>) => createOrUpdateBillingSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.billingSettings });
      setSavedSuccess(true);
      setValidationErrors({});
      setTimeout(() => setSavedSuccess(false), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateBillingSettings(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }
    setValidationErrors({});
    updateMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary">
              Billing &amp; Tax
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Billing Preferences &amp; Invoicing
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Configure default invoice numbering prefix, starting sequence, GST rates, and payment terms.
          </p>
        </div>
      </div>

      {Object.keys(validationErrors).length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Please resolve the following errors:</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5">
            {Object.values(validationErrors).map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">Invoice Number Prefix *</label>
            <input
              type="text"
              required
              value={formData.invoiceNumberPrefix}
              onChange={(e) => setFormData({ ...formData, invoiceNumberPrefix: e.target.value })}
              placeholder="e.g. DP-INV-"
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all ${
                validationErrors.invoiceNumberPrefix ? "border-rose-400 bg-rose-50/20" : "border-outline-variant/30"
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">Next Invoice Number Counter *</label>
            <input
              type="number"
              min={1}
              required
              value={formData.nextInvoiceNumber}
              onChange={(e) => setFormData({ ...formData, nextInvoiceNumber: parseInt(e.target.value) || 1001 })}
              placeholder="e.g. 1001"
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all ${
                validationErrors.nextInvoiceNumber ? "border-rose-400 bg-rose-50/20" : "border-outline-variant/30"
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">Default GST Tax Rate (%)</label>
            <select
              value={formData.defaultGstRate}
              onChange={(e) => setFormData({ ...formData, defaultGstRate: parseFloat(e.target.value) || 0 })}
              className="w-full px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
            >
              <option value={0}>0% (Tax Exempt)</option>
              <option value={5}>5% GST</option>
              <option value={12}>12% GST</option>
              <option value={18}>18% GST (Standard)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">System Currency</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.systemCurrency}
                onChange={(e) => setFormData({ ...formData, systemCurrency: e.target.value })}
                placeholder="INR"
                className="w-2/3 px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all"
              />
              <input
                type="text"
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                placeholder="₹"
                className="w-1/3 px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-on-surface mb-1.5">Payment Instructions Note</label>
            <textarea
              rows={2}
              value={formData.paymentInstructions}
              onChange={(e) => setFormData({ ...formData, paymentInstructions: e.target.value })}
              placeholder="e.g. Pay via UPI / Card / Cash at reception..."
              className="w-full px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all resize-none"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-outline-variant/15 flex items-center justify-between">
          {savedSuccess ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Billing preferences updated successfully!
            </span>
          ) : <span />}

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Billing Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
