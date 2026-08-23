"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, Search, Phone, Loader2, CalendarDays, Clock, Armchair, AlertCircle, User, Stethoscope } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAppointmentByAdmin } from "../../lib/services/appointmentService";
import { getPaginatedPatients } from "../../lib/services/patientService";
import { getClinicResources } from "../../lib/services/settingsService";
import { useActiveDoctors } from "../../lib/hooks/useDoctors";
import { DURATION_OPTIONS } from "../../lib/types";
import type { Patient, AppointmentStatus, Doctor } from "../../lib/types";
import { queryKeys, CACHE_POLICIES } from "../../lib/query/queryKeys";

/* ─── Common dental services list ─── */
const COMMON_SERVICES = [
  "Consultation", "Scaling & Polishing", "Dental Extraction",
  "Root Canal Treatment", "Dental Filling", "Crown Placement",
  "Teeth Whitening", "Orthodontic Consultation", "Denture Fitting",
  "Dental X-Ray", "Fluoride Treatment", "Sealant Application",
  "Dental Implant Consultation", "Gum Treatment", "Emergency Care",
];

const STATUS_OPTIONS: AppointmentStatus[] = ["Confirmed", "Pending"];

interface NewAppointmentModalProps {
  isOpen: boolean;
  defaultDate: string;   // YYYY-MM-DD
  defaultTime: string;   // "09:30 AM"
  onClose: () => void;
  onSuccess: () => void;
}

