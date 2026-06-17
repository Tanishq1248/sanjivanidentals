import React from "react";
import { Star, Award, Trophy } from "lucide-react";
import { Card } from "../ui/Card";
import { ScrollReveal } from "../ui/ScrollReveal";

export const TestimonialsSection: React.FC = () => {
  const trustCards = [
    {
      icon: <Award className="w-8 h-8 text-primary-container shrink-0" />,
      title: "ISO 9001:2015 Certified",
      subtitle: "For clinical quality management",
    },
    {
      icon: <Trophy className="w-8 h-8 text-primary-container shrink-0" />,
      title: "Award Winning Clinic",
      subtitle: "Excellence in Patient Care 2023",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Jenkins",
      role: "Cosmetic Patient",
      avatarInitials: "SJ",
      text: "The level of professionalism and care at DentaPure is unmatched. The facility is incredibly modern, and the staff made my anxiety about visiting the dentist completely disappear.",
    },
    {
      name: "Michael Roberts",
      role: "General Dentistry",
      avatarInitials: "MR",
      text: "I've been bringing my entire family here for years. The technology they use makes procedures so much faster and more comfortable. Truly a world-class clinic.",
    },
  ];

  return (
    <section id="patient-info" className="py-20 bg-surface-container-low border-y border-outline-variant/10 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-secondary-container/20 to-transparent pointer-events-none z-0"></div>

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Trust Left Panel */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <ScrollReveal delay={100} duration={700}>
              <h2 className="text-3xl font-bold text-on-surface tracking-tight">
                Trusted by Thousands
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={250} duration={700}>
              <p className="text-on-surface-variant leading-relaxed">
                Our commitment to clinical excellence and patient comfort has made us a leading choice for dental care.
              </p>
            </ScrollReveal>
            <div className="flex flex-col gap-4 mt-2">
              {trustCards.map((card, index) => (
                <ScrollReveal key={index} delay={350 + index * 100} duration={700}>
                  <div
                    className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/20 shadow-level-1"
                  >
                    {card.icon}
                    <div>
                      <h4 className="font-semibold text-on-surface text-sm">{card.title}</h4>
                      <p className="text-xs text-on-surface-variant">{card.subtitle}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>

          {/* Testimonial Cards Right Panel */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, index) => (
              <ScrollReveal key={index} delay={150 + index * 150} duration={850} distance="40px">
                <Card
                  className="bg-surface-container-lowest p-8 flex flex-col h-full hover:shadow-level-2 transition-shadow duration-300"
                >
                  {/* Star Rating */}
                  <div className="flex text-primary-container mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 fill-primary-container text-primary-container"
                      />
                    ))}
                  </div>
                  {/* Quote Text */}
                  <p className="text-on-surface italic text-sm md:text-base leading-relaxed flex-grow mb-6">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>
                  {/* User Info */}
                  <div className="flex items-center gap-3 pt-4 border-t border-outline-variant/10">
                    <div className="w-10 h-10 rounded-full bg-secondary-container text-primary flex items-center justify-center font-bold text-sm">
                      {testimonial.avatarInitials}
                    </div>
                    <div>
                      <p className="font-semibold text-on-surface text-sm">
                        {testimonial.name}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </Card>
              </ScrollReveal>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};
