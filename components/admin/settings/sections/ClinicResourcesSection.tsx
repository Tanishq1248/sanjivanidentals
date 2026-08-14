"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Armchair, Save, CheckCircle2, Loader2, AlertCircle, ToggleLeft, ToggleRight } from "lucide-react";
import { queryKeys } from "../../../../lib/query/queryKeys";
import {
  getClinicResources,
  saveClinicResources,
  validateClinicResources,
} from "../../../../lib/services/settingsService";
import type { ClinicResourcesData, ChairItem } from "../../../../lib/types";

export default function ClinicResourcesSection() {
  const queryClient = useQueryClient();
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { data: resourcesData, isLoading } = useQuery({
    queryKey: queryKeys.settings.clinicResources,
    queryFn: getClinicResources,
    staleTime: 5 * 60_000,
  });

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
  });

  const handleChairCountChange = (newCount: number) => {
    const clamped = Math.min(4, Math.max(1, newCount));
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
    const validation = validateClinicResources(formData);

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
              <h2 className="text-lg font-bold text-on-surface leading-tight">Clinic Resources</h2>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                Configure the treatment chairs available in your clinic.
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
          <label htmlFor="select-chair-count" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Number of Chairs <span className="text-rose-500">*</span>
          </label>
          <select
            id="select-chair-count"
            value={formData.chairCount}
            onChange={(e) => handleChairCountChange(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1b5e20] focus:border-[#1b5e20] transition-all cursor-pointer shadow-xs"
          >
            <option value={1}>1 Chair</option>
            <option value={2}>2 Chairs</option>
            <option value={3}>3 Chairs</option>
            <option value={4}>4 Chairs</option>
          </select>
          {validationErrors.chairCount && (
            <p className="text-[11px] font-bold text-rose-600">{validationErrors.chairCount}</p>
          )}
          <p className="text-[11px] text-slate-500 font-medium">
            Select total treatment chairs operating in your clinic (Max: 4 chairs).
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
    </div>
  );
}
