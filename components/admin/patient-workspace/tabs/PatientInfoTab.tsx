"use client";

import React from "react";
import Link from "next/link";
import {
  User,
  Heart,
  Phone,
  Mail,
  MapPin,
  ShieldAlert,
  AlertTriangle,
  Pill,
  Edit2,
  CheckCircle2,
  Calendar,
  Users,
  Activity,
  FileText,
} from "lucide-react";
import type { Patient, PatientMedicalProfile } from "../../../../lib/types";

interface PatientInfoTabProps {
  patient: Patient;
  medicalProfile?: PatientMedicalProfile | null;
  referrer?: Patient | null;
  referredPatients?: Patient[];
  onOpenEditProfile: () => void;
}

export const PatientInfoTab: React.FC<PatientInfoTabProps> = ({
  patient,
  medicalProfile,
  referrer,
  referredPatients = [],
  onOpenEditProfile,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── 1. Header Toolbar ── */}
      <div className="bg-white p-5 rounded-2xl border border-outline-variant/15 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-on-surface">
              Patient Demographic & Clinical Profile
            </h2>
            <p className="text-xs text-on-surface-variant">
              Consolidated medical history, allergy alerts, personal information, emergency contacts, and referrals.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenEditProfile}
          className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-98"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Details</span>
        </button>
      </div>

      {/* ── 2. Prominent Medical Allergy Banner (If allergies present) ── */}
      {medicalProfile?.allergies && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3 shadow-2xs">
          <div className="p-2 bg-red-100 rounded-xl text-red-700 shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-red-900 uppercase tracking-wider">
                Critical Medical Allergy Alert
              </h3>
              <span className="px-2 py-0.2 bg-red-600 text-white text-[10px] font-black rounded-full uppercase">
                High Caution
              </span>
            </div>
            <p className="text-sm font-bold text-red-950 mt-1 leading-snug">
              {medicalProfile.allergies}
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              Verify dental anesthetics, antibiotics, and analgesics compatibility before administering treatments.
            </p>
          </div>
        </div>
      )}

      {/* ── 3. Profile Information Cards Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Personal Demographics */}
        <div className="bg-white rounded-2xl border border-outline-variant/15 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2 font-sans">
              <User className="w-4 h-4 text-primary" />
              Personal Demographics
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Full Name</span>
              <span className="font-bold text-slate-900 text-sm block">{patient.name}</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Age</span>
                <span className="font-bold text-slate-900 block">{patient.age ? `${patient.age} Years` : "—"}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Gender</span>
                <span className="font-bold text-slate-900 block">{patient.gender || "—"}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Patient ID</span>
              <span className="font-mono font-bold text-slate-800 block">#{patient.id}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Residential Address</span>
              <span className="font-medium text-slate-800 flex items-start gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>{patient.address || "No residential address provided."}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: Medical History & Clinical Profile */}
        <div className="bg-white rounded-2xl border border-outline-variant/15 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2 font-sans">
              <Heart className="w-4 h-4 text-red-500" />
              Medical & Clinical Profile
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            {/* Blood Group */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Blood Group</span>
                <span className="font-bold text-slate-900 text-sm">
                  {medicalProfile?.bloodGroup || patient.bloodType || "Not Specified"}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-black text-xs border border-red-200">
                {medicalProfile?.bloodGroup || patient.bloodType || "?"}
              </div>
            </div>

            {/* Chronic Conditions */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Chronic Diseases & Conditions
              </span>
              {medicalProfile?.chronicDiseases && medicalProfile.chronicDiseases !== "None" ? (
                <span className="font-bold text-amber-900 block leading-relaxed">
                  {medicalProfile.chronicDiseases}
                </span>
              ) : (
                <span className="text-slate-400 italic">No chronic systemic conditions recorded.</span>
              )}
            </div>

            {/* Medical History */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Dental & Medical History
              </span>
              <span className="font-medium text-slate-800 block leading-relaxed">
                {medicalProfile?.medicalConditions || "No prior dental/medical history logged."}
              </span>
            </div>

            {/* Current Medications */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Active Medications
              </span>
              <div className="flex items-start gap-1.5 text-slate-700">
                <Pill className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span className="font-medium">
                  {medicalProfile?.clinicalNotes?.includes("Medication")
                    ? medicalProfile.clinicalNotes
                    : "No systemic medications active."}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Contact Details & Referral Network */}
        <div className="bg-white rounded-2xl border border-outline-variant/15 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2 font-sans">
              <Phone className="w-4 h-4 text-emerald-600" />
              Contact & Referral Info
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            {/* Primary Phone */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Primary Mobile Phone</span>
              <a href={`tel:${patient.phone}`} className="font-bold text-primary hover:underline text-sm block flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-primary" />
                {patient.phone}
              </a>
            </div>

            {/* Email */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Email Address</span>
              <span className="font-medium text-slate-800 block">
                {patient.email ? (
                  <a href={`mailto:${patient.email}`} className="text-slate-800 hover:underline">
                    {patient.email}
                  </a>
                ) : (
                  <span className="text-slate-400 italic">No email address recorded.</span>
                )}
              </span>
            </div>

            {/* Emergency Contact */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Emergency Contact</span>
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-red-500" />
                {medicalProfile?.emergencyContact || "No emergency contact specified."}
              </span>
            </div>

            {/* Referral Info */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Referral Network</span>
              
              {referrer ? (
                <div className="text-xs">
                  <span className="text-slate-500">Referred by: </span>
                  <Link
                    href={`/admin/patients/${referrer.id}`}
                    className="font-bold text-primary hover:underline"
                  >
                    {referrer.name} (#{referrer.id.slice(0, 6)})
                  </Link>
                </div>
              ) : (
                <div className="text-xs text-slate-500">
                  Referral Source: <span className="font-semibold text-slate-800">{patient.referralSource || "Direct Walk-in"}</span>
                </div>
              )}

              {referredPatients.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Referred Patients ({referredPatients.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {referredPatients.slice(0, 4).map((rp) => (
                      <Link
                        key={rp.id}
                        href={`/admin/patients/${rp.id}`}
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[11px] font-semibold text-primary hover:underline"
                      >
                        {rp.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
