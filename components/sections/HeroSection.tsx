import React from "react";
import Image from "next/image";
import { BadgeCheck, ArrowRight, Phone, Star, ShieldCheck } from "lucide-react";
import { Button } from "../ui/Button";

export const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/15 to-surface/40 z-10" />
          <Image
            alt="State-of-the-art dental clinic interior"
            fill
            className="object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBB92UiwKLYACKA2yvVrGpGb6umiEkceHAGqoD6QLZs0ZlvyfymS-svQMBX3Udrvqt7MXleDGIMYgvrLT3LGfTLx9yiQZG4s_uL-KavCjwbR9g_u5FZx9_-N9csrIFahbtDAw1ZbgRht1DJIebhRExz_yEa81V-iJK9_jYhTDP-jMgg76H1XiT60DJGMDdw69iedWrluoZ5JeBgec8OnEACYB1OsT1XfBb47DCosh3cysUYBx7QJkC3_YbFDC3Bz9SUY0nJIQESYoM"
            priority
          />
        </div>

      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 py-20 md:py-28 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col items-start justify-center gap-6">
          {/* Award Badge */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-secondary-container/60 rounded-full text-primary font-semibold text-xs tracking-wide backdrop-blur-sm border border-secondary-container">
            <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
            <span>Award-Winning Dental Care</span>
          </div>

          {/* Heading */}
          <h1 className="font-bold text-4xl md:text-5xl lg:text-6xl text-on-surface tracking-tight max-w-2xl leading-[1.1]">
            Premium Dental Care <br />
            <span className="text-primary-container">You Can Trust</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-on-surface-variant max-w-xl leading-relaxed">
            Experience world-class dental treatments in a modern, welcoming environment. Dedicated to your smile and oral health.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full sm:w-auto">
            <Button variant="primary" size="lg" className="flex items-center gap-2">
              <span>Book Appointment</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg" className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-black fill-primary" />
              <span className="text-blac">1800-DENTAL</span>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 flex items-center gap-6 text-on-surface-variant text-sm font-semibold opacity-90">
            <div className="flex items-center gap-1.5">
              <Star className="w-5 h-5 text-primary-container fill-primary-container" />
              <span>4.9/5 Average Rating</span>
            </div>
            <div className="w-px h-5 bg-outline-variant"></div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-primary-container" />
              <span>ISO Certified</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
