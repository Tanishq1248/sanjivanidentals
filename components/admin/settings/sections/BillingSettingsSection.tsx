"use client";

import React, { useState } from "react";
import { CreditCard, Save, CheckCircle2 } from "lucide-react";

export default function BillingSettingsSection() {
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [invoicePrefix, setInvoicePrefix] = useState("DP-INV-");
  const [defaultTaxRate, setDefaultTaxRate] = useState("18");
  const [currency, setCurrency] = useState("INR (₹)");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary">
              Billing & Tax
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">Billing Preferences & Invoicing</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Customize invoice numbering, GST defaults, and currency settings.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">Invoice Number Prefix</label>
            <input
              type="text"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">Default GST Tax Rate (%)</label>
            <select
              value={defaultTaxRate}
              onChange={(e) => setDefaultTaxRate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
            >
              <option value="0">0% (Exempt)</option>
              <option value="5">5% GST</option>
              <option value="12">12% GST</option>
              <option value="18">18% GST (Standard)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">System Currency</label>
            <input
              type="text"
              disabled
              value={currency}
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-xs font-medium text-on-surface-variant cursor-not-allowed"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-outline-variant/15 flex items-center justify-between">
          {savedSuccess ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Preferences saved!
            </span>
          ) : <span />}

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
