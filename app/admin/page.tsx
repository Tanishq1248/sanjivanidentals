"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Stethoscope,
  CalendarDays,
  Users,
  Search,
  MoreVertical,
  TrendingUp,
  Clock,
  UserPlus,
  ChevronRight,
} from "lucide-react";

/* ─── Types ─── */
type TabKey = "Today" | "Upcoming" | "History";
type StatusKey = "Confirmed" | "In Progress" | "Pending" | "Cancelled";

interface Appointment {
  initials: string;
  avatarColor: string;
  name: string;
  id: string;
  service: string;
  time: string;
  status: StatusKey;
}

/* ─── Data ─── */
const appointments: Record<TabKey, Appointment[]> = {
  Today: [
    { initials: "SH", avatarColor: "bg-blue-500",   name: "Sarah Henderson", id: "#P-9021", service: "Root Canal Therapy",   time: "09:30 AM", status: "Confirmed" },
    { initials: "MJ", avatarColor: "bg-purple-500",  name: "Michael Jenkins", id: "#P-8842", service: "Dental Prophylaxis",   time: "11:00 AM", status: "In Progress" },
    { initials: "EW", avatarColor: "bg-emerald-500", name: "Emma Wilson",     id: "#P-9210", service: "Orthodontic Fitting",  time: "01:45 PM", status: "Pending" },
    { initials: "DR", avatarColor: "bg-orange-500",  name: "David Rivera",    id: "#P-7741", service: "Teeth Whitening",      time: "03:30 PM", status: "Cancelled" },
  ],
  Upcoming: [
    { initials: "LP", avatarColor: "bg-teal-500",    name: "Laura Peterson",  id: "#P-9310", service: "Dental Implants",      time: "Tomorrow 10:00 AM", status: "Confirmed" },
    { initials: "RC", avatarColor: "bg-rose-500",    name: "Ryan Chen",       id: "#P-8995", service: "Teeth Whitening",      time: "Tomorrow 02:00 PM", status: "Pending" },
  ],
  History: [
    { initials: "AM", avatarColor: "bg-sky-500",     name: "Anna Mitchell",   id: "#P-8600", service: "Root Canal Therapy",   time: "Jun 14, 09:00 AM", status: "Confirmed" },
    { initials: "TO", avatarColor: "bg-violet-500",  name: "Tom O'Brien",     id: "#P-8521", service: "Dental Prophylaxis",   time: "Jun 13, 11:30 AM", status: "Confirmed" },
    { initials: "JS", avatarColor: "bg-amber-500",   name: "Julia Santos",    id: "#P-8410", service: "Orthodontic Fitting",  time: "Jun 12, 03:00 PM", status: "Cancelled" },
  ],
};

const statusStyles: Record<StatusKey, string> = {
  "Confirmed":   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "In Progress": "bg-blue-50 text-blue-700 border border-blue-200",
  "Pending":     "bg-gray-100 text-gray-600 border border-gray-200",
  "Cancelled":   "bg-red-50 text-red-600 border border-red-200",
};

