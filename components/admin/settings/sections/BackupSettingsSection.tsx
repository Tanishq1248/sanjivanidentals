"use client";

import React, { useState } from "react";
import {
  Database,
  Download,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Lock,
  Sparkles,
  FileText,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../../lib/query/queryKeys";
import { getClinicInfo } from "../../../../lib/services/clinicSettingsService";
import {
  getSubscription,
  canExportBulkData,
  FeatureAccessService,
} from "../../../../lib/services/featureAccessService";
import { UpgradeToProModal } from "../UpgradeToProModal";

export default function BackupSettingsSection() {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [autoBackupFrequency, setAutoBackupFrequency] = useState("daily");
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const { data: clinicInfo } = useQuery({
    queryKey: queryKeys.settings.clinicInfo,
    queryFn: getClinicInfo,
    staleTime: 5 * 60_000,
  });

  const subscription = getSubscription(clinicInfo);
  const isBasicPlan = subscription.plan === "basic";
  const canBulkExport = canExportBulkData(clinicInfo);

  const handleExportData = () => {
    if (!canBulkExport) {
      setIsUpgradeModalOpen(true);
      return;
    }

    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    }, 1500);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary">
              Data Management
            </span>
            <span
              className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                isBasicPlan
                  ? "bg-amber-50 text-amber-900 border-amber-300"
                  : "bg-emerald-50 text-emerald-900 border-emerald-300"
              }`}
            >
              {isBasicPlan ? "Basic Plan (Single-Patient PDF Export)" : "Professional Plan (Bulk Clinic Export)"}
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">Database Backup &amp; Data Export</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Configure automated cloud backup schedules and export complete clinic datasets for offsite archival.
          </p>
        </div>
      </div>

      {/* Basic Plan Info / Upgrade Alert */}
      {isBasicPlan && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                🔒 1-Click Bulk Clinic Export &amp; Auto-Backups Locked
              </p>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                Bulk clinic database packaging (JSON/CSV) and scheduled cloud snapshots require the{" "}
                <strong>Professional Plan</strong>. Single-patient PDF exports remain available on individual patient profiles.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsUpgradeModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 self-end sm:self-center"
          >
            <Sparkles className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span>Upgrade to Pro</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Automated Backups Card */}
        <div className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-on-surface">Automated Cloud Backups</h3>
                  <p className="text-xs text-on-surface-variant">Encrypted Firebase Cloud Firestore snapshots</p>
                </div>
              </div>
              {!canBulkExport && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                  <Lock className="w-3 h-3" /> PRO
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5 flex items-center justify-between">
                <span>Backup Schedule</span>
                {!canBulkExport && (
                  <span className="text-[10px] text-amber-800 font-bold">Locked on Basic</span>
                )}
              </label>
              {canBulkExport ? (
                <select
                  value={autoBackupFrequency}
                  onChange={(e) => setAutoBackupFrequency(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
                >
                  <option value="daily">Daily Automatic Backup (02:00 AM)</option>
                  <option value="weekly">Weekly Backup (Sundays)</option>
                  <option value="monthly">Monthly Snapshot</option>
                </select>
              ) : (
                <div
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-500 flex items-center justify-between cursor-pointer hover:border-amber-300"
                >
                  <span>Manual Snapshots Only (Basic)</span>
                  <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Unlock Auto-Schedules
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-outline-variant/15 text-xs text-on-surface-variant/80 space-y-1">
            <p>• Encryption: <span className="font-bold text-on-surface">AES-256 Cloud Vault</span></p>
            <p>• Storage Status: <span className="font-bold text-emerald-600">Healthy (256 MB used)</span></p>
          </div>
        </div>

        {/* Manual Bulk Export Card */}
        <div className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-on-surface">1-Click Bulk Clinic Export</h3>
                  <p className="text-xs text-on-surface-variant">Download complete JSON / CSV clinic dataset</p>
                </div>
              </div>
              {!canBulkExport && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                  <Lock className="w-3 h-3" /> PRO
                </span>
              )}
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Generate an all-in-one ZIP archive containing all patient medical profiles, appointment histories, clinical dental charts, treatment plans, and billing invoices.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                <strong>Note:</strong> Single-patient PDF record export is always available on all plans inside individual patient workspaces.
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/15 flex items-center justify-between">
            {downloadSuccess ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Export generated!
              </span>
            ) : <span />}

            {canBulkExport ? (
              <button
                onClick={handleExportData}
                disabled={downloading}
                className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Packaging Data...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Export (.zip)
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Upgrade to Export Bulk Data</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pro Upgrade Modal */}
      <UpgradeToProModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        highlightFeature="1-Click Bulk Clinic Export & Scheduled Backups"
        currentPlan={subscription.plan}
      />
    </div>
  );
}
