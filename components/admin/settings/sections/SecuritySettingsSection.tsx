"use client";

import React, { useState } from "react";
import { ShieldCheck, Save, CheckCircle2, Lock, KeyRound } from "lucide-react";

export default function SecuritySettingsSection() {
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [require2fa, setRequire2fa] = useState(false);
  const [auditLogging, setAuditLogging] = useState(true);

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
              Security
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">Security & Authentication</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage session expiration policies, multi-factor authentication, and security audit logs.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">Inactivity Session Timeout</label>
            <select
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
            >
              <option value="15">15 Minutes</option>
              <option value="30">30 Minutes (Recommended)</option>
              <option value="60">1 Hour</option>
              <option value="120">2 Hours</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-3 pt-2 border-t border-outline-variant/15">
            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-outline-variant/20 cursor-pointer hover:bg-surface-container-lowest transition-colors">
              <input
                type="checkbox"
                checked={require2fa}
                onChange={(e) => setRequire2fa(e.target.checked)}
                className="w-4 h-4 text-primary rounded"
              />
              <div>
                <p className="font-bold text-xs text-on-surface">Enforce Multi-Factor Authentication (2FA)</p>
                <p className="text-[11px] text-on-surface-variant">Require OTP verification for doctor and admin accounts</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-outline-variant/20 cursor-pointer hover:bg-surface-container-lowest transition-colors">
              <input
                type="checkbox"
                checked={auditLogging}
                onChange={(e) => setAuditLogging(e.target.checked)}
                className="w-4 h-4 text-primary rounded"
              />
              <div>
                <p className="font-bold text-xs text-on-surface">Detailed Security Audit Logs</p>
                <p className="text-[11px] text-on-surface-variant">Log all patient record views, exports, and bill modifications</p>
              </div>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-outline-variant/15 flex items-center justify-between">
          {savedSuccess ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Security settings saved!
            </span>
          ) : <span />}

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save Security Rules
          </button>
        </div>
      </form>
    </div>
  );
}
