"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, UserCircle, PhoneCall } from "lucide-react";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Appointments", href: "/book" },
  { label: "Services", href: "/services" },
  { label: "Our Team", href: "/about" },
  { label: "Reviews", href: "/gallery" },
];

export const BookingNavbar: React.FC = () => {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-outline-variant/20 sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between h-16 px-6">
        {/* Logo */}
        <Link href="/" className="font-bold text-xl text-primary flex items-center gap-2">
          <Image
            src="/sanjivanilogo.png"
            alt="Sanjivani Dental Clinic Logo"
            width={36}
            height={36}
            className="w-12 h-10 object-contain"
            priority
          />
          <span>DentaPure</span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "text-primary font-semibold border-b-2 border-primary pb-0.5"
                  : "text-secondary hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            aria-label="Notifications"
            className="p-2 rounded-full hover:bg-surface-variant transition-colors text-secondary"
          >
            <Bell className="w-5 h-5" />
          </button>
          <button
            aria-label="Account"
            className="p-2 rounded-full hover:bg-surface-variant transition-colors text-secondary"
          >
            <UserCircle className="w-5 h-5" />
          </button>
          <Link href="tel:+917775089777">
            <button className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer">
              <PhoneCall className="w-4 h-4" />
              Emergency Call
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
};
