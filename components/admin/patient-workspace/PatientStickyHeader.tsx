"use client";

import React from "react";
import Link from "next/link";
import {
  Phone,
  Calendar,
  IndianRupee,
  Plus,
  Activity,
  Edit2,
  CheckCircle2,
  Clock,
  User,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import type { Patient, PatientMedicalProfile, PatientEncounter, Invoice, Appointment } from "../../../lib/types";

interface PatientStickyHeaderProps {
  patient: Patient;
  medicalProfile?: PatientMedicalProfile | null;
  encounters: PatientEncounter[];
  invoices: Invoice[];
  appointments?: Appointment[];
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

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr + (dateStr.includes("T") ? "" : "T00:00:00"));
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export const PatientStickyHeader: React.FC<PatientStickyHeaderProps> = ({
  patient,
  medicalProfile,
  encounters,
  invoices,
  appointments = [],
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

  // Last visit calculation
  const sortedEncounters = [...encounters].sort((a, b) => (b.visitDate || "").localeCompare(a.visitDate || ""));
  const lastVisitDate = sortedEncounters.length > 0 ? sortedEncounters[0].visitDate : null;
  const primaryDoctor = sortedEncounters.length > 0 && sortedEncounters[0].doctorName ? sortedEncounters[0].doctorName : null;

  // Next upcoming appointment
  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingAppointments = appointments
    .filter((a) => a.date >= todayStr && a.status !== "Cancelled")
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextAppointment = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;

  return (
    <div className="bg-white border border-outline-variant/15 rounded-2xl shadow-xs overflow-hidden mb-5 max-w-full min-w-0">
      {/* Main Clinical Case Sheet Header Banner */}
      <div className="p-3.5 sm:p-5 lg:p-6 space-y-4 max-w-full min-w-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 max-w-full min-w-0">
          
          {/* Patient Identity & Primary Demographics */}
          <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 max-w-full">
            <div
              className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl ${
                patient.avatarColor || "bg-primary"
              } flex items-center justify-center text-white font-black text-base sm:text-xl shadow-xs shrink-0 border border-white/20`}
            >
              {initials}
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-xl font-bold text-on-surface leading-tight tracking-tight truncate max-w-[200px] sm:max-w-none">
                  {patient.name}
                </h1>
                <span className="text-[11px] sm:text-xs font-mono font-bold bg-slate-100 text-slate-700 px-1.5 sm:px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                  #{patient.id.slice(0, 8).toUpperCase()}
                </span>
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Active
                </span>
                {medicalProfile?.allergies && (
                  <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold flex items-center gap-1 shrink-0">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    Allergy Alert
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-xs text-on-surface-variant font-medium min-w-0">
                <span className="text-on-surface font-semibold shrink-0">
                  {patient.age ? `${patient.age} Yrs` : "Age —"} • {patient.gender || "Gender —"}
                </span>
                <span className="shrink-0">•</span>
                <span className="flex items-center gap-1 shrink-0">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <a href={`tel:${patient.phone}`} className="hover:underline font-semibold text-on-surface">
                    {patient.phone}
                  </a>
                </span>
                {patient.email && (
                  <>
                    <span className="hidden sm:inline shrink-0">•</span>
                    <span className="hidden sm:inline text-on-surface-variant truncate max-w-[180px]">
                      {patient.email}
                    </span>
                  </>
                )}
                {referrer && (
                  <>
                    <span className="hidden md:inline shrink-0">•</span>
                    <span className="hidden md:inline truncate max-w-[160px]">
                      Ref by:{" "}
                      <Link href={`/admin/patients/${referrer.id}`} className="text-primary font-bold hover:underline">
                        {referrer.name}
                      </Link>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Toolbar: 2x2 Grid on Mobile, Flex on Desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-wrap items-center gap-2 sm:gap-2.5 w-full lg:w-auto shrink-0 pt-1 lg:pt-0">
            <button
              onClick={onOpenEditProfile}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 border border-outline-variant/40 hover:border-primary text-on-surface hover:text-primary hover:bg-primary/5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs w-full sm:w-auto min-h-[42px] sm:min-h-0"
            >
              <Edit2 className="w-3.5 h-3.5 text-primary" />
              <span>Edit Patient</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 bg-[#dcfce7] hover:bg-green-200 text-green-900 rounded-xl text-xs font-semibold transition-colors border border-green-300/80 shadow-2xs w-full sm:w-auto min-h-[42px] sm:min-h-0"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-green-700" />
              <span>WhatsApp</span>
            </a>

            <button
              onClick={onOpenAddEncounter}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-98 cursor-pointer w-full sm:w-auto min-h-[42px] sm:min-h-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="truncate">+ New Case Paper</span>
            </button>

            <button
              onClick={onOpenDentalChart}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-98 cursor-pointer w-full sm:w-auto min-h-[42px] sm:min-h-0"
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="truncate">Add Treatment</span>
            </button>
          </div>
        </div>

        {/* Clinical Snapshot Context Strip: 2x2 on Mobile, 4-col on Desktop */}
        <div className="pt-3 border-t border-outline-variant/10 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {/* Last Visit */}
          <div className="bg-slate-50/90 p-2.5 rounded-xl border border-outline-variant/10 min-w-0">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5 truncate">
              Last Case Paper
            </span>
            <span className="font-bold text-on-surface text-xs flex items-center gap-1 truncate" title={lastVisitDate ? `${formatDate(lastVisitDate)} ${primaryDoctor ? `(${primaryDoctor})` : ''}` : "No prior visits"}>
              <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">{lastVisitDate ? formatDate(lastVisitDate) : "None"}</span>
            </span>
          </div>

          {/* Next Appointment */}
          <div className="bg-slate-50/90 p-2.5 rounded-xl border border-outline-variant/10 min-w-0">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5 truncate">
              Next Appointment
            </span>
            <span className="font-bold text-slate-800 text-xs flex items-center gap-1 truncate" title={nextAppointment ? `${formatDate(nextAppointment.date)} at ${nextAppointment.time}` : "No upcoming appointment"}>
              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{nextAppointment ? `${formatDate(nextAppointment.date)} · ${nextAppointment.time}` : "Not Scheduled"}</span>
            </span>
          </div>

          {/* Total Case Papers & Chart Status */}
          <div className="bg-slate-50/90 p-2.5 rounded-xl border border-outline-variant/10 min-w-0">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5 truncate">
              Case Papers
            </span>
            <span className="font-bold text-slate-800 text-xs flex items-center gap-1 truncate">
              <User className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="truncate">{encounters.length} Session{encounters.length !== 1 ? "s" : ""}</span>
            </span>
          </div>

          {/* Outstanding Financial Balance */}
          <div
            className={`p-2.5 rounded-xl border min-w-0 ${
              outstandingBalance > 0
                ? "bg-amber-50/70 border-amber-200"
                : "bg-emerald-50/70 border-emerald-200"
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5 text-on-surface-variant truncate">
              Outstanding Dues
            </span>
            <span
              className={`font-black text-xs font-mono flex items-center truncate ${
                outstandingBalance > 0 ? "text-amber-800" : "text-emerald-800"
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
