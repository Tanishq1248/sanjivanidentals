"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Save,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Lock,
  Sparkles,
  Sliders,
  Clock,
  Armchair,
} from "lucide-react";
import { queryKeys, CACHE_POLICIES } from "../../../../lib/query/queryKeys";
import {
  getAppointmentSettings,
  createOrUpdateAppointmentSettings,
  validateAppointmentSettings,
  getClinicInfo,
} from "../../../../lib/services/settingsService";
import {
  getSubscription,
  canUseAdvancedAppointmentRules,
  FeatureAccessService,
} from "../../../../lib/services/featureAccessService";
import type { AppointmentSettingsData } from "../../../../lib/types";
import { UpgradeToProModal } from "../UpgradeToProModal";

export default function AppointmentSettingsSection() {
  const queryClient = useQueryClient();
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const { data: clinicInfo } = useQuery({
    queryKey: queryKeys.settings.clinicInfo,
    queryFn: getClinicInfo,
    ...CACHE_POLICIES.STATIC_METADATA,
  });

  const { data: settingsData } = useQuery({
    queryKey: queryKeys.settings.appointmentSettings,
    queryFn: getAppointmentSettings,
    ...CACHE_POLICIES.STATIC_METADATA,
  });

  const subscription = getSubscription(clinicInfo);
  const isBasicPlan = subscription.plan === "basic";
  const hasAdvancedRules = canUseAdvancedAppointmentRules(clinicInfo);

  const [formData, setFormData] = useState<AppointmentSettingsData>({
    defaultSlotDurationMinutes: 30,
    bufferTimeMinutes: 0,
    autoConfirmWebBookings: true,
    allowChairOverbooking: false,
    chairRulesEnabled: false,
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

  const handleLockedFeatureClick = (featureName: string) => {
    setIsUpgradeModalOpen(true);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary">
              Appointments
            </span>
            <span
              className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                isBasicPlan
                  ? "bg-amber-50 text-amber-900 border-amber-300"
                  : "bg-emerald-50 text-emerald-900 border-emerald-300"
              }`}
            >
              {isBasicPlan ? "Basic Plan (Standard Scheduling)" : "Professional Plan (Advanced Rules)"}
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Appointment &amp; Schedule Settings
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Configure default slot intervals, automated buffer timings, web booking rules, and chair overbooking policies.
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
                🔒 Advanced Scheduling Rules Locked
              </p>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                Chair-specific scheduling rules, automated buffer times, and overbooking prevention require the{" "}
                <strong>Professional Plan</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsUpgradeModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 self-end sm:self-center"
          >
            <Sparkles className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span>Unlock Advanced Rules</span>
          </button>
        </div>
      )}

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
          {/* Default Slot Duration (Available on all plans) */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5 flex items-center justify-between">
              <span>Default Slot Duration</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Standard</span>
            </label>
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
            <p className="text-[11px] text-on-surface-variant mt-1">
              Standard interval for general consultations & checkups.
            </p>
          </div>

          {/* Buffer Time (Paywalled for Pro Plan) */}
          <div className="relative">
            <label className="block text-xs font-bold text-on-surface mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>Automated Buffer Time</span>
                {!hasAdvancedRules && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 rounded">
                    <Lock className="w-2.5 h-2.5" /> PRO
                  </span>
                )}
              </span>
            </label>

            {hasAdvancedRules ? (
              <select
                value={formData.bufferTimeMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, bufferTimeMinutes: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
              >
                <option value={0}>No Buffer</option>
                <option value={5}>5 Minutes</option>
                <option value={10}>10 Minutes (Recommended)</option>
                <option value={15}>15 Minutes</option>
              </select>
            ) : (
              <div
                onClick={() => handleLockedFeatureClick("Automated Buffer Times")}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-500 flex items-center justify-between cursor-pointer hover:border-amber-300"
              >
                <span>No Buffer (Locked on Basic)</span>
                <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Upgrade
                </span>
              </div>
            )}
            <p className="text-[11px] text-on-surface-variant mt-1">
              Automated resting and sterilization interval inserted between slots.
            </p>
          </div>

          {/* Web Booking Confirmation (Available on all plans) */}
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

            {/* Overbooking Prevention (Paywalled for Pro Plan) */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                hasAdvancedRules
                  ? "border-outline-variant/20 hover:bg-surface-container-lowest"
                  : "border-slate-200 bg-slate-50/70"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <label className="flex items-start gap-3 cursor-pointer flex-1 min-w-0">
                  <input
                    type="checkbox"
                    disabled={!hasAdvancedRules}
                    checked={hasAdvancedRules ? formData.allowChairOverbooking : false}
                    onChange={(e) =>
                      hasAdvancedRules &&
                      setFormData({ ...formData, allowChairOverbooking: e.target.checked })
                    }
                    className="w-4 h-4 text-primary rounded mt-0.5 disabled:opacity-40"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-xs text-on-surface">Allow Chair Overbooking Prevention</p>
                      {!hasAdvancedRules && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 rounded">
                          <Lock className="w-2.5 h-2.5" /> PRO
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      {hasAdvancedRules
                        ? "If enabled, chair time conflicts and simultaneous double-booking on the same operatory are automatically prevented."
                        : "Conflict detection and strict operatory overbooking guards require the Professional Plan."}
                    </p>
                  </div>
                </label>

                {!hasAdvancedRules && (
                  <button
                    type="button"
                    onClick={() => handleLockedFeatureClick("Overbooking Prevention")}
                    className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 shrink-0 cursor-pointer pt-0.5"
                  >
                    <Lock className="w-3.5 h-3.5" /> Upgrade
                  </button>
                )}
              </div>
            </div>

            {/* Chair-Specific Scheduling Rules (Paywalled for Pro Plan) */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                hasAdvancedRules
                  ? "border-outline-variant/20 hover:bg-surface-container-lowest"
                  : "border-slate-200 bg-slate-50/70"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Armchair className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-xs text-on-surface">Chair-Specific Scheduling Rules</p>
                      {!hasAdvancedRules && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 rounded">
                          <Lock className="w-2.5 h-2.5" /> PRO
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      {hasAdvancedRules
                        ? "Assign dedicated operating hours, doctor reservations, and specialized procedure types to specific treatment chairs."
                        : "Dedicated chair reservations and per-operatory hours are exclusive to Professional Plan."}
                    </p>
                  </div>
                </div>

                {!hasAdvancedRules ? (
                  <button
                    type="button"
                    onClick={() => handleLockedFeatureClick("Chair-Specific Scheduling Rules")}
                    className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 shrink-0 cursor-pointer pt-0.5"
                  >
                    <Lock className="w-3.5 h-3.5" /> Upgrade
                  </button>
                ) : (
                  <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Active
                  </span>
                )}
              </div>
            </div>
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

      {/* Pro Upgrade Modal */}
      <UpgradeToProModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        highlightFeature="Advanced Appointment Rules & Chair Scheduling"
        currentPlan={subscription.plan}
      />
    </div>
  );
}
