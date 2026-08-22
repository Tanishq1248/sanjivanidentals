"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Save, CheckCircle2, Loader2 } from "lucide-react";
import { queryKeys } from "../../../../lib/query/queryKeys";
import {
  getClinicInfo,
  createOrUpdateClinicInfo,
} from "../../../../lib/services/settingsService";
import type { ClinicBasicInfo } from "../../../../lib/types";

export default function PrescriptionSettingsSection() {
  const queryClient = useQueryClient();
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [prescriptionFooterText, setPrescriptionFooterText] = useState(
    "Please complete full course of prescribed antibiotics. Contact clinic immediately in case of severe allergic reaction or swelling."
  );
  const [showQrCode, setShowQrCode] = useState(true);

  const { data: clinicData, isLoading } = useQuery<ClinicBasicInfo>({
    queryKey: queryKeys.settings.clinicInfo,
    queryFn: getClinicInfo,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (clinicData) {
      if (clinicData.prescriptionFooterText || clinicData.prescriptionFooterNote) {
        setPrescriptionFooterText(
          clinicData.prescriptionFooterText || clinicData.prescriptionFooterNote || ""
        );
      }
    }
  }, [clinicData]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<ClinicBasicInfo>) => createOrUpdateClinicInfo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.clinicInfo });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      prescriptionFooterText,
      prescriptionFooterNote: prescriptionFooterText,
    });
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
          <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Prescription Layout &amp; Templates
          </h2>
          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
            Customize digital prescription headers, default advice text, and printed footers synced across all doctors and PDF pads.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">
              Default Prescription Footer Note
            </label>
            <textarea
              rows={3}
              value={prescriptionFooterText}
              onChange={(e) => setPrescriptionFooterText(e.target.value)}
              placeholder="e.g. Please complete full course of prescribed antibiotics..."
              className="w-full px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all resize-none"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              This notice appears at the bottom of all generated prescription PDFs, printable pads, and WhatsApp previews.
            </p>
          </div>

          <label className="flex items-center gap-3 p-3.5 rounded-xl border border-outline-variant/20 cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={showQrCode}
              onChange={(e) => setShowQrCode(e.target.checked)}
              className="w-4 h-4 text-primary rounded"
            />
            <div>
              <p className="font-bold text-xs text-on-surface">Print Digital Verification QR Code</p>
              <p className="text-[11px] text-on-surface-variant">Include digital record verification QR code on PDF prints for patients</p>
            </div>
          </label>
        </div>

        <div className="pt-4 border-t border-outline-variant/15 flex items-center justify-between">
          {savedSuccess ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Prescription settings saved successfully!
            </span>
          ) : <span />}

          <button
            type="submit"
            disabled={updateMutation.isPending || isLoading}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