/* ─── Admin Page ─── */
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("Today");
  const [patient, setPatient] = useState({ name: "", phone: "", email: "", notes: "" });
  const [search, setSearch] = useState("");

  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setPatient({ ...patient, [e.target.name]: e.target.value });

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    setPatient({ name: "", phone: "", email: "", notes: "" });
  };

  const tabs: TabKey[] = ["Today", "Upcoming", "History"];

  return (
    <div className="min-h-screen flex bg-[#f2f5f8] font-sans">

      {/* ═══════════════════════════════════════
          LEFT SIDEBAR
      ═══════════════════════════════════════ */}
      <aside className="w-[200px] shrink-0 bg-white border-r border-outline-variant/20 flex flex-col sticky top-0 h-screen shadow-sm">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-outline-variant/20">
          <Link href="/" className="flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-primary" />
            <div>
              <p className="font-bold text-base text-primary leading-tight">DentaPure</p>
              <p className="text-[10px] text-on-surface-variant font-medium leading-tight">Clinical Excellence</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-3 py-6 flex-grow">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-secondary-container text-primary"
          >
            <CalendarDays className="w-4 h-4 shrink-0" />
            Appointments
          </Link>
          <Link
            href="/admin/patients"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-secondary hover:bg-surface-container-low hover:text-on-surface"
          >
            <Users className="w-4 h-4 shrink-0" />
            Patients
          </Link>
        </nav>

        {/* Contact Support */}
        <div className="px-3 py-5 border-t border-outline-variant/20">
          <button className="w-full bg-primary text-white text-sm font-semibold py-2.5 px-4 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer">
            Contact Support
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════
          MAIN AREA
      ═══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Bar */}
        <header className="bg-white border-b border-outline-variant/20 px-8 py-4 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-sm">
          <h1 className="text-xl font-bold text-primary shrink-0">Admin Dashboard</h1>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patients, doctors..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-outline-variant/40 bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-on-surface-variant/60"
            />
          </div>

          {/* Profile */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-on-surface leading-tight">Dr. Julian Moore</p>
              <p className="text-xs text-on-surface-variant">Senior Orthodontist</p>
            </div>
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-secondary-container shrink-0">
              <Image
                src="https://lh3.googleusercontent.com/aida/AP1WRLsuPHdERu4ervQ8YoyI2Fc4jec6pdmw_Mai4SlVJ8ZHoc20S2IC9iyEQEhFAV_vnSnAI5_ZxGeg8_XUbAJqi6IwsgA6kdZJjCQjZ3avoEgikDGiq3bcRK-jei3-5Jur8PY3okS_i6q8kmOgsq4FgnSdFNL-O4DqkW5GXb-pTZ5tX6QWKI_CAK7tGW0EOvn01UxAKBZL5R1ZrnIdCnAcomSL7jbbCuszIvu8fWl5zlkL4du7Hbw0uJfRZg"
                alt="Dr. Julian Moore"
                fill
                className="object-cover object-top"
                sizes="40px"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8">

          {/* ── Stats Row ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
            {/* Total Patients */}
            <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-on-surface-variant font-medium mb-1">Total Patients</p>
                <p className="text-4xl font-bold text-on-surface tracking-tight mb-1">1,284</p>
                <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+12% this month</span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-xl bg-secondary-container flex items-center justify-center shrink-0">
                <Users className="w-7 h-7 text-primary" />
              </div>
            </div>

            {/* New Appointments */}
            <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-on-surface-variant font-medium mb-1">New Appointments</p>
                <p className="text-4xl font-bold text-on-surface tracking-tight mb-1">18</p>
                <div className="flex items-center gap-1 text-on-surface-variant text-xs font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>6 pending approval</span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-xl bg-[#ede9fe] flex items-center justify-center shrink-0">
                <CalendarDays className="w-7 h-7 text-purple-600" />
              </div>
            </div>
          </div>

          {/* ── Bottom Grid: Table + Registry ── */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

            {/* Appointments Table */}
            <div className="xl:col-span-8 bg-white rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
              {/* Table Header */}
              <div className="px-6 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/10">
                <h2 className="text-lg font-bold text-on-surface leading-snug">
                  Appointments<br />Management
                </h2>
                {/* Tabs */}
                <div className="flex gap-1 bg-surface-container-low rounded-lg p-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                        activeTab === tab
                          ? "bg-white text-primary shadow-sm"
                          : "text-secondary hover:text-on-surface"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline-variant/10">
                      <th className="text-left px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Patient</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Service</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Time</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments[activeTab].map((apt, i) => (
                      <tr
                        key={i}
                        className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-low/50 transition-colors"
                      >
                        {/* Patient */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full ${apt.avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                              {apt.initials}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-on-surface leading-tight">{apt.name}</p>
                              <p className="text-xs text-on-surface-variant">{apt.id}</p>
                            </div>
                          </div>
                        </td>
                        {/* Service */}
                        <td className="px-4 py-4">
                          <p className="text-sm text-on-surface">{apt.service}</p>
                        </td>
                        {/* Time */}
                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-on-surface whitespace-nowrap">{apt.time}</p>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[apt.status]}`}>
                            {apt.status}
                          </span>
                        </td>
                        {/* Action */}
                        <td className="px-4 py-4">
                          <button className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* View All link */}
              <div className="px-6 py-3 border-t border-outline-variant/10">
                <button className="text-sm text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer">
                  View all appointments <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Patient Registry Panel */}
            <div className="xl:col-span-4 bg-white rounded-xl border border-outline-variant/10 shadow-sm">
              <div className="px-6 pt-6 pb-4 border-b border-outline-variant/10 flex items-center justify-between">
                <h2 className="text-lg font-bold text-on-surface">Patient Registry</h2>
                <div className="w-9 h-9 rounded-lg bg-secondary-container flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
              </div>

              <form onSubmit={handleAddPatient} className="px-6 py-5 flex flex-col gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={patient.name}
                    onChange={handlePatientChange}
                    placeholder="John Doe"
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={patient.phone}
                    onChange={handlePatientChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={patient.email}
                    onChange={handlePatientChange}
                    placeholder="john.doe@example.com"
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Notes</label>
                  <textarea
                    name="notes"
                    value={patient.notes}
                    onChange={handlePatientChange}
                    placeholder="Clinical history notes..."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg transition-colors text-sm active:scale-[0.99] cursor-pointer mt-1"
                >
                  Add New Patient
                </button>
              </form>
            </div>

          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-outline-variant/20 px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
            <p>© 2024 DentaPure Clinical Excellence. All rights reserved.</p>
            <div className="flex items-center gap-4 font-medium">
              <Link href="/#privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="/#hipaa" className="hover:text-primary transition-colors">HIPAA Compliance</Link>
              <Link href="/#accessibility" className="hover:text-primary transition-colors">Accessibility</Link>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
