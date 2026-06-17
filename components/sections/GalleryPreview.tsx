import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "../ui/ScrollReveal";

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
    {
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBRUwB3TaZwnvpE78QdkzmPmmJhzOkSsqxuue_2FEeSVDH84oYX-7zzgmEJY_eE3lVbHTF3lxG0GeJDfT8yAaKp2US2av01XHf9azzoaAl6HDCmcg9YVwWIK5SoxN6qPLBOGJa-Tv3H8yf6ACeeg2mBxm9e3waV8WtE2OUJhGHymjon3UMkANNFO6O4gLKBGI36e6NIZIBYyhNKxgf-Og9caoZL8I_79EkZ0qw4s7rXmoo4QYrnurCk5uvBM_t5sxrouTQGuKeSCyg",
      alt: "Expert Clinical Team",
      label: "Expert Clinical Team",
    },
    {
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDJUqE4bg4yv4cXfVPOjV_rsjmnoA1iOKcYZV4XSlPkc1L7zMr99zb6hKsv5mmgr_pju9PEv30bpr0jBft2iz_Eq3S0jU08wOvnIerB-uDMA5LTY68EkJil2_qsNmbGiaqhpvG5TlO1wX_LLxlpYSylrq8KemcSRM1I7h0TL5kfRCohyXdRZyAhf7HDoT92WDJ7dNJxVZQ3lw3wnha6XXQRcrn9XTxF0Dk7aOmPodbXmM6qS7pEPYAtpVaNPgi1oY1yYgHmwdKDJvk",
      alt: "Transformative Results",
      label: "Transformative Results",
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
                Clinic Tour & Patient Smiles
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>
    </section>
  );
};
