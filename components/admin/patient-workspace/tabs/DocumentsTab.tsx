"use client";

import React from "react";
import { FileCheck, ShieldCheck, FileSpreadsheet, UploadCloud, Plus } from "lucide-react";

export const DocumentsTab: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="bg-white p-5 rounded-2xl border border-outline-variant/15 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-on-surface">Legal & Administrative Documents</h2>
            <p className="text-xs text-on-surface-variant">
              Future-ready workspace for patient consent forms, dental insurance claims, and external records.
            </p>
          </div>
        </div>

        <button className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm">
          <Plus className="w-4 h-4" /> Add Document
        </button>
      </div>

      {/* Grid of Future-Ready Document Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Consent Forms */}
        <div className="bg-white rounded-2xl border border-outline-variant/15 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Legal Ready
            </span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">Treatment Consent Forms</h3>
            <p className="text-xs text-slate-500 mt-1">
              Signed digital consent agreements for surgical procedures, root canals, and anesthesia.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-medium text-center">
            No signed consent forms attached.
          </div>
        </div>

        {/* Insurance */}
        <div className="bg-white rounded-2xl border border-outline-variant/15 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Insurance Vault
            </span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">Insurance & Claims</h3>
            <p className="text-xs text-slate-500 mt-1">
              Dental insurance policy cards, pre-authorization letters, and claim submissions.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-medium text-center">
            No active insurance documents registered.
          </div>
        </div>

        {/* External Documents */}
        <div className="bg-white rounded-2xl border border-outline-variant/15 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-purple-50 text-purple-700 rounded-xl border border-purple-100">
              <FileCheck className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              External Files
            </span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">External Referrals & Documents</h3>
            <p className="text-xs text-slate-500 mt-1">
              External physician clearances, hospital transfer records, and diagnostic scans.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-medium text-center">
            No external documents uploaded.
          </div>
        </div>
      </div>
    </div>
  );
};
