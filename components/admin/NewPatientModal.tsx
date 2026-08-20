"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, UserPlus, Phone, Mail, MapPin, Stethoscope, Loader2, FileText, CheckCircle2 } from "lucide-react";
import { addPatient } from "../../lib/services/patientService";
import type { PatientFormData, Patient } from "../../lib/types";
import { REFERRAL_SOURCES } from "../../lib/types";
import { queryKeys } from "../../lib/query/queryKeys";

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  isWalkIn?: boolean;
  onSuccess?: (patientId: string) => void;
}

export function NewPatientModal({
  isOpen,
  onClose,
  isWalkIn = false,
  onSuccess,
}: NewPatientModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<PatientFormData>({
    name: "",
    phone: "",
    email: "",
    age: "",
    gender: "Male",
    condition: "",
    diseases: "",
    allergies: "",
    address: "",
    notes: "",
    lastVisit: new Date().toISOString().split("T")[0],
    referralSource: "Walk-in",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (data: PatientFormData) => addPatient(data),
    onSuccess: (newPatientId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      onClose();
      if (onSuccess) onSuccess(newPatientId);

      if (isWalkIn) {
        // Direct to Case Paper session
        router.push(`/admin/patients/${newPatientId}?tab=case-paper`);
      }
    },
  });

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Patient Name is required";
    if (!formData.phone.trim()) errs.phone = "Phone number is required";
    else if (formData.phone.replace(/\D/g, "").length < 10) errs.phone = "Enter a valid 10-digit phone number";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden font-sans">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              {isWalkIn ? <FileText className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isWalkIn ? "Walk-in Patient Registration" : "Register New Patient"}
              </h2>
              <p className="text-xs text-slate-300">
                {isWalkIn ? "Quick registration + immediate Case Paper session" : "Add patient to clinic registry"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ramesh Kumar"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  errors.name ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
                }`}
              />
              {errors.name && <p className="text-[11px] text-rose-600 mt-1">{errors.name}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 9876543210"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-slate-900 font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  errors.phone ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
                }`}
              />
              {errors.phone && <p className="text-[11px] text-rose-600 mt-1">{errors.phone}</p>}
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="32"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={formData.gender || "Male"}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-2 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Chief Complaint / Condition */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primary Dental Concern / Chief Complaint
              </label>
              <input
                type="text"
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                placeholder="e.g. Severe toothache upper right molar, bleeding gums"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Medical Alerts / Allergies */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Known Drug Allergies
              </label>
              <input
                type="text"
                value={formData.allergies || ""}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="e.g. Penicillin, Sulfa, None"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Referral Source */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Referral Source
              </label>
              <select
                value={formData.referralSource || "Walk-in"}
                onChange={(e) => setFormData({ ...formData, referralSource: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {REFERRAL_SOURCES.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {isWalkIn ? "Register & Start Case Paper" : "Save Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
