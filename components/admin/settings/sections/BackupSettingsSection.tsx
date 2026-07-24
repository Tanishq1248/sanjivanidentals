"use client";

import React, { useState } from "react";
import { Database, Download, RefreshCw, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";

export default function BackupSettingsSection() {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [autoBackupFrequency, setAutoBackupFrequency] = useState("daily");

  const handleExportData = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    }, 1500);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary">
              Data Management
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">Database Backup & Data Export</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Configure automated cloud backups and export complete clinic data for local archives.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Automated Backups Card */}
        <div className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-on-surface">Automated Cloud Backups</h3>
              <p className="text-xs text-on-surface-variant">Encrypted Firebase Cloud Firestore snapshots</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">Backup Schedule</label>
            <select
              value={autoBackupFrequency}
              onChange={(e) => setAutoBackupFrequency(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
            >
              <option value="daily">Daily Automatic Backup (02:00 AM)</option>
              <option value="weekly">Weekly Backup (Sundays)</option>
              <option value="monthly">Monthly Snapshot</option>
            </select>
          </div>

          <div className="pt-2 text-xs text-on-surface-variant/80 space-y-1">
            <p>• Last successful backup: <span className="font-bold text-on-surface">Today, 02:00 AM</span></p>
            <p>• Storage Status: <span className="font-bold text-emerald-600">Healthy (256 MB used)</span></p>
          </div>
        </div>

        {/* Manual Export Card */}
        <div className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-on-surface">Export Clinic Data</h3>
                <p className="text-xs text-on-surface-variant">Download JSON / CSV of all patients & invoices</p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Generate a comprehensive export bundle containing patient records, medical profiles, prescriptions, billing invoices, and appointment history.
            </p>
          </div>

          <div className="pt-4 border-t border-outline-variant/15 flex items-center justify-between">
            {downloadSuccess ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Export generated!
              </span>
            ) : <span />}

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
          </div>
        </div>
      </div>
    </div>
  );
}
