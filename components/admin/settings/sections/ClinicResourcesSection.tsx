"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Armchair,
  Save,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Lock,
  Sparkles,
} from "lucide-react";
import { queryKeys, CACHE_POLICIES } from "../../../../lib/query/queryKeys";
import {
  getClinicResources,
  saveClinicResources,
  validateClinicResources,
  getClinicInfo,
} from "../../../../lib/services/settingsService";
import {
  getSubscription,
  getMaximumChairs,
  FeatureAccessService,
} from "../../../../lib/services/featureAccessService";
import type { ClinicResourcesData, ChairItem } from "../../../../lib/types";
import { UpgradeToProModal } from "../UpgradeToProModal";

export default function ClinicResourcesSection() {
  const queryClient = useQueryClient();
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const { data: clinicInfo } = useQuery({
    queryKey: queryKeys.settings.clinicInfo,
    queryFn: getClinicInfo,
    ...CACHE_POLICIES.STATIC_METADATA,
  });

  const { data: resourcesData, isLoading } = useQuery({
    queryKey: queryKeys.settings.clinicResources,
    queryFn: getClinicResources,
    ...CACHE_POLICIES.STATIC_METADATA,
  });

  const subscription = getSubscription(clinicInfo);
  const isBasicPlan = subscription.plan === "basic";
  const maxChairs = getMaximumChairs(clinicInfo);

  const [formData, setFormData] = useState<ClinicResourcesData>({
    chairCount: 1,
    chairs: [{ id: "chair-1", name: "Chair 1", active: true }],
  });

  useEffect(() => {
    if (resourcesData) {
      setFormData(resourcesData);
    }
  }, [resourcesData]);

  const updateMutation = useMutation({
    mutationFn: (data: ClinicResourcesData) => saveClinicResources(data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.clinicResources });
      setFormData(updated);
      setSavedSuccess(true);
      setValidationErrors({});
      setTimeout(() => setSavedSuccess(false), 3000);
    },
    onError: (err: any) => {
      setValidationErrors({ server: err?.message || "Failed to save resources" });
    },
  });

  const handleChairCountChange = (newCount: number) => {
    if (newCount > maxChairs) {
      setIsUpgradeModalOpen(true);
      return;
    }

    const clamped = Math.min(maxChairs, Math.max(1, newCount));
    const currentChairs = [...formData.chairs];

    let newChairs: ChairItem[] = [];
    if (currentChairs.length >= clamped) {
      newChairs = currentChairs.slice(0, clamped);
    } else {
      newChairs = [...currentChairs];
      while (newChairs.length < clamped) {
        const idx = newChairs.length + 1;
        newChairs.push({
          id: `chair-${idx}`,
          name: `Chair ${idx}`,
          active: true,
        });
      }
    }

    setFormData({
      ...formData,
      chairCount: clamped,
      chairs: newChairs,
    });
    setValidationErrors({});
  };

  const handleChairNameChange = (index: number, name: string) => {
    const updatedChairs = formData.chairs.map((chair, idx) =>
      idx === index ? { ...chair, name } : chair
    );
    setFormData({ ...formData, chairs: updatedChairs });

    // Clear specific chair validation error
    if (validationErrors[`chair_${index}`]) {
      const nextErrors = { ...validationErrors };
      delete nextErrors[`chair_${index}`];
      setValidationErrors(nextErrors);
    }
  };

  const handleChairToggleActive = (index: number) => {
    const updatedChairs = formData.chairs.map((chair, idx) =>
      idx === index ? { ...chair, active: !chair.active } : chair
    );
    setFormData({ ...formData, chairs: updatedChairs });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateClinicResources(formData, maxChairs);

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setSavedSuccess(false);
      return;
    }

    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3" />
        <div className="h-4 bg-slate-100 rounded w-1/2" />
        <div className="h-20 bg-slate-50 rounded-xl mt-4" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/15 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Armchair className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-lg font-bold text-on-surface leading-tight">Clinic Resources</h2>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                    isBasicPlan
                      ? "bg-amber-50 text-amber-900 border-amber-300"
                      : "bg-emerald-50 text-emerald-900 border-emerald-300"
                  }`}
                >
                  {isBasicPlan ? "Basic Plan (2 Chairs Max)" : "Pro Plan (Up to 10 Chairs)"}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-medium">
                Configure the treatment chairs and operatory stations operating in your clinic.
              </p>
            </div>
          </div>

          {savedSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Clinic resources saved successfully!</span>
            </div>
          )}
        </div>

        {/* Basic Plan Upgrade Callout Banner */}
        {isBasicPlan && (
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <span>Basic Plan Limit: 2 Treatment Chairs</span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-200 text-amber-950 font-extrabold">
                    2/2 Configured
                  </span>
                </p>
                <p className="text-[11px] text-amber-800/90 mt-0.5">
                  Adding a 3rd chair or operatory is locked on the Basic Plan. Upgrade to Professional to manage up to 10 chairs.
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

        {/* Global Validation Banner */}
        {Object.keys(validationErrors).length > 0 && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Please fix the following validation errors before saving:</span>
              <ul className="list-disc list-inside space-y-0.5">
                {Object.values(validationErrors).map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Field 1: Number of Chairs Dropdown */}
        <div className="space-y-2 max-w-sm">
          <div className="flex items-center justify-between">
            <label htmlFor="select-chair-count" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Number of Chairs <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] font-bold text-slate-500 font-mono">
              Max: {maxChairs} Chairs
            </span>
          </div>
          <select
            id="select-chair-count"
            value={formData.chairCount}
            onChange={(e) => handleChairCountChange(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1b5e20] focus:border-[#1b5e20] transition-all cursor-pointer shadow-xs"
          >
            <option value={1}>1 Chair</option>
            <option value={2}>2 Chairs</option>
            <option value={3} disabled={isBasicPlan}>
              3 Chairs {isBasicPlan ? "— (🔒 Locked: Pro Feature)" : ""}
            </option>
            <option value={4} disabled={isBasicPlan}>
              4 Chairs {isBasicPlan ? "— (🔒 Locked: Pro Feature)" : ""}
            </option>
            <option value={5} disabled={isBasicPlan}>
              5 Chairs {isBasicPlan ? "— (🔒 Locked: Pro Feature)" : ""}
            </option>
            <option value={6} disabled={isBasicPlan}>
              6 Chairs {isBasicPlan ? "— (🔒 Locked: Pro Feature)" : ""}
            </option>
            <option value={8} disabled={isBasicPlan}>
              8 Chairs {isBasicPlan ? "— (🔒 Locked: Pro Feature)" : ""}
            </option>
            <option value={10} disabled={isBasicPlan}>
              10 Chairs {isBasicPlan ? "— (🔒 Locked: Pro Feature)" : ""}
            </option>
          </select>
          {validationErrors.chairCount && (
            <p className="text-[11px] font-bold text-rose-600">{validationErrors.chairCount}</p>
          )}
          <p className="text-[11px] text-slate-500 font-medium">
            {isBasicPlan
              ? "Basic Plan includes up to 2 treatment chairs. Upgrade to Professional for up to 10 chairs."
              : "Select total treatment chairs operating in your clinic (Max: 10 chairs)."}
          </p>
        </div>

        {/* Field 2 & 3: Chair List Inputs & Active/Inactive Toggles */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Treatment Chairs Configuration
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono">
              {formData.chairs.filter((c) => c.active).length} of {formData.chairCount} Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.chairs.map((chair, index) => {
              const errorKey = `chair_${index}`;
              const hasError = Boolean(validationErrors[errorKey]);

              return (
                <div
                  key={chair.id || `chair-${index}`}
                  className={`p-4 rounded-xl border transition-all space-y-3 ${
                    chair.active
                      ? "bg-slate-50/70 border-slate-200/80 hover:border-slate-300"
                      : "bg-slate-100/50 border-slate-200 opacity-80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px]">
                        #{index + 1}
                      </span>
                      Chair {index + 1}
                    </span>

                    {/* Active / Inactive Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleChairToggleActive(index)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer select-none ${
                        chair.active
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300"
                      }`}
                      title={chair.active ? "Click to deactivate chair" : "Click to activate chair"}
                    >
                      {chair.active ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-emerald-600" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-slate-500" />
                          <span>Inactive</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Editable Chair Name Input */}
                  <div>
                    <label htmlFor={`chair-name-${index}`} className="block text-[11px] font-bold text-slate-600 mb-1">
                      Chair Label / Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id={`chair-name-${index}`}
                      type="text"
                      value={chair.name}
                      onChange={(e) => handleChairNameChange(index, e.target.value)}
                      placeholder={`e.g. Chair ${index + 1}`}
                      className={`w-full px-3.5 py-2 rounded-lg border text-xs font-bold transition-all ${
                        hasError
                          ? "border-rose-400 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500"
                          : "border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-[#1b5e20] focus:border-[#1b5e20]"
                      }`}
                    />
                    {hasError && (
                      <p className="text-[10px] font-bold text-rose-600 mt-1">{validationErrors[errorKey]}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-5 py-2.5 rounded-xl bg-[#1b5e20] text-white text-xs font-bold hover:bg-[#123f15] transition-all cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Resources...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Resources</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Pro Upgrade Modal */}
      <UpgradeToProModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        highlightFeature="Treatment Chairs & Clinic Resources"
        currentPlan={subscription.plan}
      />
    </div>
  );
}
