"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Stethoscope,
  Calendar,
  Clock,
  User,
  Plus,
  Tag,
  FileText,
  Loader2,
  Check,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type {
  Doctor,
  EncounterStatus,
  PatientEncounter,
} from "../../../../lib/types";

import { useActiveDoctors } from "../../../../lib/hooks/useDoctors";

export interface CreateCasePaperFormData {
  chiefComplaint: string;
  chiefComplaints: string[];
  diagnosis: string;
  treatments: string;
  status: EncounterStatus;
  visitDate: string;
  visitTime: string;
  followUpDate: string;
  notes: string;
  doctorId: string;
  doctorName: string;
  casePaperNumber?: number;
}

interface CreateCasePaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCasePaperFormData, shouldOpenSession: boolean) => Promise<string | void>;
  isSubmitting?: boolean;
  doctors?: Doctor[];
  nextCasePaperNumber: number;
  initialData?: PatientEncounter | null;
}

const COMMON_CHIEF_COMPLAINTS = [
  "Routine Dental Checkup",
  "Toothache / Severe Pain",
  "Bleeding / Swollen Gums",
  "Sensitivity (Hot / Cold)",
  "Cavity / Food Lodgement",
  "Broken / Chipped Tooth",
  "Crown / Bridge Loosening",
  "Missing Teeth / Implant Consultation",
  "Orthodontic / Alignment Review",
  "Stained / Discolored Teeth",
  "Wisdom Tooth Impaction",
  "Mouth Ulcer / Soft Tissue Lesion",
];

const COMMON_DIAGNOSES = [
  "Deep Dental Caries",
  "Acute Apical Periodontitis",
  "Chronic Marginal Gingivitis",
  "Irreversible Pulpitis",
  "Impacted Mandibular Third Molar",
  "Enamel Wear / Dental Erosion",
  "Fractured Ceramic Restoration",
  "Generalized Periodontitis",
  "Malocclusion Class I/II",
  "Routine Dental Prophylaxis Required",
];

