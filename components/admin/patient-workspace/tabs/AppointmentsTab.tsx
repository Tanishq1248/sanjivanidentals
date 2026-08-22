"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Plus,
  ChevronRight,
  Filter,
  MessageSquare,
  Loader2,
} from "lucide-react";
import type { Appointment } from "../../../../lib/types";
import { sendWhatsAppMessage } from "../../../../lib/services/whatsappService";
import { getClinicResources } from "../../../../lib/services/settingsService";
import { queryKeys } from "../../../../lib/query/queryKeys";

interface AppointmentsTabProps {
  appointments: Appointment[];
  patientId: string;
  patientPhone: string;
  patientName?: string;
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

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({
  appointments,
  patientId,
  patientPhone,
  patientName = "Patient",
}) => {
  const [filterGroup, setFilterGroup] = useState<"all" | "upcoming" | "completed" | "cancelled">("all");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const { data: clinicResources } = useQuery({
    queryKey: queryKeys.settings.clinicResources,
    queryFn: getClinicResources,
    staleTime: 5 * 60_000,
  });

  const getChairName = (apt: Appointment) => {
    if (apt.chairId && clinicResources?.chairs) {
      const found = clinicResources.chairs.find((c) => c.id === apt.chairId);
      if (found) return found.name;
    }
    return apt.chair || "Chair not assigned";
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSendReminder = async (apt: Appointment) => {
    if (sendingId === apt.id) {
      showToast("Message is already being sent.");
      return;
    }

    setSendingId(apt.id);
    showToast("Sending WhatsApp appointment reminder via Twilio...");

    try {
      const res = await sendWhatsAppMessage({
        messageType: "appointment_reminder",
        recipient: patientPhone,
        patientId,
        patientName: apt.patientName || patientName,
        appointmentId: apt.id,
        clinicName: "Sanjivani Dentals",
        doctorName: apt.doctorName || "Dr. Rajesh Sharma",
        date: apt.date,
        time: apt.time,
      });

      if (res.success) {
        showToast(res.message);
      } else if (res.code === "REQUEST_ALREADY_IN_PROGRESS") {
        showToast("Message is already being sent.");
      } else {
        showToast(res.message || "Opening WhatsApp Web fallback...");
        const digits = patientPhone.replace(/\D/g, "");
        const msg = `Hello ${apt.patientName || patientName}!\n\nReminder: You have an appointment at Sanjivani Dentals on ${apt.date} at ${apt.time}.\n\nRegards,\nSanjivani Dentals`;
        window.open(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`, "_blank");
      }
    } finally {
      setSendingId(null);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const upcoming = appointments.filter(
    (a) =>
      a.status !== "Completed" &&
      a.status !== "Cancelled" &&
      (a.date >= todayStr || a.status === "Confirmed" || a.status === "Pending" || a.status === "Checked In")
  );

  const completed = appointments.filter(
    (a) => a.status === "Completed" || (a.date < todayStr && a.status !== "Cancelled")
  );

  const cancelled = appointments.filter((a) => a.status === "Cancelled");

  const getDisplayedAppointments = () => {
    switch (filterGroup) {
      case "upcoming":
        return upcoming;
      case "completed":
        return completed;
      case "cancelled":
        return cancelled;
      default:
        return appointments;
    }
  };

  const displayedList = getDisplayedAppointments();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-outline-variant/15 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-base font-bold text-on-surface">Patient Appointment History</h2>
          <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
            {appointments.length} Total
          </span>
        </div>

        {/* Group Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilterGroup("all")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterGroup === "all" ? "bg-white text-primary shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All ({appointments.length})
          </button>
          <button
            onClick={() => setFilterGroup("upcoming")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterGroup === "upcoming" ? "bg-white text-emerald-700 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Upcoming ({upcoming.length})
          </button>
          <button
            onClick={() => setFilterGroup("completed")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterGroup === "completed" ? "bg-white text-blue-700 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Completed ({completed.length})
          </button>
          <button
            onClick={() => setFilterGroup("cancelled")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterGroup === "cancelled" ? "bg-white text-red-700 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Cancelled ({cancelled.length})
          </button>
        </div>
      </div>

      {/* Appointments List */}
      {displayedList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-outline-variant/15 p-12 text-center space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No appointments found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are no appointments matching the selected filter for this patient.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedList.map((apt) => {
            const isCancel = apt.status === "Cancelled";
            const isComp = apt.status === "Completed";
            const isUp = !isCancel && !isComp;

            return (
              <div
                key={apt.id}
                className="bg-white rounded-2xl border border-outline-variant/15 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5 bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10 w-fit">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatVisitDate(apt.date)} • {apt.time}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 pt-1">
                      {apt.doctorName || "Dr. Rajesh Sharma"}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {apt.service || "General Dental Consultation"}
                    </p>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                      isUp
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : isComp
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-slate-500">
                    Chair: <span className="font-semibold text-slate-700">{getChairName(apt)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isUp && (
                      <button
                        type="button"
                        onClick={() => handleSendReminder(apt)}
                        disabled={sendingId === apt.id}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-emerald-200 cursor-pointer disabled:opacity-50"
                        title="Send WhatsApp appointment reminder to patient"
                      >
                        {sendingId === apt.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <MessageSquare className="w-3.5 h-3.5" />
                        )}
                        WhatsApp Reminder
                      </button>
                    )}
                    <Link
                      href={`/admin/patients/${patientId}?tab=encounters`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" /> Prescriptions
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          {toastMsg}
        </div>
      )}
    </div>
  );
};
