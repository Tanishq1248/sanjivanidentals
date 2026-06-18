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
  Menu,
  X,
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

/* ─── Sidebar component (shared) ─── */
function Sidebar({ currentPage, onClose }: { currentPage: "appointments" | "patients"; onClose?: () => void }) {
  return (
    <aside className="w-full h-full bg-white flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-outline-variant/20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" onClick={onClose}>
          <Stethoscope className="w-6 h-6 text-primary" />
          <div>
            <p className="font-bold text-base text-primary leading-tight">DentaPure</p>
            <p className="text-[10px] text-on-surface-variant font-medium leading-tight">Clinical Excellence</p>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 px-3 py-6 flex-grow">
        <Link
          href="/admin"
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            currentPage === "appointments"
              ? "bg-secondary-container text-primary"
              : "text-secondary hover:bg-surface-container-low hover:text-on-surface"
          }`}
        >
          <CalendarDays className="w-4 h-4 shrink-0" />
          Appointments
        </Link>
        <Link
          href="/admin/patients"
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            currentPage === "patients"
              ? "bg-secondary-container text-primary"
              : "text-secondary hover:bg-surface-container-low hover:text-on-surface"
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          Patients
        </Link>
      </nav>

      {/* Support */}
      <div className="px-3 py-5 border-t border-outline-variant/20">
        <button className="w-full bg-primary text-white text-sm font-semibold py-2.5 px-4 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer">
          Contact Support
        </button>
      </div>
    </aside>
  );
}

/* ─── Admin Page ─── */
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("Today");
  const [patient, setPatient] = useState({ name: "", phone: "", email: "", notes: "" });
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setPatient({ ...patient, [e.target.name]: e.target.value });

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    setPatient({ name: "", phone: "", email: "", notes: "" });
  };

  const tabs: TabKey[] = ["Today", "Upcoming", "History"];

  return (
    <div className="min-h-screen flex bg-[#f2f5f8] font-sans">

      {/* ── Mobile Sidebar Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-[200px] shrink-0 border-r border-outline-variant/20 sticky top-0 h-screen shadow-sm flex-col">
        <Sidebar currentPage="appointments" />
      </aside>

      {/* ── Mobile Sidebar Drawer ── */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[220px] shadow-level-2 transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar currentPage="appointments" onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ═══ MAIN AREA ═══ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Bar */}
        <header className="bg-white border-b border-outline-variant/20 px-4 md:px-8 py-4 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-surface-variant text-primary shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-lg md:text-xl font-bold text-primary shrink-0">Admin Dashboard</h1>

          {/* Search — hidden on very small, flex-1 on sm+ */}
          <div className="relative flex-1 max-w-sm hidden sm:block ml-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patients..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-outline-variant/40 bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-on-surface-variant/60"
            />
          </div>

          {/* Profile */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-auto">
            <div className="text-right hidden lg:block">
              <p className="text-sm font-semibold text-on-surface leading-tight">Dr. Julian Moore</p>
              <p className="text-xs text-on-surface-variant">Senior Orthodontist</p>
            </div>
            <div className="relative w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-secondary-container shrink-0">
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

        {/* Mobile Search Bar */}
        <div className="sm:hidden px-4 pt-3 pb-1 bg-[#f2f5f8]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patients..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-outline-variant/40 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-on-surface-variant/60"
            />
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8">

          {/* ── Stats Row ── */}
          <div className="grid grid-cols-2 gap-4 mb-6 md:mb-8">
            {/* Total Patients */}
            <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-4 md:p-6 flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-on-surface-variant font-medium mb-1">Total Patients</p>
                <p className="text-2xl md:text-4xl font-bold text-on-surface tracking-tight mb-1">1,284</p>
                <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">+12% this month</span>
                  <span className="xs:hidden">+12%</span>
                </div>
              </div>
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-secondary-container flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 md:w-7 md:h-7 text-primary" />
              </div>
            </div>

            {/* New Appointments */}
            <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-4 md:p-6 flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-on-surface-variant font-medium mb-1">New Appointments</p>
                <p className="text-2xl md:text-4xl font-bold text-on-surface tracking-tight mb-1">18</p>
                <div className="flex items-center gap-1 text-on-surface-variant text-xs font-medium">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>6 pending</span>
                </div>
              </div>
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-[#ede9fe] flex items-center justify-center shrink-0">
                <CalendarDays className="w-5 h-5 md:w-7 md:h-7 text-purple-600" />
              </div>
            </div>
          </div>

          {/* ── Bottom Grid ── */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

            {/* Appointments Table / Cards */}
            <div className="xl:col-span-8 bg-white rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-4 md:px-6 pt-5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/10">
                <h2 className="text-base md:text-lg font-bold text-on-surface">Appointments</h2>
                {/* Tabs */}
                <div className="flex gap-1 bg-surface-container-low rounded-lg p-1 self-start sm:self-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${
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

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
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
                        <td className="px-4 py-4"><p className="text-sm text-on-surface">{apt.service}</p></td>
                        <td className="px-4 py-4"><p className="text-sm font-medium text-on-surface whitespace-nowrap">{apt.time}</p></td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[apt.status]}`}>
                            {apt.status}
                          </span>
                        </td>
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

              {/* Mobile Card List */}
              <div className="md:hidden divide-y divide-outline-variant/10">
                {appointments[activeTab].map((apt, i) => (
                  <div key={i} className="px-4 py-4 flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full ${apt.avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5`}>
                      {apt.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-on-surface leading-tight">{apt.name}</p>
                          <p className="text-xs text-on-surface-variant">{apt.id}</p>
                        </div>
                        <button className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-on-surface mt-1">{apt.service}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyles[apt.status]}`}>
                          {apt.status}
                        </span>
                        <span className="text-xs text-on-surface-variant">{apt.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* View All */}
              <div className="px-4 md:px-6 py-3 border-t border-outline-variant/10">
                <button className="text-sm text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer">
                  View all appointments <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Patient Registry Panel */}
            <div className="xl:col-span-4 bg-white rounded-xl border border-outline-variant/10 shadow-sm">
              <div className="px-4 md:px-6 pt-5 pb-4 border-b border-outline-variant/10 flex items-center justify-between">
                <h2 className="text-base md:text-lg font-bold text-on-surface">Patient Registry</h2>
                <div className="w-9 h-9 rounded-lg bg-secondary-container flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
              </div>

              <form onSubmit={handleAddPatient} className="px-4 md:px-6 py-5 flex flex-col gap-4">
                <div>
                  <label htmlFor="reg-name" className="block text-xs font-semibold text-on-surface-variant mb-1.5">Full Name</label>
                  <input
                    id="reg-name"
                    type="text" name="name" value={patient.name} onChange={handlePatientChange}
                    placeholder="John Doe"
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="reg-phone" className="block text-xs font-semibold text-on-surface-variant mb-1.5">Phone Number</label>
                  <input
                    id="reg-phone"
                    type="tel" name="phone" value={patient.phone} onChange={handlePatientChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="reg-email" className="block text-xs font-semibold text-on-surface-variant mb-1.5">Email Address</label>
                  <input
                    id="reg-email"
                    type="email" name="email" value={patient.email} onChange={handlePatientChange}
                    placeholder="john.doe@example.com"
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="reg-notes" className="block text-xs font-semibold text-on-surface-variant mb-1.5">Notes</label>
                  <textarea
                    id="reg-notes"
                    name="notes" value={patient.notes} onChange={handlePatientChange}
                    placeholder="Clinical history notes..."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  />
                </div>
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
        <footer className="bg-white border-t border-outline-variant/20 px-4 md:px-8 py-4">
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
