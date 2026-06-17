"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Stethoscope,
  CalendarDays,
  Users,
  Search,
  UserPlus,
  TrendingUp,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Phone,
} from "lucide-react";

/* ─── WhatsApp SVG Icon ─── */
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/* ─── Types ─── */
interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
  age: string;
  lastVisit: string;
  condition: string;
  notes: string;
  avatarColor: string;
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-orange-500",
  "bg-teal-500", "bg-rose-500", "bg-sky-500", "bg-violet-500",
  "bg-amber-500", "bg-indigo-500",
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function buildWhatsAppUrl(phone: string, name: string) {
  const digits = phone.replace(/\D/g, "");
  const message = encodeURIComponent(
    `Hello ${name}! 👋 This is DentaPure Clinic. We hope you're doing well! We'd like to schedule your next appointment at your convenience. Please reply to this message to confirm a suitable date and time. Looking forward to seeing you! 😊\n\n– DentaPure Clinical Excellence`
  );
  return `https://wa.me/${digits}?text=${message}`;
}

/* ─── Seed Data ─── */
const seedPatients: Patient[] = [
  { id: "P-9021", name: "Sarah Henderson", phone: "+1 (555) 901-2100", email: "sarah.h@email.com",   age: "32", lastVisit: "Jun 14, 2024", condition: "Root Canal",        notes: "Follow-up in 6 weeks",          avatarColor: "bg-blue-500" },
  { id: "P-8842", name: "Michael Jenkins", phone: "+1 (555) 884-2000", email: "m.jenkins@email.com", age: "45", lastVisit: "Jun 13, 2024", condition: "Prophylaxis",        notes: "Mild gum sensitivity",           avatarColor: "bg-purple-500" },
  { id: "P-9210", name: "Emma Wilson",     phone: "+1 (555) 921-0300", email: "emma.w@email.com",    age: "28", lastVisit: "Jun 12, 2024", condition: "Orthodontics",       notes: "Braces adjustment scheduled",    avatarColor: "bg-emerald-500" },
  { id: "P-7741", name: "David Rivera",    phone: "+1 (555) 774-1000", email: "d.rivera@email.com",  age: "37", lastVisit: "Jun 10, 2024", condition: "Teeth Whitening",    notes: "Second session pending",         avatarColor: "bg-orange-500" },
  { id: "P-9310", name: "Laura Peterson",  phone: "+1 (555) 931-0400", email: "l.peterson@email.com",age: "51", lastVisit: "May 28, 2024", condition: "Dental Implants",    notes: "Post-op check required",         avatarColor: "bg-teal-500" },
];

/* ─── Empty form ─── */
const emptyForm = { name: "", phone: "", email: "", age: "", lastVisit: "", condition: "", notes: "" };

