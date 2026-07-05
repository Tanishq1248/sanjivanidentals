import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "../../../components/ui/Button";

export const revalidate = 3600; // Revalidate at most once per hour

export const metadata = {
  title: "Gallery | DentaPure",
  description: "Explore our state-of-the-art facility and the beautiful smiles we've helped create.",
};

const galleryItems = [
  {
    url: "/interior.webp",
    alt: "State of the Art Interior",
    label: "State-of-the-Art Interior",
    className: "md:col-span-2 md:row-span-2 h-[320px] md:h-[660px]",
  },
  {
    url: "/reception.jpg",
    alt: "Welcoming Reception",
    label: "Welcoming Reception",
    className: "h-[320px]",
  },
  {
    url: "/drimg.jpg",
    alt: "Dr. Anya Sharma",
    label: "Dr. Anya Sharma",
    className: "h-[320px] object-top",
  },
  {
    url: "/dentaltech.jpg",
    alt: "Advanced Technology",
    label: "Advanced Technology",
    className: "md:col-span-2 h-[320px]",
  },
  {
    url: "/after_teeth.png",
    alt: "Beautiful Results",
    label: "Beautiful Results",
    className: "h-[320px]",
  },
];

export default function GalleryPage() {
  return (
    <>
      {/* Gallery Hero */}
      <section className="py-16 px-6 max-w-[1200px] mx-auto text-center mt-6">
        <h1 className="text-4xl md:text-5xl font-bold text-on-surface mb-4 tracking-tight">
          Our Clinic &amp; Results
        </h1>
        <p className="text-on-surface-variant max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
          Explore our state-of-the-art facility and the beautiful smiles we&apos;ve helped create.
        </p>
      </section>

      {/* Bento Grid */}
      <section className="px-6 pb-20 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-min">
          {galleryItems.map((item, index) => (
            <div
              key={index}
              className={`rounded-xl overflow-hidden relative group border border-outline-variant/10 shadow-level-1 hover:shadow-level-2 transition-all duration-300 ${item.className}`}
            >
              <Image
                src={item.url}
                alt={item.alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <span className="text-white font-semibold text-lg md:text-xl">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-surface-container-low py-16 px-6 border-t border-outline-variant/10">
        <div className="max-w-3xl mx-auto text-center bg-surface-container-lowest p-10 md:p-16 rounded-xl shadow-level-1 border border-outline-variant/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-on-surface mb-4 tracking-tight">
              Ready to Start Your Journey?
            </h2>
            <p className="text-on-surface-variant mb-8 max-w-2xl mx-auto text-sm leading-relaxed">
              Experience the highest standard of dental care in a relaxing, modern environment. Schedule your visit today.
            </p>
            <Link href="/book">
              <Button variant="primary" size="lg" className="inline-flex items-center gap-2">
                <span>Book a Consultation</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
