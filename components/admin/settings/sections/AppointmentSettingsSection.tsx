"use client";

import React, { useState } from "react";
import { Calendar, Save, CheckCircle2, Clock } from "lucide-react";

export default function AppointmentSettingsSection() {
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [slotDuration, setSlotDuration] = useState("30");
  const [bufferTime, setBufferTime] = useState("10");
  const [allowOverbooking, setAllowOverbooking] = useState(false);
  const [autoConfirm, setAutoConfirm] = useState(true);

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
              Appointments
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">Appointment & Schedule Settings</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Configure default slot intervals, buffer timings, and booking rules.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">Default Slot Duration</label>
            <select
              value={slotDuration}
              onChange={(e) => setSlotDuration(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
            >
              <option value="15">15 Minutes</option>
              <option value="30">30 Minutes (Recommended)</option>
              <option value="45">45 Minutes</option>
              <option value="60">60 Minutes (1 Hour)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">Buffer Time Between Appointments</label>
            <select
              value={bufferTime}
              onChange={(e) => setBufferTime(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
            >
              <option value="0">No Buffer</option>
              <option value="5">5 Minutes</option>
              <option value="10">10 Minutes</option>
              <option value="15">15 Minutes</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-3 pt-2 border-t border-outline-variant/15">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/20 cursor-pointer hover:bg-surface-container-lowest transition-colors">
              <input
                type="checkbox"
                checked={autoConfirm}
                onChange={(e) => setAutoConfirm(e.target.checked)}
                className="w-4 h-4 text-primary rounded"
              />
              <div>
                <p className="font-bold text-xs text-on-surface">Auto-Confirm Patient Web Bookings</p>
                <p className="text-[11px] text-on-surface-variant">Automatically approve appointments booked online</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/20 cursor-pointer hover:bg-surface-container-lowest transition-colors">
              <input
                type="checkbox"
                checked={allowOverbooking}
                onChange={(e) => setAllowOverbooking(e.target.checked)}
                className="w-4 h-4 text-primary rounded"
              />
              <div>
                <p className="font-bold text-xs text-on-surface">Allow Chair Overbooking</p>
                <p className="text-[11px] text-on-surface-variant">Permit scheduling overlapping appointments during peak hours</p>
              </div>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-outline-variant/15 flex items-center justify-between">
          {savedSuccess ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Settings saved!
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
