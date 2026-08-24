"use client";

import React from "react";
import { useAuth } from "../../lib/context/AuthContext";
import { Clock, ShieldAlert, LogOut, RefreshCw } from "lucide-react";

/**
 * A modal that warns the doctor 60 seconds before session expiration due to inactivity.
 * Allows the doctor to click "Stay Logged In" to seamlessly continue working.
 */
export function SessionInactivityDialog() {
  const { warningSecondsRemaining, stayLoggedIn, logout } = useAuth();

  if (warningSecondsRemaining === null || warningSecondsRemaining <= 0) {
    return null;
  }

  // Calculate percentage of remaining time out of 60 seconds for visual indicator
  const progressPercent = Math.min(100, Math.max(0, (warningSecondsRemaining / 60) * 100));

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inactivity-dialog-title"
    >
      <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-5 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 text-amber-700 shadow-xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 id="inactivity-dialog-title" className="text-base font-bold text-on-surface">
              Session Expiring Soon
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Inactivity detected for patient data security.
            </p>
          </div>
        </div>

        {/* Countdown Box */}
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-700 animate-pulse" />
              Auto-logging out in:
            </span>
            <span className="text-base font-extrabold text-amber-800 tabular-nums">
              {warningSecondsRemaining}s
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-amber-200/60 overflow-hidden">
            <div
              className="h-full bg-amber-600 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="text-[11px] text-amber-800/90 leading-tight">
            Click <strong>Stay Logged In</strong> below or interact with the screen to keep your clinical session active.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => logout()}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log Out Now
          </button>
          <button
            type="button"
            onClick={stayLoggedIn}
            autoFocus
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/90 shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
}
