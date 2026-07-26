"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Save, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { queryKeys } from "../../../../lib/query/queryKeys";
import {
  getAppointmentSettings,
  createOrUpdateAppointmentSettings,
  validateAppointmentSettings,
} from "../../../../lib/services/settingsService";
import type { AppointmentSettingsData } from "../../../../lib/types";

export default function AppointmentSettingsSection() {
  const queryClient = useQueryClient();
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { data: settingsData } = useQuery({
    queryKey: queryKeys.settings.appointmentSettings,
    queryFn: getAppointmentSettings,
    staleTime: 5 * 60_000,
  });

  const [formData, setFormData] = useState<AppointmentSettingsData>({
    defaultSlotDurationMinutes: 30,
    bufferTimeMinutes: 10,
    autoConfirmWebBookings: true,
    allowChairOverbooking: false,
  });

  useEffect(() => {
    if (settingsData) {
      setFormData(settingsData);
    }
  }, [settingsData]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<AppointmentSettingsData>) => createOrUpdateAppointmentSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.appointmentSettings });
      setSavedSuccess(true);
      setValidationErrors({});
      setTimeout(() => setSavedSuccess(false), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateAppointmentSettings(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }
    setValidationErrors({});
    updateMutation.mutate(formData);
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
          <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Appointment &amp; Schedule Settings
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Configure default slot intervals, buffer timings, web booking auto-confirmation, and chair overbooking policies.
          </p>
        </div>
      </div>

      {Object.keys(validationErrors).length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Please resolve the following errors:</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5">
            {Object.values(validationErrors).map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">Default Slot Duration</label>
            <select
              value={formData.defaultSlotDurationMinutes}
              onChange={(e) =>
                setFormData({ ...formData, defaultSlotDurationMinutes: parseInt(e.target.value) || 30 })
              }
              className="w-full px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
            >
              <option value={15}>15 Minutes</option>
              <option value={30}>30 Minutes (Recommended)</option>
              <option value={45}>45 Minutes</option>
              <option value={60}>60 Minutes (1 Hour)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">Buffer Time Between Appointments</label>
            <select
              value={formData.bufferTimeMinutes}
              onChange={(e) =>
                setFormData({ ...formData, bufferTimeMinutes: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
            >
              <option value={0}>No Buffer</option>
              <option value={5}>5 Minutes</option>
              <option value={10}>10 Minutes</option>
              <option value={15}>15 Minutes</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-3 pt-2 border-t border-outline-variant/15">
            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-outline-variant/20 cursor-pointer hover:bg-surface-container-lowest transition-colors">
              <input
                type="checkbox"
                checked={formData.autoConfirmWebBookings}
                onChange={(e) => setFormData({ ...formData, autoConfirmWebBookings: e.target.checked })}
                className="w-4 h-4 text-primary rounded"
              />
              <div>
                <p className="font-bold text-xs text-on-surface">Auto-Confirm Patient Web Bookings</p>
                <p className="text-[11px] text-on-surface-variant">
                  If enabled, online patient bookings will be automatically marked Confirmed. If disabled, bookings stay Pending until reviewed.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-outline-variant/20 cursor-pointer hover:bg-surface-container-lowest transition-colors">
              <input
                type="checkbox"
                checked={formData.allowChairOverbooking}
                onChange={(e) => setFormData({ ...formData, allowChairOverbooking: e.target.checked })}
                className="w-4 h-4 text-primary rounded"
              />
              <div>
                <p className="font-bold text-xs text-on-surface">Allow Chair Overbooking</p>
                <p className="text-[11px] text-on-surface-variant">
                  If enabled, multiple appointments can be scheduled on the same chair. If disabled, chair time conflicts will be prevented.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-outline-variant/15 flex items-center justify-between">
          {savedSuccess ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Appointment settings updated successfully!
            </span>
          ) : <span />}

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
