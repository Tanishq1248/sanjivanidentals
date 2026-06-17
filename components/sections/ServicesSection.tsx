import React from "react";
import Link from "next/link";
import { ShieldCheck, Sparkles, Smile, ArrowRight } from "lucide-react";
import { Card } from "../ui/Card";
import { ScrollReveal } from "../ui/ScrollReveal";

export const ServicesSection: React.FC = () => {
  const services = [
    {
      icon: <ShieldCheck className="w-7 h-7 text-primary" />,
      title: "General Dentistry",
      description: "Routine checkups, professional cleanings, and preventative care to maintain optimal oral health.",
      link: "/#services",
    },
    {
      icon: <Sparkles className="w-7 h-7 text-primary" />,
      title: "Cosmetic Procedures",
      description: "Advanced teeth whitening, premium veneers, and complete smile makeovers tailored to you.",
      link: "/#services",
    },
    {
      icon: <Smile className="w-7 h-7 text-primary" />,
      title: "Orthodontics",
      description: "Modern traditional braces and discreet clear aligner solutions designed for patients of all ages.",
      link: "/#services",
    },
  ];

  return (
    <section className="py-20 bg-surface-bright" id="services">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <ScrollReveal delay={100} duration={700}>
            <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-4 tracking-tight">
              Comprehensive Clinical Services
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={250} duration={700}>
            <p className="text-on-surface-variant leading-relaxed">
              We combine advanced medical technology with compassionate care to provide a full spectrum of dental treatments.
            </p>
          </ScrollReveal>
        </div>

        {/* Bento/Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <ScrollReveal key={index} delay={index * 150} duration={800} distance="40px">
              <Card
                className="flex flex-col h-full group transition-all duration-300"
              >
                {/* Icon Container */}
                <div className="w-12 h-12 rounded-lg bg-secondary-container flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform duration-300">
                  {service.icon}
                </div>

                {/* Title & Description */}
                <h3 className="text-xl font-bold text-on-surface mb-3">
                  {service.title}
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed flex-grow">
                  {service.description}
                </p>

                {/* Action Link */}
                <Link
                  href={service.link}
                  className="mt-6 inline-flex items-center gap-1.5 text-primary text-sm font-semibold hover:text-primary-container transition-colors group/link"
                >
                  <span>Learn more</span>
                  <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
