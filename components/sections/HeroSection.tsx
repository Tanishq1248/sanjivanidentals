import React from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ArrowRight, Phone, Star, ShieldCheck } from "lucide-react";
import { Button } from "../ui/Button";
import { ScrollReveal } from "../ui/ScrollReveal";

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" {...props}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436.002 9.858-4.42 9.86-9.86.001-2.63-1.019-5.101-2.873-6.958C16.602 1.93 14.136.91 11.52.91c-5.44 0-9.863 4.418-9.865 9.858-.002 1.802.483 3.55 1.401 5.068L2.005 21.99l6.326-1.66c-.95.52-1.92.83-1.684.824z" />
    <path d="M15.97 12.922c-.258-.13-1.522-.752-1.758-.838-.237-.086-.408-.13-.578.13-.17.259-.656.838-.804.99-.15.152-.298.172-.556.043-.258-.13-1.09-.402-2.077-1.28-.767-.684-1.285-1.53-1.436-1.788-.15-.258-.016-.399.113-.527.117-.117.258-.299.387-.447.13-.15.172-.258.258-.43.086-.173.043-.322-.022-.452-.064-.13-.578-1.393-.792-1.91-.21-.506-.44-.437-.603-.437h-.514c-.173 0-.455.064-.693.322-.238.258-.91.888-.91 2.164s.927 2.513 1.056 2.685c.13.172 1.825 2.787 4.42 3.904.618.266 1.1.424 1.477.544.62.197 1.185.169 1.632.102.497-.074 1.522-.623 1.737-1.226.215-.603.215-1.12.15-1.228-.064-.11-.237-.17-.496-.3z" />
  </svg>
);

export const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-[90vh] md:min-h-[85vh] flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Background Image with Responsive Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 lg:via-slate-950/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent lg:hidden z-10" />
        <Image
          alt="Warm, friendly dental consultation at Sanjivani Dental Clinic"
          fill
          className="object-cover object-[center_right] opacity-75 lg:opacity-90"
          src="/interior.webp"
          priority
        />
      </div>

      <div className="relative z-20 w-full max-w-[1200px] mx-auto px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 flex flex-col items-start justify-center gap-6">
          
          {/* Active Urgency Status Badge */}
          <ScrollReveal delay={100} duration={600} distance="15px">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 font-semibold text-xs tracking-wide backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Now Accepting New Patients</span>
              <span className="hidden sm:inline text-emerald-500/50">|</span>
              <span className="hidden sm:inline">Book Today, Get Seen This Week</span>
            </div>
          </ScrollReveal>

          {/* Heading */}
          <ScrollReveal delay={250} duration={800} distance="25px">
            <h1 className="font-bold text-4xl md:text-5xl lg:text-6xl text-white tracking-tight max-w-2xl leading-[1.15]">
              Your Smile Deserves<br />
              <span className="text-primary-container">World-Class Care</span>
            </h1>
          </ScrollReveal>

          {/* Subheading */}
          <ScrollReveal delay={400} duration={800} distance="25px">
            <p className="text-base md:text-lg text-slate-300 max-w-xl leading-relaxed">
              Experience clinical excellence with painless procedures, same-day emergency appointments, and state-of-the-art dental care at Sanjivani Dental Clinic. Dedicated to your long-term oral health.
            </p>
          </ScrollReveal>

          {/* Action Buttons Group */}
          <ScrollReveal delay={550} duration={800} distance="25px">
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 mt-2 w-full sm:w-auto">
              {/* Primary Book Appointment Link */}
              <Link href="/book" className="w-full sm:w-auto">
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="w-full flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform duration-200"
                >
                  <span>Book Appointment</span>
                  <ArrowRight className="w-5 h-5 shrink-0" />
                </Button>
              </Link>
              
              {/* Direct Tappable Phone Button */}
              <Link href="tel:+917775089777" className="w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full flex items-center justify-center gap-2 border-white/20 hover:border-white/40 text-white hover:bg-white/10 hover:text-white"
                >
                  <Phone className="w-5 h-5 text-primary-container fill-primary-container shrink-0" />
                  <span>Call +91 77750 89777</span>
                </Button>
              </Link>

              {/* Direct WhatsApp Call-to-Action */}
              <a
                href="https://wa.me/917775089777?text=Hi!%20I%20want%20to%20book%20an%20appointment%20at%20Sanjivani%20Dental%20Clinic."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold rounded-lg px-6 py-3.5 text-base transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-level-1 hover:scale-[1.02]"
              >
                <WhatsAppIcon className="w-5 h-5 shrink-0 fill-white" />
                <span>WhatsApp Us</span>
              </a>
            </div>
          </ScrollReveal>

          {/* Expanded Trust Indicators */}
          <ScrollReveal delay={700} duration={800} distance="20px">
            <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm px-4.5 py-3 rounded-xl border border-white/5">
                <Star className="w-6 h-6 text-amber-400 fill-amber-400 shrink-0" />
                <div>
                  <p className="text-white font-bold text-sm md:text-base leading-tight">4.9/5 Rating</p>
                  <p className="text-slate-400 text-xs mt-0.5">500+ Patient Reviews</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm px-4.5 py-3 rounded-xl border border-white/5">
                <ShieldCheck className="w-6 h-6 text-primary-container shrink-0" />
                <div>
                  <p className="text-white font-bold text-sm md:text-base leading-tight">ISO Certified</p>
                  <p className="text-slate-400 text-xs mt-0.5">Quality Care Standards</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm px-4.5 py-3 rounded-xl border border-white/5">
                <span className="w-6 h-6 bg-primary-container/20 text-primary-container rounded-full flex items-center justify-center text-xs font-black shrink-0">10k+</span>
                <div>
                  <p className="text-white font-bold text-sm md:text-base leading-tight">10,000+ Smiles</p>
                  <p className="text-slate-400 text-xs mt-0.5">Trusted Clinic Registry</p>
                </div>
              </div>
            </div>
          </ScrollReveal>

        </div>
      </div>
    </section>
  );
};

