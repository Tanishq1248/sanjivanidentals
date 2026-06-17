"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Smartphone,
  CalendarDays,
  Clock,
  Tag,
  ArrowRight,
  MapPin,
  Phone,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { BookingNavbar } from "../../components/layout/BookingNavbar";

const timeSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM",
  "4:30 PM", "5:00 PM",
];

const visitReasons = [
  "Routine Checkup & Cleaning",
  "Tooth Pain / Toothache",
  "Teeth Whitening",
  "Braces / Orthodontics Consultation",
  "Root Canal Treatment",
  "Dental Implants",
  "Cavity Filling",
  "Gum Disease Treatment",
  "Cosmetic Consultation",
  "Emergency Dental Care",
  "Other",
];

export default function BookingPage() {
  const [form, setForm] = useState({ name: "", whatsapp: "", date: "", time: "", reason: "" });
  const [submitted, setSubmitted] = useState(false);
  const [minDate, setMinDate] = useState("");

  // Set min date client-side only to avoid hydration mismatch
  React.useEffect(() => {
    setMinDate(new Date().toISOString().split("T")[0]);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6f9]">
      {/* Custom Booking Navbar */}
      <BookingNavbar />

      {/* Main Content */}
      <main className="flex-grow max-w-[1200px] mx-auto w-full px-6 py-12">
        {/* Page Title */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-on-surface tracking-tight mb-2">
            Book Your Appointment
          </h1>
          <p className="text-on-surface-variant text-base">
            Take the first step toward a healthier smile.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Booking Form */}
          <div className="lg:col-span-8">
            {submitted ? (
              <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-level-1 p-10 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-on-surface mb-3">Appointment Requested!</h2>
                <p className="text-on-surface-variant text-sm max-w-sm leading-relaxed mb-6">
                  Thank you, <strong>{form.name}</strong>. We&apos;ve received your appointment request for{" "}
                  <strong>{form.date} at {form.time}</strong>. We will confirm via WhatsApp shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-primary text-sm font-semibold hover:underline"
                >
                  Book another appointment
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl border border-outline-variant/10 shadow-level-1 p-8 md:p-10"
              >
                {/* Patient Name */}
                <div className="mb-6">
                  <label htmlFor="name" className="block text-sm font-semibold text-on-surface mb-2">
                    Patient Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                    <input
                      id="name" name="name" type="text"
                      value={form.name} onChange={handleChange}
                      placeholder="John Doe" required
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant/40 bg-surface text-on-surface text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* WhatsApp Number */}
                <div className="mb-6">
                  <label htmlFor="whatsapp" className="block text-sm font-semibold text-on-surface mb-2">
                    WhatsApp Number
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                    <input
                      id="whatsapp" name="whatsapp" type="tel"
                      value={form.whatsapp} onChange={handleChange}
                      placeholder="+1 (555) 000-0000" required
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant/40 bg-surface text-on-surface text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                  <div>
                    <label htmlFor="date" className="block text-sm font-semibold text-on-surface mb-2">
                      Preferred Date
                    </label>
                    <div className="relative">
                      <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                      <input
                        id="date" name="date" type="date"
                        value={form.date} onChange={handleChange} required
                        min={minDate}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant/40 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="time" className="block text-sm font-semibold text-on-surface mb-2">
                      Preferred Time Slot
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                      <select
                        id="time" name="time"
                        value={form.time} onChange={handleChange} required
                        className="w-full pl-10 pr-8 py-3 rounded-lg border border-outline-variant/40 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer"
                      >
                        <option value="" disabled>Select a time</option>
                        {timeSlots.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reason for Visit */}
                <div className="mb-8">
                  <label htmlFor="reason" className="block text-sm font-semibold text-on-surface mb-2">
                    Reason for Visit
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                    <select
                      id="reason" name="reason"
                      value={form.reason} onChange={handleChange} required
                      className="w-full pl-10 pr-8 py-3 rounded-lg border border-outline-variant/40 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select reason</option>
                      {visitReasons.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full bg-primary-container hover:bg-primary text-white font-semibold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 active:scale-[0.99] cursor-pointer text-base shadow-level-1"
                >
                  <span>Confirm Appointment</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            )}
          </div>

          {/* Right: Clinic Info Sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-level-1 overflow-hidden">
              <div className="p-6 pb-4">
                <h2 className="text-xl font-bold text-on-surface mb-5">Visit Our Clinic</h2>

                {/* Address */}
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-[#e3f2fd] flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Address</p>
                    <p className="text-sm text-on-surface font-medium leading-snug">
                      123 Dental Excellence Way<br />Medical District, City 90210
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-[#e3f2fd] flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Phone</p>
                    <a href="tel:+11234567890" className="text-sm text-on-surface font-medium hover:text-primary transition-colors">
                      +1 234 567 890
                    </a>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-3 mb-6">
                  <div className="w-9 h-9 rounded-lg bg-[#e3f2fd] flex items-center justify-center shrink-0 mt-0.5">
                    <MessageCircle className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">WhatsApp</p>
                    <a
                      href="https://wa.me/11234567890"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary font-semibold hover:underline flex items-center gap-1"
                    >
                      Message Us<ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Map Thumbnail */}
              <div className="relative h-[160px] bg-surface-container overflow-hidden cursor-pointer group">
                <Image
                  src="https://lh3.googleusercontent.com/aida/AP1WRLt43UBMaH9snYTLBPmZDqqVswmL8FRptTwsJinWM9PryIX5AYDeC8eGHaXeHv0l4u5S7T0GBohy8nLR5tXQJt-SbIVlwj6Qb3u3n7-QBNLo1NMYhrlmOTPK71y1cRhQN3Gt1UkyIGg-X0nedLqMP_x1kfCw7Vj4w9_zhoYkfR9xW-pBQ3tm8kfIvueHk6yyIt0I0pJvvCfk8b5pChceEnBEO83e85y1IzYdR5dLn2tDAKdriHLOxqk_s4w"
                  alt="Clinic location map"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="400px"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/90 hover:bg-white text-on-surface font-semibold text-sm px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-md"
                  >
                    <MapPin className="w-4 h-4 text-primary" />
                    View Map
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-outline-variant/20 py-6 px-6 w-full">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-bold text-xl text-primary">DentaPure</div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center text-sm text-secondary font-medium">
            <Link href="/#privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/#terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="/#hipaa" className="hover:text-primary transition-colors">HIPAA Compliance</Link>
            <Link href="/#contact" className="hover:text-primary transition-colors">Contact Support</Link>
          </div>
          <p className="text-xs text-on-surface-variant text-center md:text-right">
            © 2024 DentaPure Clinical Group. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
