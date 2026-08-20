"use client";

import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  CalendarDays,
  Users,
  CreditCard,
  Menu,
  X,
  LogOut,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { AdminAuthGuard } from "../../../components/auth/AdminAuthGuard";
import { useAuth } from "../../../lib/context/AuthContext";
import { useSidebarStore } from "../../../lib/store/useSidebarStore";
import {
  useCalendarStore,
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  getMonthEnd,
} from "../../../lib/store/useCalendarStore";
import {
  getAppointmentsByDate,
  getAppointmentsByDateRange,
  updateAppointmentStatus,
  checkInAppointment,
  completeAppointment,
  deleteAppointment,
} from "../../../lib/services/appointmentService";
import { getInvoices } from "../../../lib/services/invoiceService";
import { queryKeys } from "../../../lib/query/queryKeys";
import { CalendarHeader } from "../../../components/calendar/CalendarHeader";
import { DayView } from "../../../components/calendar/DayView";
import { WeekView } from "../../../components/calendar/WeekView";
import { MonthView } from "../../../components/calendar/MonthView";
import { NewAppointmentModal } from "../../../components/calendar/NewAppointmentModal";
import { PatientDetailsModal } from "../../../components/admin/PatientDetailsModal";
import { usePatientStore } from "../../../lib/store/usePatientStore";
import { getPatientByPhone } from "../../../lib/services/patientService";
import type { Appointment, AppointmentStatus } from "../../../lib/types";
import { useMemo } from "react";

import { Sidebar } from "../../../components/admin/Sidebar";

