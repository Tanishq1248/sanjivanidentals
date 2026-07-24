"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Activity,
  Calendar,
  IndianRupee,
  FileText,
  Clock,
  ArrowRight,
  Plus,
  Edit2,
  Stethoscope,
  Pill,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import type {
  Patient,
  PatientMedicalProfile,
  PatientEncounter,
  Invoice,
  Appointment,
} from "../../../../lib/types";

interface OverviewTabProps {
  patient: Patient;
  medicalProfile?: PatientMedicalProfile | null;
  encounters: PatientEncounter[];
  invoices: Invoice[];
  appointments?: Appointment[];
  onSwitchTab: (tabKey: any) => void;
  onOpenEditProfile: () => void;
  onOpenAddEncounter: () => void;
  onOpenDentalChart: () => void;
}

function formatINR(amount: number): string {
  const val = Number(amount || 0);
  const hasPaise = val % 1 !== 0;
  return val.toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

function formatVisitDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  patient,
  medicalProfile,
  encounters,
  invoices,
  appointments = [],
  onSwitchTab,
  onOpenEditProfile,
  onOpenAddEncounter,
  onOpenDentalChart,
}) => {
  // Derive active encounter & active treatments
  const activeEncounter = encounters.find((e) => e.status === "In Progress");
  const latestEncounter = encounters.length > 0 ? encounters[0] : null;

  // Derive active treatments from encounters
  const allActiveToothTreatments: Array<{
    toothNumber?: number;
    treatmentName: string;
    status: string;
    doctorName?: string;
  }> = [];

  encounters.forEach((e) => {
    if (e.toothTreatments && e.toothTreatments.length > 0) {
      e.toothTreatments.forEach((tt) => {
        if (tt.status === "In Progress" || tt.status === "Planned") {
          allActiveToothTreatments.push({
            toothNumber: tt.toothNumber,
            treatmentName: tt.treatmentName,
            status: tt.status,
            doctorName: e.doctorName,
          });
        }
      });
    }
  });

  // Calculate finances
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
  const outstanding = Math.max(0, totalBilled - totalPaid);

  // Next upcoming appointment
  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingAppointments = appointments
    .filter((a) => a.date >= todayStr && a.status !== "Cancelled")
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextAppointment = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── Dashboard Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. Medical Alerts Card */}
        <div className="bg-white rounded-2xl border border-outline-variant/15 p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-outline-variant/30 transition-all">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2 font-sans">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Medical Alerts & Flags
              </h3>
              <button
                onClick={onOpenEditProfile}
                className="text-xs text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            </div>

            <div className="mt-3.5 space-y-3">
              <div>
                <span className="text-[11px] text-on-surface-variant font-medium block mb-1">
                  Allergies
                </span>
                {medicalProfile?.allergies ? (
                  <div className="p-2.5 bg-red-50 border border-red-200/80 rounded-xl text-xs text-red-900 font-semibold flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{medicalProfile.allergies}</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No allergies recorded</p>
                )}
              </div>

              <div>
                <span className="text-[11px] text-on-surface-variant font-medium block mb-1">
                  Chronic Conditions
                </span>
                {medicalProfile?.chronicDiseases && medicalProfile.chronicDiseases !== "None" ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 font-semibold">
                    {medicalProfile.chronicDiseases}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No chronic diseases recorded</p>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => onSwitchTab("medical-history")}
            className="w-full mt-2 pt-3 border-t border-outline-variant/10 text-xs font-bold text-primary flex items-center justify-between hover:underline cursor-pointer"
          >
            <span>View Full Medical History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. Current Active Treatments Card */}
        <div className="bg-white rounded-2xl border border-outline-variant/15 p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-outline-variant/30 transition-all">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2 font-sans">
                <Activity className="w-4 h-4 text-primary" />
                Active Treatments
              </h3>
              <button
                onClick={onOpenDentalChart}
                className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>

            <div className="mt-3.5 space-y-2.5">
              {allActiveToothTreatments.length > 0 ? (
                allActiveToothTreatments.slice(0, 3).map((tt, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {tt.toothNumber ? `Tooth #${tt.toothNumber}: ` : ""}
                        {tt.treatmentName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {tt.doctorName || "Primary Dentist"}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {tt.status}
                    </span>
                  </div>
                ))
              ) : activeEncounter ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-slate-800 block">{activeEncounter.chiefComplaint}</span>
                  <span className="text-[11px] text-slate-600 block">{activeEncounter.treatments.join(", ")}</span>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-2">No active treatments in progress</p>
              )}
            </div>
          </div>

          <button
            onClick={() => onSwitchTab("treatment-plan")}
            className="w-full mt-2 pt-3 border-t border-outline-variant/10 text-xs font-bold text-primary flex items-center justify-between hover:underline cursor-pointer"
          >
            <span>Manage Treatment Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3. Financial Snapshot & Outstanding Balance */}
        <div className="bg-white rounded-2xl border border-outline-variant/15 p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-outline-variant/30 transition-all">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2 font-sans">
                <IndianRupee className="w-4 h-4 text-emerald-600" />
                Financial Overview
              </h3>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-700">
                {invoices.length} Invoice{invoices.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Total Billed
                </span>
                <span className="font-extrabold text-slate-800 text-base font-mono">
                  ₹{formatINR(totalBilled)}
                </span>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
                  Total Paid
                </span>
                <span className="font-extrabold text-emerald-700 text-base font-mono">
                  ₹{formatINR(totalPaid)}
                </span>
              </div>
            </div>

            <div className="mt-3 p-3 bg-red-50/50 rounded-xl border border-red-100/80 flex items-center justify-between">
              <span className="text-xs font-bold text-red-900">Outstanding Balance</span>
              <span className="font-black text-red-700 text-lg font-mono">
                ₹{formatINR(outstanding)}
              </span>
            </div>
          </div>

          <button
            onClick={() => onSwitchTab("invoices")}
            className="w-full mt-2 pt-3 border-t border-outline-variant/10 text-xs font-bold text-primary flex items-center justify-between hover:underline cursor-pointer"
          >
            <span>View Invoices & Payments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* ── Detailed Cards Grid (2 columns) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Last Encounter & Next Appointment (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Last Encounter Summary Card */}
          <div className="bg-white rounded-2xl border border-outline-variant/15 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 font-sans">
                <Clock className="w-4.5 h-4.5 text-primary" />
                Latest Clinical Encounter
              </h3>
              <button
                onClick={() => onSwitchTab("encounters")}
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                All Encounters ({encounters.length}) <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {latestEncounter ? (
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    📅 {formatVisitDate(latestEncounter.visitDate)}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    👨‍⚕️ {latestEncounter.doctorName}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-0.5">
                    Chief Complaint
                  </span>
                  <p className="text-xs font-semibold text-slate-900">
                    {latestEncounter.chiefComplaint}
                  </p>
                </div>

                {latestEncounter.diagnosis && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase block mb-0.5">
                      Diagnosis
                    </span>
                    <p className="text-xs text-slate-800">{latestEncounter.diagnosis}</p>
                  </div>
                )}

                {latestEncounter.treatments && latestEncounter.treatments.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                      Procedures Performed
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {latestEncounter.treatments.map((t, idx) => (
                        <span
                          key={idx}
                          className="bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-0.5 rounded-md font-semibold"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-500 mb-3">No encounters logged yet for this patient.</p>
                <button
                  onClick={onOpenAddEncounter}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Log First Encounter
                </button>
              </div>
            )}
          </div>

          {/* Next Appointment Card */}
          <div className="bg-white rounded-2xl border border-outline-variant/15 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 font-sans">
                <Calendar className="w-4.5 h-4.5 text-primary" />
                Next Scheduled Appointment
              </h3>
              <button
                onClick={() => onSwitchTab("appointments")}
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                Appointments Tab <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {nextAppointment ? (
              <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-xl space-y-2 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-emerald-950 block">
                    {formatVisitDate(nextAppointment.date)} at {nextAppointment.time}
                  </span>
                  <span className="text-xs text-emerald-800 block">
                    Doctor: {nextAppointment.doctorName || "Assigned Specialist"}
                  </span>
                  <span className="text-xs text-emerald-700 italic block">
                    Service: {nextAppointment.service || "Dental Checkup"}
                  </span>
                </div>
                <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold">
                  {nextAppointment.status}
                </span>
              </div>
            ) : (
              <div className="p-4 text-center bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500">No upcoming appointment scheduled.</p>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Clinical Notes Preview & Quick Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Clinical Notes Preview Card */}
          <div className="bg-white rounded-2xl border border-outline-variant/15 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 font-sans">
                <FileText className="w-4.5 h-4.5 text-primary" />
                Clinical Notes Preview
              </h3>
              <button
                onClick={onOpenEditProfile}
                className="text-xs text-primary font-bold hover:underline cursor-pointer"
              >
                Edit Notes
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 min-h-[140px]">
              {medicalProfile?.clinicalNotes ? (
                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                  {medicalProfile.clinicalNotes}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No general clinical notes recorded yet.
                </p>
              )}
            </div>

            <button
              onClick={() => onSwitchTab("notes")}
              className="w-full text-xs font-bold text-primary flex items-center justify-center gap-1 hover:underline pt-2 cursor-pointer"
            >
              View Full Clinical & SOAP Notes <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
