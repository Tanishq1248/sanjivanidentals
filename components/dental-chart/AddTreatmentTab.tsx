"use client";

import React, { useState } from "react";
import type { ToothNumber } from "./types";
import { Loader2 } from "lucide-react";
import { useDentalChartStore } from "../../lib/store/useDentalChartStore";

interface AddTreatmentTabProps {
  toothNumber: ToothNumber;
  onSaveTreatment: (
    toothNumber: number,
    treatmentData: {
      treatmentName: string;
      status: string;
      fee: number;
      notes?: string;
    }
  ) => Promise<void>;
  isSaving: boolean;
  onSuccess?: () => void;
}

const TREATMENTS_LIST = [
  "Crown / Cap",
  "Composite Filling",
  "Root Canal Treatment",
  "Tooth Extraction",
  "Scaling & Polishing",
  "Bridge Placement",
  "Dental Implant",
  "Dentures",
  "Orthodontic Adjustment",
  "Fluoride Application",
  "Cavity Treatment",
];

const DEFAULT_FEE_MAP: Record<string, number> = {
  "Crown / Cap": 5000,
  "Composite Filling": 1500,
  "Root Canal Treatment": 4500,
  "Tooth Extraction": 1000,
  "Scaling & Polishing": 1200,
  "Bridge Placement": 15000,
  "Dental Implant": 35000,
  "Dentures": 12000,
  "Orthodontic Adjustment": 3000,
  "Fluoride Application": 800,
  "Cavity Treatment": 1000,
};

export function AddTreatmentTab({ toothNumber, onSaveTreatment, isSaving, onSuccess }: AddTreatmentTabProps) {
  const [treatment, setTreatment] = useState("");
  const [status, setStatus] = useState("Completed");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [fee, setFee] = useState("");
  const [notes, setNotes] = useState("");

  const handleTreatmentChange = (selected: string) => {
    setTreatment(selected);
    const defaultFee = DEFAULT_FEE_MAP[selected] || 0;
    setFee(defaultFee > 0 ? defaultFee.toString() : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!treatment || !status || isSaving) return;

    const parsedFee = parseFloat(fee) || 0;

    const payload = {
      treatmentName: treatment,
      status,
      fee: parsedFee,
      notes: notes.trim() || undefined,
    };

    try {
      await onSaveTreatment(toothNumber, payload);
      
      // Reset form
      setTreatment("");
      setFee("");
      setNotes("");

      // Switch active tab in store
      const store = useDentalChartStore.getState();
      if (status === "Planned") {
        store.setActiveTab("plan");
      } else {
        store.setActiveTab("history");
      }
      
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Failed to save treatment:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Add Treatment</h3>
      
      {/* Treatment Dropdown */}
      <div>
        <label htmlFor="select-treatment" className="block text-xs font-bold text-slate-600 mb-1">
          Treatment <span className="text-red-500">*</span>
        </label>
        <select
          id="select-treatment"
          required
          disabled={isSaving}
          value={treatment}
          onChange={(e) => handleTreatmentChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1b5e20] focus:border-[#1b5e20] transition-colors disabled:opacity-50"
        >
          <option value="">Select treatment</option>
          {TREATMENTS_LIST.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Status Dropdown */}
      <div>
        <label htmlFor="select-status" className="block text-xs font-bold text-slate-600 mb-1">
          Status <span className="text-red-500">*</span>
        </label>
        <select
          id="select-status"
          required
          disabled={isSaving}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1b5e20] focus:border-[#1b5e20] transition-colors disabled:opacity-50"
        >
          <option value="Completed">Completed</option>
          <option value="In Progress">In Progress</option>
          <option value="Planned">Planned</option>
        </select>
      </div>

      {/* Date Input */}
      <div>
        <label htmlFor="input-date" className="block text-xs font-bold text-slate-600 mb-1">
          Date <span className="text-red-500">*</span>
        </label>
        <input
          id="input-date"
          type="date"
          required
          disabled={isSaving}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1b5e20] focus:border-[#1b5e20] transition-colors disabled:opacity-50"
        />
      </div>

      {/* Fee Input */}
      <div>
        <label htmlFor="input-fee" className="block text-xs font-bold text-slate-600 mb-1">
          Fee (₹)
        </label>
        <input
          id="input-fee"
          type="number"
          min="0"
          disabled={isSaving}
          placeholder="Enter fee"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1b5e20] focus:border-[#1b5e20] transition-colors disabled:opacity-50"
        />
      </div>

      {/* Notes Textarea */}
      <div>
        <label htmlFor="textarea-notes" className="block text-xs font-bold text-slate-600 mb-1">
          Notes
        </label>
        <textarea
          id="textarea-notes"
          rows={3}
          disabled={isSaving}
          placeholder="Enter notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1b5e20] focus:border-[#1b5e20] transition-colors resize-none disabled:opacity-50"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSaving}
        className="w-full py-2 bg-[#1b5e20] hover:bg-[#123f15] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
      >
        {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {isSaving ? "Saving..." : "Save Treatment"}
      </button>
    </form>
  );
}
