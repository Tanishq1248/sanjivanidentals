import React from "react";
import Link from "next/link";
import { Stethoscope, Phone, Mail, Clock, MapPin } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant/20 w-full mt-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-16 px-6 max-w-[1200px] mx-auto">
        {/* Brand Column */}
        <div className="flex flex-col gap-4">
          <Link href="/" className="font-semibold text-2xl text-primary flex items-center gap-2">
            <Stethoscope className="w-7 h-7 text-primary" />
            <span>DentaPure</span>
          </Link>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Delivering clinical excellence and compassionate care in a state-of-the-art environment.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-3">
          <h4 className="font-semibold text-on-surface text-sm tracking-wider uppercase mb-1">
            Patient Links
          </h4>
          <Link href="/#emergency" className="text-sm text-on-surface-variant hover:text-primary transition-colors">
            Emergency Care
          </Link>
          <Link href="/#portal" className="text-sm text-on-surface-variant hover:text-primary transition-colors">
            Patient Portal
          </Link>
          <Link href="/#privacy" className="text-sm text-on-surface-variant hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <Link href="/#terms" className="text-sm text-on-surface-variant hover:text-primary transition-colors">
            Terms of Service
          </Link>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col gap-3">
          <h4 className="font-semibold text-on-surface text-sm tracking-wider uppercase mb-1">
            Contact Us
          </h4>
          <div className="flex items-start gap-2 text-on-surface-variant text-sm">
            <Phone className="w-5 h-5 text-primary-container shrink-0 mt-0.5" />
            <span>
              <strong>1800-DENTAL</strong>
              <br />
              Emergency line available 24/7
            </span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant text-sm">
            <Mail className="w-5 h-5 text-primary-container shrink-0" />
            <span>care@dentapure.com</span>
          </div>
        </div>

        {/* Hours & Location */}
        <div className="flex flex-col gap-3">
          <h4 className="font-semibold text-on-surface text-sm tracking-wider uppercase mb-1">
            Hours & Location
          </h4>
          <div className="flex items-start gap-2 text-on-surface-variant text-sm">
            <Clock className="w-5 h-5 text-primary-container shrink-0 mt-0.5" />
            <span>
              Mon-Sat: 9 AM - 8 PM
              <br />
              Sunday: Closed
            </span>
          </div>
          <div className="flex items-start gap-2 text-on-surface-variant text-sm">
            <MapPin className="w-5 h-5 text-primary-container shrink-0 mt-0.5" />
            <span>
              123 Medical Plaza
              <br />
              Suite 400
              <br />
              Healthcare City, HC 12345
            </span>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-outline-variant/20 py-6 px-6 text-center">
        <p className="text-xs text-on-surface-variant">
          © 2024 DentaPure Clinical Excellence. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
