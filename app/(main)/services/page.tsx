"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Sparkles,
  Smile,
  Cpu,
  ArrowRight,
  Phone,
  Clock,
  CheckCircle2,
  ChevronDown,
  Zap,
  Scan,
  HeartPulse,
  Syringe,
  Palette,
  Crown,
  AlignLeft,
  Armchair,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";

/* ─── FAQ Accordion Item ─── */
function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-outline-variant/20">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left group cursor-pointer"
      >
        <span className="text-base font-semibold text-on-surface group-hover:text-primary transition-colors pr-4">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-on-surface-variant shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-60 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-on-surface-variant text-sm leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

/* ─── Services Page ─── */
export default function ServicesPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const generalFeatures = [
    { icon: <CheckCircle2 className="w-4 h-4 text-primary" />, label: "Routine Checkups & Cleaning" },
    { icon: <CheckCircle2 className="w-4 h-4 text-primary" />, label: "Cavity Fillings & Sealants" },
    { icon: <CheckCircle2 className="w-4 h-4 text-primary" />, label: "Root Canal Therapy" },
    { icon: <CheckCircle2 className="w-4 h-4 text-primary" />, label: "Gum Disease Treatment" },
    { icon: <CheckCircle2 className="w-4 h-4 text-primary" />, label: "Tooth Extractions" },
    { icon: <CheckCircle2 className="w-4 h-4 text-primary" />, label: "Preventative Fluoride Care" },
  ];

  const cosmeticFeatures = [
    { icon: <Sparkles className="w-4 h-4 text-primary" />, label: "Professional Teeth Whitening" },
    { icon: <Crown className="w-4 h-4 text-primary" />, label: "Premium Porcelain Veneers" },
    { icon: <Palette className="w-4 h-4 text-primary" />, label: "Dental Bonding" },
    { icon: <Smile className="w-4 h-4 text-primary" />, label: "Complete Smile Makeovers" },
  ];

  const techFeatures = [
    { icon: <Scan className="w-4 h-4 text-primary" />, label: "Digital X-Rays & 3D Imaging" },
    { icon: <Zap className="w-4 h-4 text-primary" />, label: "Laser Dentistry" },
    { icon: <Cpu className="w-4 h-4 text-primary" />, label: "CAD/CAM Same-Day Crowns" },
    { icon: <Syringe className="w-4 h-4 text-primary" />, label: "Painless Injection Systems" },
  ];

  const faqs = [
    {
      question: "How often should I visit the dentist?",
      answer: "We recommend visiting us every six months for routine checkups and professional cleanings. However, if you have specific dental conditions, we may suggest more frequent visits to monitor your oral health closely.",
    },
    {
      question: "What should I do in a dental emergency?",
      answer: "Call our emergency line immediately at 1800-DENTAL. We offer same-day emergency appointments. If a tooth is knocked out, keep it moist and bring it with you. For severe pain, apply a cold compress and take over-the-counter pain relief.",
    },
    {
      question: "Are cosmetic procedures painful?",
      answer: "Most cosmetic procedures involve minimal discomfort. We use advanced local anesthesia and sedation options to ensure you are completely comfortable throughout the procedure. Recovery times are typically short.",
    },
    {
      question: "Do you accept dental insurance?",
      answer: "Yes, we accept most major dental insurance plans. Our billing team will work with your insurance provider to maximize your benefits. We also offer flexible payment plans for uninsured patients.",
    },
    {
      question: "How long does teeth whitening last?",
      answer: "Professional teeth whitening results can last from 6 months to 2 years, depending on your diet, oral hygiene habits, and lifestyle factors. We provide take-home maintenance kits to help prolong your results.",
    },
    {
      question: "What age should children first visit the dentist?",
      answer: "The American Dental Association recommends a child's first dental visit by their first birthday or within six months of the first tooth erupting. Early visits help establish good oral habits and allow early detection of any issues.",
    },
  ];

  const IMG = {
    smile: "https://lh3.googleusercontent.com/aida/AP1WRLtY0HSJtkKbGP-bWIJF_ENURdiRnf-eNJjAfrz-QlBIu3IzwRx35fYOSATCsci6F4z91s9ObFiTrGA9zMCKrzPt3DRChoSrJsm2k-ABadrMVEFp_L6kfKAEzxZcy3_uQyGCtjM7axrCQeK-IRZeixj1RbgfX-zZopbAKL8d3SIV8bkjXv4LoP33GeUYC_4HcRAY2G2YMFONuM5h5peEsrm9vWGRl0cXSOl7MpMY-EeHx0y20SN3ra48tA",
    interior: "https://lh3.googleusercontent.com/aida/AP1WRLu1wzmWdviIhCZqcru3DvHNIaAeH-oLY0YrOCYkvqY53E8wiDwT_wIShQcXCRePFjrAUaIPo2txk-a72lJNrD3DrSf6bLFAjIuhI1zt10FGBT0BpK1GLkKywQ9tBQj2jcsFZTU09j3AG65YFgAq416xAdO_r_O18cgvyD7ojRAO1CrdrW9mTUt-LjuR2oP3FDee1vHEiMFNwSRDvHG3O2_XM8rUiPCF5c3lvSOfW5HICfZkNti_0ov4rM0",
    tech: "https://lh3.googleusercontent.com/aida/AP1WRLvCt2iIT1FyGLY6hB0z6NWmGl8HOag6oFpiDxX-w7L6Gw_dC2Kpqi89ch84v-r7jqk4GLT0V1z1b8jk30ootI7gwIlslQownx3v_ZO745t-ztiUcVMtyh3bCZKjzuPslC0hhK37bKWDrkyG71F_pI0-Vi4rb2WOadSdCmBeZt5-NJW-s8z3L-YaV6zyujcVF8-sfL19Lw9dnmVdcCN_k2H6zPyAxubwZ8G8GBpWKFr7mK1DzPHXbtIPlcE",
    reception: "https://lh3.googleusercontent.com/aida/AP1WRLt43UBMaH9snYTLBPmZDqqVswmL8FRptTwsJinWM9PryIX5AYDeC8eGHaXeHv0l4u5S7T0GBohy8nLR5tXQJt-SbIVlwj6Qb3u3n7-QBNLo1NMYhrlmOTPK71y1cRhQN3Gt1UkyIGg-X0nedLqMP_x1kfCw7Vj4w9_zhoYkfR9xW-pBQ3tm8kfIvueHk6yyIt0I0pJvvCfk8b5pChceEnBEO83e85y1IzYdR5dLn2tDAKdriHLOxqk_s4w",
  };

  return (
    <div className="bg-surface">
      {/* 1. Hero */}
      <section className="py-16 md:py-20 px-6 max-w-[1200px] mx-auto text-center mt-4">
        <h1 className="text-4xl md:text-5xl font-bold text-on-surface mb-4 tracking-tight">
          Our Specialized <span className="text-primary">Dental Services</span>
        </h1>
        <p className="text-on-surface-variant max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
          Delivering a full spectrum of modern dental care, from preventative checkups to advanced cosmetic and restorative treatments, all under one roof.
        </p>
      </section>

      {/* 2. General Dentistry + Emergency Card */}
      <section className="px-6 pb-20 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-level-1 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="relative h-[280px] md:min-h-[340px]">
                <Image src={IMG.smile} alt="Patient with a beautiful smile" fill className="object-cover" sizes="50vw" />
              </div>
              <div className="p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-on-surface tracking-tight">General Dentistry</h2>
                </div>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
                  Our general dentistry services are the foundation of your oral health. We provide comprehensive, preventative care to keep your smile healthy for years to come.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {generalFeatures.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-on-surface text-sm font-medium">
                      {f.icon}<span>{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 bg-primary text-white rounded-2xl p-6 flex flex-col justify-between shadow-level-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center mb-4">
                <HeartPulse className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Emergency Care</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-6">
                Dental emergencies don&apos;t wait. Neither do we. Same-day appointments available for urgent dental needs.
              </p>
              <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
                <Phone className="w-4 h-4" /><span>1800-DENTAL</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/70 mb-6">
                <Clock className="w-4 h-4" /><span>Available 24/7</span>
              </div>
            </div>
            <Link href="/book" className="relative z-10">
              <Button variant="outline" size="md" className="bg-white text-primary border-white hover:bg-white/90 font-semibold w-full">
                Schedule Consultation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Cosmetic Dentistry */}
      <section className="px-6 pb-20 max-w-[1200px] mx-auto">
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-level-1 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="p-8 md:p-10 flex flex-col justify-center order-2 md:order-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-on-surface tracking-tight">Cosmetic Dentistry</h2>
              </div>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
                Transform your smile with our advanced cosmetic treatments. We use premium materials and the latest techniques to deliver natural-looking, stunning results.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cosmeticFeatures.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-on-surface text-sm font-medium">
                    {f.icon}<span>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative h-[280px] md:min-h-[340px] order-1 md:order-2">
              <Image src={IMG.interior} alt="Modern dental clinic interior" fill className="object-cover" sizes="50vw" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Advanced Technology */}
      <section className="px-6 pb-20 max-w-[1200px] mx-auto">
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-level-1 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="relative h-[280px] md:min-h-[340px]">
              <Image src={IMG.tech} alt="Advanced dental technology equipment" fill className="object-cover" sizes="50vw" />
            </div>
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-on-surface tracking-tight">Advanced Technology</h2>
              </div>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
                We invest in cutting-edge dental technology to provide you with the most precise diagnostics, minimally invasive treatments, and faster recovery times.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {techFeatures.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-on-surface text-sm font-medium">
                    {f.icon}<span>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Orthodontics & Patient Comfort */}
      <section className="px-6 pb-20 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { img: IMG.reception, alt: "Orthodontics treatment", icon: <AlignLeft className="w-4 h-4 text-primary" />, title: "Orthodontics", desc: "Modern braces and clear aligners for patients of all ages. Achieve a straighter, healthier smile with our customized orthodontic treatment plans." },
            { img: IMG.smile, alt: "Comfortable patient environment", icon: <Armchair className="w-4 h-4 text-primary" />, title: "Patient Comfort", desc: "We understand dental anxiety. Our practice is designed with your comfort in mind — from sedation options to a calming clinic environment." },
          ].map((card, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-level-1 overflow-hidden group">
              <div className="relative h-[220px] overflow-hidden">
                <Image
                  src={card.img}
                  alt={card.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center">{card.icon}</div>
                  <h3 className="text-xl font-bold text-on-surface">{card.title}</h3>
                </div>
                <p className="text-on-surface-variant text-sm leading-relaxed">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FAQ */}
      <section className="py-20 bg-surface-bright border-t border-outline-variant/10">
        <div className="max-w-[800px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-4 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-on-surface-variant text-sm md:text-base leading-relaxed max-w-lg mx-auto">
              Find answers to common questions about our services, insurance, and what to expect during your visit.
            </p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-level-1 p-6 md:p-8">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === index}
                onToggle={() => setOpenFAQ(openFAQ === index ? null : index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 7. CTA */}
      <section className="py-20 px-6 max-w-[1200px] mx-auto">
        <div className="bg-primary text-white rounded-2xl p-8 md:p-16 text-center relative overflow-hidden shadow-level-2">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">
              Ready to Transform Your Smile?
            </h2>
            <p className="text-white/80 mb-8 text-sm md:text-base leading-relaxed">
              Take the first step towards a healthier, more confident smile. Schedule your consultation today.
            </p>
            <Link href="/book">
              <Button variant="outline" size="lg" className="bg-white text-primary border-white hover:bg-white/90 font-semibold inline-flex items-center gap-2">
                <span>Book a Consultation</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