/* ─── Patients Page ─── */
export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>(seedPatients);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  /* ── Helpers ── */
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setPatients((prev) =>
        prev.map((p) =>
          p.id === editingId ? { ...p, ...form } : p
        )
      );
      showToast("Patient details updated!");
      setEditingId(null);
    } else {
      const newPatient: Patient = {
        ...form,
        id: `P-${Math.floor(1000 + Math.random() * 9000)}`,
        avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      };
      setPatients((prev) => [newPatient, ...prev]);
      showToast("Patient added successfully!");
    }
    setForm(emptyForm);
  };

  const handleEdit = (p: Patient) => {
    setEditingId(p.id);
    setForm({ name: p.name, phone: p.phone, email: p.email, age: p.age, lastVisit: p.lastVisit, condition: p.condition, notes: p.notes });
  };

  const handleDelete = (id: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== id));
    if (editingId === id) { setEditingId(null); setForm(emptyForm); }
    showToast("Patient removed.");
  };

  const handleCancel = () => { setEditingId(null); setForm(emptyForm); };

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.condition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex bg-[#f2f5f8] font-sans">

      {/* ═══ SIDEBAR ═══ */}
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

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3 py-6 flex-grow">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-secondary hover:bg-surface-container-low hover:text-on-surface"
          >
            <CalendarDays className="w-4 h-4 shrink-0" />
            Appointments
          </Link>
          <Link
            href="/admin/patients"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-secondary-container text-primary"
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

      {/* ═══ MAIN ═══ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Bar */}
        <header className="bg-white border-b border-outline-variant/20 px-8 py-4 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-sm">
          <h1 className="text-xl font-bold text-primary shrink-0">Patient Management</h1>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, condition..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-outline-variant/40 bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-on-surface-variant/60"
            />
          </div>
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

        <main className="flex-1 p-8">

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-on-surface-variant font-medium mb-1">Total Patients</p>
                <p className="text-3xl font-bold text-on-surface">{patients.length}</p>
                <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold mt-0.5">
                  <TrendingUp className="w-3 h-3" /><span>+12% this month</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-on-surface-variant font-medium mb-1">New This Month</p>
                <p className="text-3xl font-bold text-on-surface">24</p>
                <p className="text-xs text-on-surface-variant mt-0.5">Registered recently</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#ede9fe] flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-on-surface-variant font-medium mb-1">WhatsApp Reachable</p>
                <p className="text-3xl font-bold text-on-surface">{patients.filter(p => p.phone).length}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">With phone numbers</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#dcfce7] flex items-center justify-center">
                <WhatsAppIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

            {/* ── Patient Table ── */}
            <div className="xl:col-span-8 bg-white rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
              <div className="px-6 pt-5 pb-4 border-b border-outline-variant/10 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-on-surface">Patient Registry</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">{filtered.length} patient{filtered.length !== 1 ? "s" : ""} found</p>
                </div>
                <button
                  onClick={() => { handleCancel(); }}
                  className="flex items-center gap-1.5 text-sm text-primary font-semibold px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-secondary-container transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Add New
                </button>
              </div>

              <div className="overflow-x-auto">
                {filtered.length === 0 ? (
                  <div className="py-16 text-center text-on-surface-variant">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No patients found</p>
                    <p className="text-xs mt-1">Try a different search or add a new patient</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-outline-variant/10 bg-surface-container-low/50">
                        <th className="text-left px-5 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Patient</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Contact</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Condition</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Last Visit</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((p) => (
                        <tr
                          key={p.id}
                          className={`border-b border-outline-variant/10 last:border-0 transition-colors ${editingId === p.id ? "bg-secondary-container/20" : "hover:bg-surface-container-low/40"}`}
                        >
                          {/* Patient */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full ${p.avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                {getInitials(p.name)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-on-surface leading-tight">{p.name}</p>
                                <p className="text-xs text-on-surface-variant">#{p.id}{p.age ? ` · Age ${p.age}` : ""}</p>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="px-4 py-3.5">
                            <p className="text-xs font-medium text-on-surface">{p.phone}</p>
                            <p className="text-xs text-on-surface-variant truncate max-w-[140px]">{p.email}</p>
                          </td>

                          {/* Condition */}
                          <td className="px-4 py-3.5">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary-container text-primary">
                              {p.condition || "—"}
                            </span>
                            {p.notes && (
                              <p className="text-xs text-on-surface-variant mt-1 max-w-[140px] truncate">{p.notes}</p>
                            )}
                          </td>

                          {/* Last Visit */}
                          <td className="px-4 py-3.5">
                            <p className="text-xs font-medium text-on-surface whitespace-nowrap">{p.lastVisit || "—"}</p>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              {/* WhatsApp */}
                              <a
                                href={buildWhatsAppUrl(p.phone, p.name)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Send WhatsApp message to ${p.name}`}
                                className="w-8 h-8 rounded-lg bg-[#dcfce7] hover:bg-green-200 flex items-center justify-center transition-colors cursor-pointer group"
                              >
                                <WhatsAppIcon className="w-4 h-4 text-green-600 group-hover:text-green-700" />
                              </a>

                              {/* Call */}
                              <a
                                href={`tel:${p.phone.replace(/\D/g, "")}`}
                                title={`Call ${p.name}`}
                                className="w-8 h-8 rounded-lg bg-secondary-container hover:bg-primary/10 flex items-center justify-center transition-colors cursor-pointer group"
                              >
                                <Phone className="w-3.5 h-3.5 text-primary group-hover:text-primary" />
                              </a>

                              {/* Edit */}
                              <button
                                onClick={() => handleEdit(p)}
                                title="Edit patient"
                                className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer group"
                              >
                                <Pencil className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-primary" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDelete(p.id)}
                                title="Delete patient"
                                className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer group"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* ── Add / Edit Form ── */}
            <div className="xl:col-span-4">
              <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm sticky top-24">
                {/* Form header */}
                <div className="px-6 pt-5 pb-4 border-b border-outline-variant/10 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-on-surface">
                      {editingId ? "Edit Patient" : "Add New Patient"}
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {editingId ? `Editing #${editingId}` : "Fill in the patient details below"}
                    </p>
                  </div>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${editingId ? "bg-amber-100" : "bg-secondary-container"}`}>
                    {editingId
                      ? <Pencil className="w-4 h-4 text-amber-600" />
                      : <UserPlus className="w-5 h-5 text-primary" />
                    }
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-3.5">
                  {/* Name */}
                  <div>
                    <label htmlFor="patient-name" className="block text-xs font-semibold text-on-surface-variant mb-1.5">Full Name *</label>
                    <input
                      id="patient-name"
                      type="text" name="name" value={form.name ?? ""} onChange={handleChange}
                      placeholder="e.g. Jane Smith" required
                      autoComplete="off"
                      className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="patient-phone" className="block text-xs font-semibold text-on-surface-variant mb-1.5">WhatsApp / Phone *</label>
                    <input
                      id="patient-phone"
                      type="tel" name="phone" value={form.phone ?? ""} onChange={handleChange}
                      placeholder="+1 (555) 000-0000" required
                      autoComplete="off"
                      className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="patient-email" className="block text-xs font-semibold text-on-surface-variant mb-1.5">Email Address</label>
                    <input
                      id="patient-email"
                      type="email" name="email" value={form.email ?? ""} onChange={handleChange}
                      placeholder="jane@example.com"
                      autoComplete="off"
                      className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Age + Last Visit in a row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="patient-age" className="block text-xs font-semibold text-on-surface-variant mb-1.5">Age</label>
                      <input
                        id="patient-age"
                        type="number" name="age" value={form.age ?? ""} onChange={handleChange}
                        placeholder="e.g. 34" min="1" max="120"
                        className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="patient-last-visit" className="block text-xs font-semibold text-on-surface-variant mb-1.5">Last Visit</label>
                      <input
                        id="patient-last-visit"
                        type="date" name="lastVisit" value={form.lastVisit ?? ""} onChange={handleChange}
                        className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Condition */}
                  <div>
                    <label htmlFor="patient-condition" className="block text-xs font-semibold text-on-surface-variant mb-1.5">Treatment / Condition</label>
                    <input
                      id="patient-condition"
                      type="text" name="condition" value={form.condition ?? ""} onChange={handleChange}
                      placeholder="e.g. Root Canal, Whitening"
                      autoComplete="off"
                      className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label htmlFor="patient-notes" className="block text-xs font-semibold text-on-surface-variant mb-1.5">Clinical Notes</label>
                    <textarea
                      id="patient-notes"
                      name="notes" value={form.notes ?? ""} onChange={handleChange}
                      placeholder="Any relevant medical notes..."
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 pt-1">
                    {editingId && (
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="flex-1 border border-outline-variant/40 text-on-surface-variant text-sm font-semibold py-2.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className={`${editingId ? "flex-1" : "w-full"} bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.99]`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {editingId ? "Save Changes" : "Add Patient"}
                    </button>
                  </div>

                  {/* WhatsApp hint */}
                  {form.phone && (
                    <a
                      href={buildWhatsAppUrl(form.phone, form.name || "Patient")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-xs text-green-700 font-semibold bg-[#dcfce7] hover:bg-green-200 transition-colors py-2 rounded-lg cursor-pointer"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                      Preview appointment message on WhatsApp
                    </a>
                  )}
                </form>
              </div>
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

      {/* ─── Toast Notification ─── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-on-surface text-surface text-sm font-medium px-4 py-3 rounded-xl shadow-level-2 flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {toast}
        </div>
      )}
    </div>
  );
}