export function NewAppointmentModal({
  isOpen,
  defaultDate,
  defaultTime,
  onClose,
  onSuccess,
}: NewAppointmentModalProps) {
  const queryClient = useQueryClient();

  /* ── Patient search ── */
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  /* ── Targeted Patient search query (Indexed, top 6) ── */
  const { data: suggestions = [] } = useQuery<Patient[]>({
    queryKey: ["patients", "apptSearch", patientSearch],
    queryFn: async () => {
      const q = patientSearch.trim();
      if (q.length < 2 || selectedPatient) return [];
      const res = await getPaginatedPatients({ searchTerm: q, pageSize: 6 });
      return res.data;
    },
    enabled: patientSearch.trim().length >= 2 && !selectedPatient,
    staleTime: 60 * 1000,
  });

  /* ── Active Doctors (Single Source of Truth from Settings > Team Members) ── */
  const { doctors = [] } = useActiveDoctors();

  /* ── Clinic Resources (Chairs) ── */
  const {
    data: clinicResources,
    isLoading: isLoadingChairs,
    isError: isChairsError,
    refetch: refetchChairs,
  } = useQuery({
    queryKey: queryKeys.settings.clinicResources,
    queryFn: getClinicResources,
    ...CACHE_POLICIES.STATIC_METADATA,
  });

  const activeChairs = useMemo(() => {
    return (clinicResources?.chairs || []).filter((c) => c.active);
  }, [clinicResources]);

  /* ── Form state ── */
  const [form, setForm] = useState({
    date: defaultDate,
    time: defaultTime,
    service: "",
    customService: "",
    chairId: "",
    doctorId: "",
    doctorName: "",
    duration: 30,
    status: "Confirmed" as AppointmentStatus,
    patientName: "",
    patientPhone: "",
    patientEmail: "",
  });

  const defaultDoctor = doctors[0];
  const defaultDoctorId = defaultDoctor?.id || "doc-1";
  const defaultDoctorName = defaultDoctor?.fullName || "Dr. Rajesh Sharma";

  /* Sync defaults when modal opens */
  useEffect(() => {
    if (isOpen) {
      setForm((f) => ({
        ...f,
        date: defaultDate,
        time: defaultTime,
        chairId: "",
        doctorId: defaultDoctorId,
        doctorName: defaultDoctorName,
      }));
      setSelectedPatient(null);
      setPatientSearch("");
    }
  }, [isOpen, defaultDate, defaultTime, defaultDoctorId, defaultDoctorName]);

  /* ── Mutation ── */
  const mutation = useMutation({
    mutationFn: () => {
      const selectedChairObj = activeChairs.find((c) => c.id === form.chairId);
      const selectedDoctor = doctors.find((d) => d.id === form.doctorId) || doctors[0];
      return createAppointmentByAdmin({
        patientName:  selectedPatient?.name  ?? form.patientName,
        patientPhone: selectedPatient?.phone ?? form.patientPhone,
        patientEmail: selectedPatient?.email ?? form.patientEmail,
        patientId:    selectedPatient?.id    ?? "",
        service:      form.service === "__custom__" ? form.customService : form.service,
        date:         form.date,
        time:         form.time,
        doctorId:     form.doctorId || selectedDoctor?.id || "doc-1",
        doctorName:   form.doctorName || selectedDoctor?.fullName || "Dr. Rajesh Sharma",
        chairId:      form.chairId || undefined,
        chair:        selectedChairObj?.name || undefined,
        duration:     form.duration,
        status:       form.status,
        clinicId:     "clinic-1",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: ["appointments", "today"] });
      onSuccess();
      onClose();
    },
  });

  /* ── Validation ── */
  const isServiceValid = form.service && (form.service !== "__custom__" || form.customService.trim().length > 0);
  const isPatientValid = selectedPatient || (form.patientName.trim().length > 0 && form.patientPhone.trim().length > 0);
  const isValid = isPatientValid && isServiceValid && form.date && form.time;

  /* ── Outside click for suggestions ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/15 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-on-surface">New Appointment</h2>
              <p className="text-[10px] text-on-surface-variant/70">{form.date} at {form.time}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* ── Patient Search ── */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">Patient *</label>
            {selectedPatient ? (
              <div className="flex items-center justify-between p-3 rounded-xl border border-primary/30 bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {selectedPatient.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{selectedPatient.name}</p>
                    <p className="text-[11px] text-on-surface-variant font-mono">{selectedPatient.phone}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedPatient(null); setPatientSearch(""); }}
                  className="text-xs text-on-surface-variant hover:text-red-600 font-semibold cursor-pointer"
                >
                  Change
                </button>
              </div>
            ) : (
              <div ref={searchRef} className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {/^[\d\s+\-()]+$/.test(patientSearch.trim()) && patientSearch.trim().replace(/\D/g, "").length > 0
                    ? <Phone className="w-4 h-4 text-primary" />
                    : <Search className="w-4 h-4 text-on-surface-variant" />}
                </div>
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => { setPatientSearch(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => patientSearch.length >= 2 && setShowSuggestions(true)}
                  placeholder="Search by name or phone…"
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-on-surface-variant/50"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl border border-outline-variant/20 shadow-lg overflow-hidden">
                    {suggestions.map((p) => (
                      <button
                        key={p.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { setSelectedPatient(p); setPatientSearch(p.name); setShowSuggestions(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-container-low transition-colors text-left"
                      >
                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {p.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-on-surface truncate">{p.name}</p>
                          <p className="text-[11px] font-mono text-on-surface-variant">{p.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Walk-in patient (if no match) */}
            {!selectedPatient && (
              <div className="mt-2 space-y-2">
                <p className="text-[10px] text-on-surface-variant/60 font-medium">Or enter walk-in patient details:</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Full name *"
                    value={form.patientName}
                    onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))}
                    className="px-3 py-2 text-xs rounded-lg border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-on-surface-variant/50"
                  />
                  <input
                    type="tel"
                    placeholder="Phone *"
                    value={form.patientPhone}
                    onChange={(e) => setForm((f) => ({ ...f, patientPhone: e.target.value }))}
                    className="px-3 py-2 text-xs rounded-lg border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-on-surface-variant/50"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={form.patientEmail}
                  onChange={(e) => setForm((f) => ({ ...f, patientEmail: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-on-surface-variant/50"
                />
              </div>
            )}
          </div>

          {/* ── Assigned Doctor ── */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">
              <Stethoscope className="w-3.5 h-3.5 inline mr-1 text-primary" />
              Assigned Doctor *
            </label>
            <select
              value={form.doctorId}
              onChange={(e) => {
                const docId = e.target.value;
                const found = doctors.find((d) => d.id === docId);
                setForm((f) => ({
                  ...f,
                  doctorId: docId,
                  doctorName: found?.fullName || "",
                }));
              }}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white font-medium"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName} ({d.specialization || "General Dentistry"})
                </option>
              ))}
              {doctors.length === 0 && (
                <option value="doc-1">Dr. Rajesh Sharma (Oral & Maxillofacial Surgery)</option>
              )}
            </select>
          </div>

          {/* ── Date & Time ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">Time *</label>
              <input
                type="time"
                value={(() => {
                  const m = form.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
                  if (!m) return "09:00";
                  let h = parseInt(m[1], 10);
                  if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
                  if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
                  return `${String(h).padStart(2, "0")}:${m[2]}`;
                })()}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":").map(Number);
                  const suffix = h >= 12 ? "PM" : "AM";
                  const h12 = h % 12 || 12;
                  setForm((f) => ({ ...f, time: `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}` }));
                }}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* ── Service ── */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">Service / Treatment *</label>
            <select
              value={form.service}
              onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
            >
              <option value="">Select a service…</option>
              {COMMON_SERVICES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="__custom__">Other (type below)</option>
            </select>
            {form.service === "__custom__" && (
              <input
                type="text"
                value={form.customService}
                onChange={(e) => setForm((f) => ({ ...f, customService: e.target.value }))}
                placeholder="Enter treatment name…"
                className="mt-2 w-full px-3 py-2.5 text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            )}
          </div>

          {/* ── Duration & Chair ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                <Clock className="w-3 h-3 inline mr-1 text-primary" />
                Duration
              </label>
              <select
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d} min</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                <Armchair className="w-3 h-3 inline mr-1 text-primary" />
                Chair
              </label>
              {isChairsError ? (
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Unable to load clinic chairs.
                  </p>
                  <button
                    type="button"
                    onClick={() => refetchChairs()}
                    className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : isLoadingChairs ? (
                <div className="flex items-center gap-2 py-2 text-xs text-on-surface-variant">
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  <span>Loading chairs…</span>
                </div>
              ) : activeChairs.length === 0 ? (
                <p className="text-[11px] font-bold text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  No active chairs configured.
                </p>
              ) : (
                <select
                  value={form.chairId}
                  onChange={(e) => setForm((f) => ({ ...f, chairId: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                >
                  <option value="">No Chair</option>
                  {activeChairs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* ── Initial Status ── */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">Initial Status</label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setForm((f) => ({ ...f, status: s }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    form.status === s
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-white text-on-surface-variant border-outline-variant/30 hover:border-primary/30"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={!isValid || mutation.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              {mutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
              ) : (
                "Book Appointment"
              )}
            </button>
          </div>

          {mutation.isError && (
            <p className="text-xs text-rose-600 text-center font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              {mutation.error instanceof Error ? mutation.error.message : "Failed to create appointment. Please try again."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
