"use client";

import React, { useState } from "react";
import { FileText, Save, CheckCircle2 } from "lucide-react";

export default function PrescriptionSettingsSection() {
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [footerNotes, setFooterNotes] = useState(
    "Please complete full course of prescribed antibiotics. Contact clinic immediately in case of severe allergic reaction or swelling."
  );
  const [showQrCode, setShowQrCode] = useState(true);

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
              Rx Templates
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">Prescription Layout & Templates</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Customize digital prescription headers, default advice text, and printed footers.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">Default Prescription Footer Note</label>
            <textarea
              rows={3}
              value={footerNotes}
              onChange={(e) => setFooterNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all resize-none"
            />
          </div>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/20 cursor-pointer hover:bg-surface-container-lowest transition-colors">
            <input
              type="checkbox"
              checked={showQrCode}
              onChange={(e) => setShowQrCode(e.target.checked)}
              className="w-4 h-4 text-primary rounded"
            />
            <div>
              <p className="font-bold text-xs text-on-surface">Print Digital Verification QR Code</p>
              <p className="text-[11px] text-on-surface-variant">Include verification QR code on PDF prints for patients</p>
            </div>
          </label>
        </div>

        <div className="pt-4 border-t border-outline-variant/15 flex items-center justify-between">
          {savedSuccess ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Prescription settings saved!
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
