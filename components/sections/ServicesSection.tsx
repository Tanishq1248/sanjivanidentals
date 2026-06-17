import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "../ui/ScrollReveal";

export const ServicesSection: React.FC = () => {
  const services = [
    {
      image: "/general_dentistry.png",
      tag: "Preventive",
      tagColor: "bg-blue-100 text-blue-700",
      title: "General Dentistry",
      description:
        "Routine checkups, professional cleanings, and preventative care to maintain optimal oral health and catch issues early.",
      link: "/#services",
    },
    {
      image: "/cosmetic_dentistry.png",
      tag: "Cosmetic",
      tagColor: "bg-purple-100 text-purple-700",
      title: "Cosmetic Procedures",
      description:
        "Advanced teeth whitening, premium veneers, and complete smile makeovers tailored specifically to you.",
      link: "/#services",
    },
    {
      image: "/orthodontics.png",
      tag: "Orthodontics",
      tagColor: "bg-teal-100 text-teal-700",
      title: "Orthodontics",
      description:
        "Modern traditional braces and discreet clear aligner solutions designed for patients of all ages.",
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

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {services.map((service, index) => (
            <ScrollReveal key={index} delay={index * 150} duration={800} distance="40px">
              <div className="group flex flex-col rounded-2xl overflow-hidden bg-surface-container-lowest shadow-level-2 border border-outline-variant/10 hover:shadow-[0_16px_48px_0_rgba(0,97,164,0.14)] transition-shadow duration-300 h-full">

                {/* Image */}
                <div className="relative w-full h-56 overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                  {/* Gradient overlay at bottom of image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/60 via-transparent to-transparent" />

                  {/* Tag badge over image */}
                  <span
                    className={`absolute top-4 left-4 text-xs font-semibold px-3 py-1 rounded-full ${service.tagColor} backdrop-blur-sm`}
                  >
                    {service.tag}
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-grow p-7">
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
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
