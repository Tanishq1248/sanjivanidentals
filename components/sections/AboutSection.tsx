import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Award, Users, Calendar, Heart, ShieldCheck, HeartHandshake, Cpu,
  Award as Trophy, Ambulance, Star, UserCheck, Plus
} from "lucide-react";
import { Card } from "../ui/Card";
import { ScrollReveal } from "../ui/ScrollReveal";

export const AboutSection: React.FC = () => {
  const stats = [
    {
      icon: <Users className="w-10 h-10 text-primary-container mb-3" />,
      value: "10,000+",
      label: "Happy Patients",
    },
    {
      icon: <Calendar className="w-10 h-10 text-primary-container mb-3" />,
      value: "15+",
      label: "Years Excellence",
    },
    {
      icon: <Heart className="w-10 h-10 text-primary-container mb-3" />,
      value: "98%",
      label: "Patient Satisfaction",
    },
    {
      icon: <Trophy className="w-10 h-10 text-primary-container mb-3" />,
      value: "50+",
      label: "Modern Treatments",
    },
  ];

  const values = [
    {
      icon: <HeartHandshake className="w-8 h-8 text-primary-container" />,
      title: "Patient First",
      description: "Your comfort and needs dictate our approach. We listen, explain clearly, and prioritize gentle, anxiety-free experiences.",
    },
    {
      icon: <Cpu className="w-8 h-8 text-primary-container" />,
      title: "Advanced Tech",
      description: "We invest heavily in the latest dental technology to ensure precise diagnostics, faster recovery, and superior outcomes.",
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-primary-container" />,
      title: "Clinical Excellence",
      description: "Compromise is not in our vocabulary. From routine cleanings to complex procedures, we adhere to the highest clinical standards.",
    },
  ];

  const features = [
    {
      icon: <Ambulance className="w-5 h-5 text-white" />,
      title: "Emergency Services",
      description: "We provide prompt and reliable emergency dental care to address urgent issues when you need it most.",
    },
    {
      icon: <Star className="w-5 h-5 text-white" />,
      title: "Positive Patient Reviews",
      description: "Our clinic is trusted by hundreds of happy patients who appreciate our compassionate care and expert treatment.",
    },
    {
      icon: <UserCheck className="w-5 h-5 text-white" />,
      title: "Experienced Professionals",
      description: "Our team of skilled and experienced dental professionals is dedicated to delivering the highest standard of care.",
    },
  ];

  return (
    <section className="py-20" id="about">
      <div className="max-w-[1200px] mx-auto px-6">

        {/* Why Choose Us — Dark Navy Section */}
        <div
          className="relative rounded-2xl overflow-hidden mb-20"
          style={{ background: "linear-gradient(135deg, #0b1a4f 0%, #0d2166 60%, #0a1540 100%)" }}
        >
          {/* Subtle dot-grid texture overlay */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[420px]">

            {/* LEFT — Content */}
            <div className="lg:col-span-4 flex flex-col justify-center px-10 py-12 lg:py-16">
              <ScrollReveal delay={100} duration={800}>
                {/* Badge */}
                <div className="inline-flex items-center gap-2 mb-6">
                  <div className="w-5 h-5 rounded-full border-2 border-blue-400 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                  </div>
                  <span className="text-blue-300 text-xs font-semibold tracking-widest uppercase">
                    Why Choose Us
                  </span>
                </div>

                {/* Heading */}
                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-5">
                  Excellence !<br />Results you can<br />trust
                </h2>

                {/* Description */}
                <p className="text-blue-200 text-sm leading-relaxed mb-8 max-w-xs">
                  Accurate diagnosis of dental diseases ensures effective treatment plans,
                  helping to maintain{" "}
                  <span className="text-orange-400 font-semibold">oral health</span> and
                  prevent further complications.
                </p>

                {/* CTA Button */}
                <Link href="/book">
                  <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-6 py-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-blue-500/40 active:scale-95">
                    Contact Us
                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  </button>
                </Link>
              </ScrollReveal>
            </div>

            {/* CENTER — Doctor Image */}
            <div className="lg:col-span-4 flex items-end justify-center relative pt-8 lg:pt-0">
              <ScrollReveal delay={200} duration={900}>
                {/* Glowing circle behind doctor */}
                <div
                  className="absolute left-1/2 bottom-0 -translate-x-1/2 rounded-full"
                  style={{
                    width: "320px",
                    height: "320px",
                    background: "radial-gradient(ellipse at center, rgba(37,99,235,0.45) 0%, rgba(13,33,102,0.0) 75%)",
                    filter: "blur(12px)",
                  }}
                />
                <div
                  className="relative mx-auto rounded-full overflow-hidden"
                  style={{ width: "360px", height: "440px" }}
                >
                  <Image
                    src="/drimg.jpg"
                    alt="Dr. Snehal Kumbhar"
                    fill
                    className="object-fill object-top"
                    sizes="260px"
                  />
                </div>
              </ScrollReveal>
            </div>

            {/* RIGHT — Feature Cards */}
            <div className="lg:col-span-4 flex flex-col justify-center gap-5 px-8 py-12 lg:py-16">
              {features.map((feature, index) => (
                <ScrollReveal key={index} delay={250 + index * 130} duration={800}>
                  <div className="flex items-start gap-4 group">
                    {/* Icon box */}
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "rgba(37,99,235,0.30)", border: "1px solid rgba(96,165,250,0.25)" }}
                    >
                      {feature.icon}
                    </div>
                    {/* Text */}
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1 group-hover:text-blue-300 transition-colors duration-200">
                        {feature.title}
                      </h4>
                      <p className="text-blue-200 text-xs leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mb-20">
          {stats.map((stat, index) => (
            <ScrollReveal key={index} delay={index * 100} duration={700}>
              <Card hoverEffect={true} className="flex flex-col items-center justify-center p-6 bg-surface-container-lowest h-full">
                <div className="flex items-center justify-center">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-on-surface-variant font-medium">
                  {stat.label}
                </div>
              </Card>
            </ScrollReveal>
          ))}
        </div>

        {/* Core Values Section */}
        <div>
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <ScrollReveal delay={100} duration={700}>
              <h2 className="text-3xl font-bold text-on-surface mb-4 tracking-tight">
                Our Core Values
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={250} duration={700}>
              <p className="text-on-surface-variant leading-relaxed text-sm">
                The principles that guide our practice and ensure you receive the highest standard of care.
              </p>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <ScrollReveal key={index} delay={index * 150} duration={800} distance="40px">
                <Card className="flex flex-col p-8 transition-transform duration-300 h-full">
                  <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center mb-6">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-bold text-on-surface mb-3">
                    {value.title}
                  </h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">
                    {value.description}
                  </p>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
