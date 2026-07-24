"use client";

import React from "react";
import {
  ShieldAlert,
  Heart,
  AlertTriangle,
  Pill,
  Phone,
  Edit2,
  FileText,
  Activity,
  CheckCircle2,
  User,
} from "lucide-react";
import type { Patient, PatientMedicalProfile } from "../../../../lib/types";

interface MedicalHistoryTabProps {
  patient: Patient;
  medicalProfile?: PatientMedicalProfile | null;
  onOpenEditProfile: () => void;
}

export const MedicalHistoryTab: React.FC<MedicalHistoryTabProps> = ({
  patient,
  medicalProfile,
  onOpenEditProfile,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="bg-white p-5 rounded-2xl border border-outline-variant/15 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-on-surface">Patient Medical History & Profile</h2>
            <p className="text-xs text-on-surface-variant">
              Comprehensive record of clinical alerts, allergies, chronic conditions, and emergency contacts.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenEditProfile}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
        >
          <Edit2 className="w-3.5 h-3.5" /> Edit Profile
        </button>
      </div>

      {/* Grid of Modern Medical History Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. Blood Group Card */}
        <div className="bg-white rounded-2xl border border-outline-variant/15 p-5 shadow-sm space-y-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Blood Group
          </span>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center text-lg font-black border border-red-200">
              {medicalProfile?.bloodGroup || patient.bloodType || "—"}
            </div>
            <div>
              <span className="text-xs text-slate-700 font-bold block">
                {medicalProfile?.bloodGroup ? `Type ${medicalProfile.bloodGroup}` : "Not Specified"}
              </span>
              <span className="text-[11px] text-slate-500">Universal compatibility record</span>
            </div>
          </div>
        </div>

        {/* 2. Allergies Card */}
        <div className="bg-white rounded-2xl border border-outline-variant/15 p-5 shadow-sm space-y-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block flex items-center justify-between">
            <span>Allergies</span>
            {medicalProfile?.allergies && (
              <span className="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                Alert Active
              </span>
            )}
          </span>

          {medicalProfile?.allergies ? (
            <div className="p-3 bg-red-50 border border-red-200/80 rounded-xl text-xs text-red-900 font-bold leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-red-600 inline mr-1.5 -mt-0.5" />
              {medicalProfile.allergies}
            </div>
          ) : (
            <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-xl text-xs text-emerald-800 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 inline mr-1.5 -mt-0.5" />
              No known allergies recorded.
            </div>
          )}
        </div>

        {/* 3. Emergency Contact Card */}
        <div className="bg-white rounded-2xl border border-outline-variant/15 p-5 shadow-sm space-y-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Emergency Contact
          </span>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <span className="font-bold text-slate-900 block flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-primary" />
              {medicalProfile?.emergencyContact || "No emergency contact provided"}
            </span>
          </div>
        </div>

        {/* 4. Chronic Diseases Card */}
        <div className="bg-white rounded-2xl border border-outline-variant/15 p-5 shadow-sm space-y-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Chronic Diseases & Systemic Conditions
          </span>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            {medicalProfile?.chronicDiseases && medicalProfile.chronicDiseases !== "None" ? (
              <span className="font-bold text-amber-900 block">
                {medicalProfile.chronicDiseases}
              </span>
            ) : (
              <span className="text-slate-500 italic">No chronic conditions listed.</span>
            )}
          </div>
        </div>

        {/* 5. Medical Conditions Card */}
        <div className="bg-white rounded-2xl border border-outline-variant/15 p-5 shadow-sm space-y-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Dental & Medical History
          </span>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="font-medium text-slate-800 block">
              {medicalProfile?.medicalConditions || "No specific medical conditions logged."}
            </span>
          </div>
        </div>

        {/* 6. Current Medications Card */}
        <div className="bg-white rounded-2xl border border-outline-variant/15 p-5 shadow-sm space-y-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Current Medications
          </span>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-start gap-2">
            <Pill className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span className="font-medium text-slate-800">
              No active systemic medications currently prescribed.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