export const CreateCasePaperModal: React.FC<CreateCasePaperModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  doctors = [],
  nextCasePaperNumber,
  initialData = null,
}) => {
  const { doctors: activeDoctors = [] } = useActiveDoctors();
  const availableDoctors = doctors && doctors.length > 0 ? doctors : activeDoctors;

  const isEditing = !!initialData;
  const displayNumber = isEditing
    ? initialData.casePaperNumber || nextCasePaperNumber
    : nextCasePaperNumber;

  const [formData, setFormData] = useState<CreateCasePaperFormData>({
    chiefComplaint: "",
    chiefComplaints: [],
    diagnosis: "",
    treatments: "",
    status: "In Progress",
    visitDate: new Date().toISOString().split("T")[0],
    visitTime: new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
    followUpDate: "",
    notes: "",
    doctorId: availableDoctors[0]?.id || "tm-1",
    doctorName: availableDoctors[0]?.fullName || "Dr. Rajesh Sharma",
    casePaperNumber: displayNumber,
  });

  const [customTagInput, setCustomTagInput] = useState("");
  const [showCustomTagInput, setShowCustomTagInput] = useState(false);

  useEffect(() => {
    if (initialData) {
      const parsedComplaints =
        initialData.chiefComplaints && initialData.chiefComplaints.length > 0
          ? initialData.chiefComplaints
          : initialData.chiefComplaint
          ? initialData.chiefComplaint.split(",").map((s) => s.trim()).filter(Boolean)
          : [];

      setFormData({
        chiefComplaint: initialData.chiefComplaint || "",
        chiefComplaints: parsedComplaints,
        diagnosis: initialData.diagnosis || "",
        treatments: (initialData.treatments || []).join(", "),
        status: initialData.status || "In Progress",
        visitDate: initialData.visitDate || new Date().toISOString().split("T")[0],
        visitTime:
          initialData.visitTime ||
          new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
        followUpDate: initialData.followUpDate || "",
        notes: initialData.notes || "",
        doctorId: initialData.doctorId || availableDoctors[0]?.id || "tm-1",
        doctorName: initialData.doctorName || availableDoctors[0]?.fullName || "Dr. Rajesh Sharma",
        casePaperNumber: initialData.casePaperNumber || displayNumber,
      });
    } else {
      setFormData({
        chiefComplaint: "",
        chiefComplaints: [],
        diagnosis: "",
        treatments: "",
        status: "In Progress",
        visitDate: new Date().toISOString().split("T")[0],
        visitTime: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        followUpDate: "",
        notes: "",
        doctorId: availableDoctors[0]?.id || "tm-1",
        doctorName: availableDoctors[0]?.fullName || "Dr. Rajesh Sharma",
        casePaperNumber: displayNumber,
      });
    }
  }, [initialData, availableDoctors, displayNumber, isOpen]);

  if (!isOpen) return null;

  const toggleComplaintTag = (tag: string) => {
    setFormData((prev) => {
      const exists = prev.chiefComplaints.includes(tag);
      const updated = exists
        ? prev.chiefComplaints.filter((t) => t !== tag)
        : [...prev.chiefComplaints, tag];

      return {
        ...prev,
        chiefComplaints: updated,
        chiefComplaint: updated.join(", "),
      };
    });
  };

  const handleAddCustomTag = () => {
    if (!customTagInput.trim()) return;
    const tag = customTagInput.trim();
    if (!formData.chiefComplaints.includes(tag)) {
      setFormData((prev) => {
        const updated = [...prev.chiefComplaints, tag];
        return {
          ...prev,
          chiefComplaints: updated,
          chiefComplaint: updated.join(", "),
        };
      });
    }
    setCustomTagInput("");
    setShowCustomTagInput(false);
  };

  const handleDoctorChange = (doctorId: string) => {
    const doc = doctors.find((d) => d.id === doctorId);
    setFormData((prev) => ({
      ...prev,
      doctorId,
      doctorName: doc ? doc.fullName : prev.doctorName,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent, shouldOpenSession: boolean) => {
    e.preventDefault();
    if (formData.chiefComplaints.length === 0 && !formData.chiefComplaint.trim()) {
      return;
    }
    const finalComplaint =
      formData.chiefComplaints.length > 0
        ? formData.chiefComplaints.join(", ")
        : formData.chiefComplaint;

    await onSubmit(
      {
        ...formData,
        chiefComplaint: finalComplaint,
        casePaperNumber: displayNumber,
      },
      shouldOpenSession
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-outline-variant/20 overflow-hidden flex flex-col max-h-[92vh] z-10">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl border border-primary/20 shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 font-sans">
                  {isEditing
                    ? `Edit Case Paper • #${displayNumber}`
                    : `Create New Case Paper • #${displayNumber}`}
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Session #{displayNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {isEditing
                  ? "Update session clinical metadata and treating doctor details."
                  : "Initialize a new clinical encounter and open the clinical workspace."}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form
          id="case-paper-form"
          onSubmit={(e) => handleFormSubmit(e, true)}
          className="p-6 overflow-y-auto space-y-5 flex-1 text-xs"
        >
          {/* 1. Chief Complaints (Interactive Tag Input) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Chief Complaints *
              </label>
              <span className="text-[11px] text-slate-400">
                {formData.chiefComplaints.length} selected
              </span>
            </div>

            {/* Selected Tags Display */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[50px] flex flex-wrap items-center gap-1.5">
              {formData.chiefComplaints.length === 0 && (
                <span className="text-slate-400 italic text-[11px]">
                  Select from suggested symptoms below or add custom complaint...
                </span>
              )}
              {formData.chiefComplaints.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-800 border border-red-200 text-xs font-semibold shadow-2xs"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => toggleComplaintTag(tag)}
                    className="hover:text-red-950 p-0.5 rounded-full hover:bg-red-100 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {showCustomTagInput ? (
                <div className="inline-flex items-center gap-1 bg-white border border-primary rounded-full px-2 py-0.5">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter symptom..."
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomTag();
                      }
                      if (e.key === "Escape") setShowCustomTagInput(false);
                    }}
                    className="text-xs outline-none w-36 px-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    className="text-primary font-bold hover:text-primary/80"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCustomTagInput(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold border border-dashed border-slate-300 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Custom Tag
                </button>
              )}
            </div>

            {/* Quick Suggestions Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">
                Suggestions:
              </span>
              {COMMON_CHIEF_COMPLAINTS.map((item) => {
                const isSelected = formData.chiefComplaints.includes(item);
                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => toggleComplaintTag(item)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer border ${
                      isSelected
                        ? "bg-red-500 text-white border-red-600 font-bold"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {isSelected ? "✓ " : "+ "}
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Diagnosis */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="enc-diagnosis"
                className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5 text-primary" />
                Clinical Diagnosis / Impression
              </label>
            </div>
            <input
              id="enc-diagnosis"
              type="text"
              list="diagnosis-suggestions"
              value={formData.diagnosis}
              onChange={(e) =>
                setFormData({ ...formData, diagnosis: e.target.value })
              }
              placeholder="e.g. Deep dental caries with pulpal involvement, Tooth #14"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs"
            />
            <datalist id="diagnosis-suggestions">
              {COMMON_DIAGNOSES.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>

          {/* 3. Visit Date & Visit Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="enc-date"
                className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5"
              >
                Visit Date *
              </label>
              <div className="relative">
                <input
                  id="enc-date"
                  type="date"
                  required
                  value={formData.visitDate}
                  onChange={(e) =>
                    setFormData({ ...formData, visitDate: e.target.value })
                  }
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label
                htmlFor="enc-time"
                className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5"
              >
                Visit Time
              </label>
              <div className="relative">
                <input
                  id="enc-time"
                  type="text"
                  value={formData.visitTime}
                  onChange={(e) =>
                    setFormData({ ...formData, visitTime: e.target.value })
                  }
                  placeholder="e.g. 04:30 PM"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 4. Assigned Doctor & Visit Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="enc-doctor"
                className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5"
              >
                Assigned Treating Doctor *
              </label>
              <div className="relative">
                <select
                  id="enc-doctor"
                  value={formData.doctorId}
                  onChange={(e) => handleDoctorChange(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs cursor-pointer"
                >
                  {availableDoctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} ({d.specialization || "General Dentistry"})
                    </option>
                  ))}
                  {availableDoctors.length === 0 && (
                    <option value="tm-1">
                      Dr. Rajesh Sharma (Oral &amp; Maxillofacial Surgery)
                    </option>
                  )}
                </select>
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label
                htmlFor="enc-status"
                className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5"
              >
                Session Status
              </label>
              <select
                id="enc-status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as EncounterStatus,
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs cursor-pointer"
              >
                <option value="In Progress">In Progress (Active Session)</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending / Planned</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* 5. Follow-Up Date */}
          <div>
            <label
              htmlFor="enc-followup"
              className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5"
            >
              Follow-up Date (Optional)
            </label>
            <div className="relative">
              <input
                id="enc-followup"
                type="date"
                value={formData.followUpDate}
                onChange={(e) =>
                  setFormData({ ...formData, followUpDate: e.target.value })
                }
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* 6. Initial Clinical Notes */}
          <div>
            <label
              htmlFor="enc-notes"
              className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5"
            >
              Initial Clinical Notes / Observations (SOAP)
            </label>
            <textarea
              id="enc-notes"
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Enter initial clinical observations, oral hygiene state, or specific pre-op instructions..."
              className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs resize-y"
            />
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {isEditing ? (
              <button
                type="button"
                onClick={(e) => handleFormSubmit(e, false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Save Changes</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={(e) => handleFormSubmit(e, false)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  Save Record Only
                </button>

                <button
                  type="button"
                  onClick={(e) => handleFormSubmit(e, true)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Create & Open Case Paper</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
