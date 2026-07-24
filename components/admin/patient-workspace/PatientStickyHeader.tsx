"use client";

import React from "react";
import Link from "next/link";
import {
  User,
  Phone,
  Calendar,
  IndianRupee,
  Stethoscope,
  Plus,
  Activity,
  Edit2,
  CheckCircle2,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";
import type { Patient, PatientMedicalProfile, PatientEncounter, Invoice } from "../../../lib/types";

interface PatientStickyHeaderProps {
  patient: Patient;
  medicalProfile?: PatientMedicalProfile | null;
  encounters: PatientEncounter[];
  invoices: Invoice[];
  referrer?: Patient | null;
  referredPatients?: Patient[];
  onOpenEditProfile: () => void;
  onOpenAddEncounter: () => void;
  onOpenDentalChart: () => void;
  whatsappUrl: string;
}

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatINR(amount: number): string {
  const val = Number(amount || 0);
  const hasPaise = val % 1 !== 0;
  return val.toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

export const PatientStickyHeader: React.FC<PatientStickyHeaderProps> = ({
  patient,
  medicalProfile,
  encounters,
  invoices,
  referrer,
  referredPatients = [],
  onOpenEditProfile,
  onOpenAddEncounter,
  onOpenDentalChart,
  whatsappUrl,
}) => {
  const initials = getInitials(patient.name);

  // Financial status calculation
  const totalBilled = invoices.reduce(
    (sum, inv) => sum + (inv.total || inv.amount || 0),
    0
  );
  const totalPaid = invoices.reduce((sum, inv) => {
    const history = inv.paymentHistory || [];
    if (history.length > 0) {
      return (
        sum +
        history.reduce(
          (s: number, pay: any) =>
            pay.paymentType !== "Generated" ? s + pay.amountReceived : s,
          0
        )
      );
    }
    return (
      sum +
      (inv.paymentStatus === "Paid" || inv.paymentStatus === "PAID"
        ? inv.total || inv.amount || 0
        : inv.paidAmount || 0)
    );
  }, 0);
  const outstandingBalance = Math.max(0, totalBilled - totalPaid);

  // Primary dentist logic
  const primaryDentist =
    encounters.length > 0 && encounters[0]?.doctorName
      ? encounters[0].doctorName
      : "Dr. Julian Moore";

  return (
    <div className="bg-white border border-outline-variant/15 rounded-2xl shadow-sm overflow-hidden mb-6">
      {/* Top Banner & Main Patient Summary */}
      <div className="p-5 lg:p-6 space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          {/* Avatar + Main Information */}
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${
                patient.avatarColor || "bg-primary"
              } flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-md shrink-0 border-2 border-white`}
            >
              {initials}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-on-surface leading-tight tracking-tight">
                  {patient.name}
                </h1>
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Patient
                </span>
                {medicalProfile?.allergies && (
                  <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full text-[11px] font-bold">
                    ⚠️ Allergy Alert
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant font-medium">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-primary" /> {patient.phone}
                </span>
                {patient.email && (
                  <span className="hidden sm:inline">
                    • {patient.email}
                  </span>
                )}
                {patient.address && (
                  <span className="hidden md:inline-flex items-center gap-1 text-on-surface-variant/80">
                    • <MapPin className="w-3 h-3" /> {patient.address}
                  </span>
                )}
                {referrer && (
                  <span>
                    • Referred By:{" "}
                    <Link
                      href={`/admin/patients/${referrer.id}`}
                      className="text-primary font-bold hover:underline"
                    >
                      {referrer.name}
                    </Link>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 pt-2 xl:pt-0">
            <button
              onClick={onOpenEditProfile}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-outline-variant/40 hover:border-primary text-on-surface hover:text-primary hover:bg-primary/5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs"
            >
              <Edit2 className="w-4 h-4 text-primary" /> Edit Patient
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#dcfce7] hover:bg-green-200 text-green-900 rounded-xl text-xs sm:text-sm font-semibold transition-colors border border-green-300/80 shadow-2xs"
            >
              <WhatsAppIcon className="w-4 h-4 text-green-700" /> WhatsApp
            </a>
            <button
              onClick={onOpenAddEncounter}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Log Encounter
            </button>
            <button
              onClick={onOpenDentalChart}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-98 cursor-pointer"
            >
              <Activity className="w-4 h-4" /> Add Treatment
            </button>
          </div>
        </div>

        {/* Compact Summary Metrics Bar */}
        <div className="pt-4 border-t border-outline-variant/10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-50/80 p-2.5 sm:p-3 rounded-xl border border-outline-variant/10">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">
              Age / Gender
            </span>
            <span className="font-bold text-on-surface text-xs sm:text-sm">
              {patient.age ? `${patient.age} Yrs` : "—"} / {patient.gender || "—"}
            </span>
          </div>

          <div className="bg-slate-50/80 p-2.5 sm:p-3 rounded-xl border border-outline-variant/10">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">
              Blood Group
            </span>
            <span className="font-bold text-red-600 text-xs sm:text-sm">
              {medicalProfile?.bloodGroup || patient.bloodType || "Not Specified"}
            </span>
          </div>

          <div className="bg-slate-50/80 p-2.5 sm:p-3 rounded-xl border border-outline-variant/10">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">
              Total Visits
            </span>
            <span className="font-bold text-primary text-xs sm:text-sm flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {encounters.length} Visit{encounters.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="bg-slate-50/80 p-2.5 sm:p-3 rounded-xl border border-outline-variant/10">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">
              Primary Dentist
            </span>
            <span className="font-semibold text-on-surface text-xs sm:text-sm truncate block" title={primaryDentist}>
              {primaryDentist}
            </span>
          </div>

          <div className="bg-slate-50/80 p-2.5 sm:p-3 rounded-xl border border-outline-variant/10">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">
              Emergency Phone
            </span>
            <span className="font-semibold text-on-surface text-xs sm:text-sm truncate block" title={medicalProfile?.emergencyContact || "—"}>
              {medicalProfile?.emergencyContact || "—"}
            </span>
          </div>

          <div
            className={`p-2.5 sm:p-3 rounded-xl border ${
              outstandingBalance > 0
                ? "bg-red-50/50 border-red-200/80"
                : "bg-emerald-50/50 border-emerald-200/80"
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5 text-on-surface-variant">
              Outstanding Balance
            </span>
            <span
              className={`font-black text-xs sm:text-sm font-mono flex items-center ${
                outstandingBalance > 0 ? "text-red-700" : "text-emerald-700"
              }`}
            >
              ₹{formatINR(outstandingBalance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
