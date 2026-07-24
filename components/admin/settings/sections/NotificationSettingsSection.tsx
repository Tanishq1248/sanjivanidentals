"use client";

import React, { useState } from "react";
import { Bell, Save, CheckCircle2, MessageSquare, Mail, Smartphone } from "lucide-react";

export default function NotificationSettingsSection() {
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [reminderTiming, setReminderTiming] = useState("24");

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
              Communications
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">Patient Notification Channels</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Configure automated SMS, WhatsApp, and Email reminders for upcoming appointments.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">Reminder Timing</label>
            <select
              value={reminderTiming}
              onChange={(e) => setReminderTiming(e.target.value)}
              className="w-full max-w-xs px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
            >
              <option value="2">2 Hours Before</option>
              <option value="12">12 Hours Before</option>
              <option value="24">24 Hours (1 Day) Before</option>
              <option value="48">48 Hours (2 Days) Before</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-outline-variant/15">
            <label className="flex items-center gap-3 p-4 rounded-xl border border-outline-variant/20 cursor-pointer hover:bg-surface-container-lowest transition-colors">
              <input
                type="checkbox"
                checked={whatsappAlerts}
                onChange={(e) => setWhatsappAlerts(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="font-bold text-xs text-on-surface">WhatsApp Reminders</p>
                  <p className="text-[10px] text-on-surface-variant">Automated WhatsApp text</p>
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 rounded-xl border border-outline-variant/20 cursor-pointer hover:bg-surface-container-lowest transition-colors">
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="w-4 h-4 text-primary rounded"
              />
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" />
                <div>
                  <p className="font-bold text-xs text-on-surface">SMS Reminders</p>
                  <p className="text-[10px] text-on-surface-variant">Transactional SMS</p>
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 rounded-xl border border-outline-variant/20 cursor-pointer hover:bg-surface-container-lowest transition-colors">
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-600" />
                <div>
                  <p className="font-bold text-xs text-on-surface">Email Reminders</p>
                  <p className="text-[10px] text-on-surface-variant">HTML Email invites</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-outline-variant/15 flex items-center justify-between">
          {savedSuccess ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Notification preferences saved!
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