/* ─── Main Calendar Page ─── */
function CalendarPage() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { sidebarOpen, setSidebarOpen } = useSidebarStore();
  const { selectedPatient, isModalOpen, openPatientDetails, closePatientDetails } = usePatientStore();

  const { view, selectedDate, setView, setSelectedDate, goToPrev, goToNext, goToToday } = useCalendarStore();

  /* ── Toast ── */
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  /* ── New Appointment Modal ── */
  const [newApptModal, setNewApptModal] = useState<{ open: boolean; date: string; time: string }>({
    open: false,
    date: selectedDate,
    time: "09:00 AM",
  });


  /* ── Derive date range key for TanStack Query ── */
  const { rangeKey, startDate, endDate } = useMemo(() => {
    if (view === "day") {
      return { rangeKey: selectedDate, startDate: selectedDate, endDate: selectedDate };
    }
    if (view === "week") {
      const s = getWeekStart(selectedDate);
      const e = getWeekEnd(selectedDate);
      return { rangeKey: `${s}:${e}`, startDate: s, endDate: e };
    }
    // month
    const s = getMonthStart(selectedDate);
    const e = getMonthEnd(selectedDate);
    return { rangeKey: `${s}:${e}`, startDate: s, endDate: e };
  }, [view, selectedDate]);

  /* ── Fetch appointments ── */
  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: queryKeys.calendar.byRange(view, rangeKey),
    queryFn: () =>
      view === "day"
        ? getAppointmentsByDate(startDate)
        : getAppointmentsByDateRange(startDate, endDate),
    staleTime: 60_000,
  });

  /* ── Invalidate calendar after any mutation ── */
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["calendar"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
    queryClient.invalidateQueries({ queryKey: ["appointments", "today"] });
  }, [queryClient]);

  /* ── Status / Delete mutation ── */
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus | "__delete__" }) => {
      if (status === "__delete__") {
        await deleteAppointment(id);
      } else {
        await updateAppointmentStatus(id, status);
      }
      return { id, status };
    },
    onSettled: invalidate,
    onSuccess: (d) => showToast(d.status === "__delete__" ? "Appointment deleted." : `Status → ${d.status}`),
    onError: () => showToast("Failed to update appointment."),
  });

  /* ── Check In mutation ── */
  const checkInMutation = useMutation({
    mutationFn: (id: string) => checkInAppointment(id),
    onSettled: invalidate,
    onSuccess: () => showToast("Patient checked in!"),
  });

  /* ── Start Treatment mutation ── */
  const startTreatmentMutation = useMutation({
    mutationFn: (id: string) => updateAppointmentStatus(id, "In Progress"),
    onSettled: invalidate,
    onSuccess: () => showToast("Treatment started."),
  });

  /* ── Complete mutation ── */
  const completeMutation = useMutation({
    mutationFn: (id: string) => completeAppointment(id),
    onSettled: invalidate,
    onSuccess: () => showToast("Appointment completed!"),
  });

  /* ── Patient details ── */
  const handleOpenPatient = async (patientId: string, phone: string, name: string) => {
    try {
      const found = await queryClient.fetchQuery({
        queryKey: queryKeys.patients.byPhone(phone),
        queryFn: () => getPatientByPhone(phone),
        staleTime: 5 * 60_000,
      });
      openPatientDetails(
        found ?? {
          id: patientId || "Unregistered",
          name,
          phone,
          email: "",
          age: "",
          lastVisit: "",
          condition: "",
          notes: "Not yet registered in patient registry.",
          avatarColor: "bg-gray-500",
          createdAt: null as any,
          updatedAt: null as any,
        }
      );
    } catch {
      showToast("Could not load patient profile.");
    }
  };

  const handleOpenEncounter = (patientId: string) => {
    if (patientId && patientId !== "Unregistered") {
      router.push(`/admin/patients/${patientId}`);
    } else {
      showToast("Patient not registered. Add them to the registry first.");
    }
  };


  return (
    <div className="min-h-screen flex bg-[#f2f5f8] font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0 sticky top-0 h-screen shadow-2xs z-30">
        <Sidebar currentPage="calendar" />
      </div>

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[220px] shadow-level-2 transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          currentPage="calendar"
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b border-outline-variant/20 px-4 md:px-6 py-4 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-surface-variant text-primary shrink-0 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary hidden sm:block" />
            <h1 className="text-lg font-bold text-primary font-sans leading-tight">Appointment Calendar</h1>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setNewApptModal({ open: true, date: selectedDate, time: "09:00 AM" })}
              className="inline-flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Appointment</span>
              <span className="sm:hidden">New</span>
            </button>
            <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-secondary-container shrink-0 bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">{user?.email?.[0]?.toUpperCase() || "A"}</span>
            </div>
          </div>
        </header>

        {/* Calendar shell */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Calendar header with view toggle and navigation */}
          <CalendarHeader
            view={view}
            selectedDate={selectedDate}
            onViewChange={setView}
            onPrev={goToPrev}
            onNext={goToNext}
            onToday={goToToday}
          />

          {/* Stats bar (Day view only) */}
          {view === "day" && !isLoading && (
            <div className="flex items-center gap-4 px-5 py-2.5 bg-surface-container/50 border-b border-outline-variant/10 overflow-x-auto scrollbar-none">
              {[
                { label: "Total", count: appointments.length, color: "text-on-surface-variant" },
                { label: "Confirmed", count: appointments.filter((a) => a.status === "Confirmed").length, color: "text-blue-600" },
                { label: "Checked In", count: appointments.filter((a) => a.status === "Checked In").length, color: "text-teal-600" },
                { label: "In Treatment", count: appointments.filter((a) => a.status === "In Progress").length, color: "text-purple-600" },
                { label: "Completed", count: appointments.filter((a) => a.status === "Completed").length, color: "text-emerald-600" },
                { label: "Cancelled", count: appointments.filter((a) => a.status === "Cancelled" || a.status === "No Show").length, color: "text-slate-500" },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-sm font-extrabold ${color}`}>{count}</span>
                  <span className="text-[10px] font-medium text-on-surface-variant/60">{label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Calendar view */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {view === "day" && (
              <DayView
                date={selectedDate}
                appointments={appointments}
                isLoading={isLoading}
                onCheckIn={(id) => checkInMutation.mutate(id)}
                onStartTreatment={(id) => startTreatmentMutation.mutate(id)}
                onComplete={(id) => completeMutation.mutate(id)}
                onOpenPatient={handleOpenPatient}
                onOpenEncounter={handleOpenEncounter}
                onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
                onNewAppointment={(date, time) => setNewApptModal({ open: true, date, time })}
              />
            )}
            {view === "week" && (
              <WeekView
                selectedDate={selectedDate}
                appointments={appointments}
                isLoading={isLoading}
                onCheckIn={(id) => checkInMutation.mutate(id)}
                onStartTreatment={(id) => startTreatmentMutation.mutate(id)}
                onComplete={(id) => completeMutation.mutate(id)}
                onOpenPatient={handleOpenPatient}
                onOpenEncounter={handleOpenEncounter}
                onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
                onNewAppointment={(date, time) => setNewApptModal({ open: true, date, time })}
                onDayClick={(date) => { setSelectedDate(date); setView("day"); }}
              />
            )}
            {view === "month" && (
              <MonthView
                selectedDate={selectedDate}
                appointments={appointments}
                isLoading={isLoading}
                onDayClick={(date) => { setSelectedDate(date); setView("day"); }}
              />
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-outline-variant/20 px-4 md:px-8 py-3">
          <p className="text-xs text-on-surface-variant text-center">© 2024 Sanjivani Dentals. All rights reserved.</p>
        </footer>
      </div>

      {/* New Appointment Modal */}
      <NewAppointmentModal
        isOpen={newApptModal.open}
        defaultDate={newApptModal.date}
        defaultTime={newApptModal.time}
        onClose={() => setNewApptModal((s) => ({ ...s, open: false }))}
        onSuccess={() => showToast("Appointment created!")}
      />

      {/* Patient Details Modal */}
      <PatientDetailsModal
        patient={selectedPatient}
        isOpen={isModalOpen}
        onClose={closePatientDetails}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-4 md:right-6 z-50 bg-on-surface text-surface text-sm font-medium px-4 py-3 rounded-xl shadow-level-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {toast}
        </div>
      )}
    </div>
  );
}

export default function AdminCalendarPage() {
  return (
    <AdminAuthGuard>
      <CalendarPage />
    </AdminAuthGuard>
  );
}
