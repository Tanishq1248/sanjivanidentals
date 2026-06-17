import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "../ui/ScrollReveal";
import { BeforeAfterSlider } from "../ui/BeforeAfterSlider";

export const GalleryPreview: React.FC = () => {
  const images = [
    {
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2eKyFNyFdbSxESCigPI8yhICGLiJ5sW32WZh6N9gxOvkiLOi7M8FM43Ai8-KfQI1MbPenlyzu_DbIwyvXJv-s1oKI0ehJX0Wqba_mW1CnWM9QNrLprsuIhtSKiPChs6icR4hEnRpKi7GCnWzeCGySjgyiVqwnmtpK5go7Atevoh8wIfyioeljkaQovAQw2UR-ZCZwI7CE5zfkFvkCvdlxlYd0WMtzR8m16NToWu3YzQyRvE-IQiyVHi7HnhpioAAlVt_KXFylnbk",
      alt: "Modern Treatment Room",
      label: "Modern Treatment Rooms",
    },
    {
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCqM90coKf5dy1Lnoon4N8845O6p1htgSy5pA9IS6hhak7fA9Z2Wn_C8K-ZKOOXQy5mwnqz0QT2NdA1S-5flyU5Xkyawa2jRBo-v8_Kg6IGMTlB0Lw7c5TEGo69Gr1NWswW0lijJMqfrKn0lWuGIZuHX4rjmNQu8ELgId5ApVWdhag-4iYdPW3vfNM3-7311qMGHo-w7QzREgA-Le70QX_eyf5vdsNvzWZvdC2yM2c_p11xtRgOHdtbsZSrAKiBtSAe6f3GDz6TrQ4",
      alt: "Welcoming Reception Area",
      label: "Welcoming Reception Area",
    },
    
  ];

  const beforeAfterCases = [
    {
      label: "Smile Makeover",
      before: "/before_smile.png",
      after: "/after_smile.png",
    },
    {
      label: "Teeth Whitening",
      before: "/before_teeth.png",
      after: "/after_teeth.png",
    },
    {
      label: "Orthodontics",
      before: "/before_braces.png",
      after: "/after_braces.png",
    },
    {
      label: "Dental Implant",
      before: "/before_implant.png",
      after: "/after_implant.png",
    },
  ];

  return (
    <section className="py-20 bg-surface">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <ScrollReveal delay={100} duration={700}>
              <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-3 tracking-tight">
                Clinic Tour &amp; Patient Smiles
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={250} duration={700}>
              <p className="text-on-surface-variant leading-relaxed text-sm md:text-base">
                Step inside our state-of-the-art facility and see the results of our clinical excellence.
              </p>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={350} duration={700} distance="15px" className="shrink-0 w-full md:w-auto">
            <Link
              href="/gallery"
              className="w-full bg-surface-container-lowest text-primary border border-outline-variant hover:border-primary/50 hover:bg-secondary-container/20 transition-all duration-300 rounded-lg px-6 py-2.5 font-semibold text-sm active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>View Full Gallery</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </ScrollReveal>
        </div>

        {/* 2x2 Grid of Images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          {images.map((image, index) => (
            <ScrollReveal key={index} delay={index * 150} duration={850} distance="30px">
              <div
                className="relative w-full h-64 md:h-80 overflow-hidden rounded-xl border border-outline-variant/10 shadow-sm group"
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <span className="text-white font-semibold text-sm md:text-base">
                    {image.label}
                  </span>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Before / After Slider Section */}
        <ScrollReveal delay={100} duration={700}>
          <div className="mb-8 text-center">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary-container bg-secondary-container px-4 py-1.5 rounded-full mb-3">
              Real Results
            </span>
            <h3 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
              Before &amp; After Transformations
            </h3>
            <p className="text-on-surface-variant text-sm mt-2">
              Drag the slider to reveal the difference our treatments make.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {beforeAfterCases.map((item, index) => (
            <ScrollReveal key={index} delay={index * 200} duration={900} distance="30px">
              <div className="flex flex-col gap-3">
                {/* Label */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-on-surface">{item.label}</span>
                  <span className="flex-1 h-px bg-outline-variant/40" />
                </div>
                {/* Slider */}
                <div className="h-72 md:h-80 w-full rounded-xl overflow-hidden shadow-level-2 border border-outline-variant/10">
                  <BeforeAfterSlider
                    beforeSrc={item.before}
                    afterSrc={item.after}
                    beforeAlt={`${item.label} - Before`}
                    afterAlt={`${item.label} - After`}
                    initialPosition={50}
                    className="h-full"
                  />
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
