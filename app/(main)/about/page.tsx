import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Award,
  GraduationCap,
  ShieldCheck,
  Users,
  Calendar,
  Heart,
  Trophy,
  HeartHandshake,
  Cpu,
  ArrowRight,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";

export const revalidate = 3600; // Revalidate at most once per hour

export const metadata = {
  title: "About Us | DentaPure",
  description:
    "Meet our team, learn about our values, and discover the healing environment we've created for our patients.",
};

export default function AboutPage() {
  const stats = [
    { icon: <Users className="w-6 h-6 text-primary" />, value: "10,000+", label: "Happy Patients" },
    { icon: <Calendar className="w-6 h-6 text-primary" />, value: "15+", label: "Years Experience" },
    { icon: <Heart className="w-6 h-6 text-primary" />, value: "98%", label: "Patient Satisfaction" },
    { icon: <Trophy className="w-6 h-6 text-primary" />, value: "50+", label: "Modern Treatments" },
  ];

  const values = [
    {
      icon: <HeartHandshake className="w-6 h-6 text-primary" />,
      title: "Patient First",
      description: "Your comfort and needs dictate our approach. We focus on soft touch, and prioritize gentle, anxiety-free experiences.",
    },
    {
      icon: <Cpu className="w-6 h-6 text-primary" />,
      title: "Advanced Tech",
      description: "We invest heavily in the latest dental technology to ensure precise diagnostics, faster recovery, and superior outcomes.",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-primary" />,
      title: "Clinical Excellence",
      description: "From routine teeth cleanings to complex procedures, we adhere to the highest clinical standards.",
    },
  ];

  return (
    <div className="bg-surface">
      {/* 1. Hero Section */}
      <section className="relative h-[340px] md:h-[480px] w-full overflow-hidden flex items-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/about_hero.png"
            alt="State-of-the-Art Dental Clinic Interior"
            fill
            className="object-cover object-center"
            priority
          />
          {/* <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 md:via-white/60 to-transparent" /> */}
        </div>

        <div className="relative z-10 max-w-[1200px] mx-auto w-full px-6">
          <div className="max-w-xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-on-surface mb-4 leading-tight">
              Dedicated to Your <br />
              <span className="text-primary">Dental Health</span>
            </h1>
            <p className="text-on-surface-variant text-base md:text-lg leading-relaxed max-w-lg">
              Providing exceptional dental care in a comfortable, modern environment tailored to your unique needs.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Doctor Info Bio Section */}
      <section className="py-20 px-6 max-w-[1200px] mx-auto">
        <div className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/10 shadow-level-1 p-6 md:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Doctor Image */}
            <div className="lg:col-span-5 relative h-[300px] md:h-[400px] w-full rounded-xl overflow-hidden shadow-sm">
              <Image
                src="/drimg.jpg"
                alt="Dr. Anya Sharma, DDS"
                fill
                className="object-cover object-top"
              />
            </div>

            {/* Bio Details */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="inline-flex items-center gap-1 bg-[#e3f2fd] text-primary px-4 py-1.5 rounded-full text-xs font-semibold w-fit mb-4">
                <Award className="w-4 h-4 text-primary" />
                <span>Clinical Director</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-2 tracking-tight">
                Dr. Anya Sharma, DDS
              </h2>
              <p className="text-primary font-semibold text-sm md:text-base mb-6">
                Over 15 Years of Clinical Excellence
              </p>
              <div className="w-12 h-[2px] bg-primary mb-6" />
              <p className="text-on-surface-variant text-base leading-relaxed mb-8">
                Dr. Sharma founded DentaPure with a singular vision: to merge state-of-the-art dental technology with compassionate, patient-first care. She believes every treatment plan is tailored, not just for clinical perfection, but for the individual&apos;s comfort and long-term well-being.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 border-t border-outline-variant/20 pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-on-surface">Top-Tier Alumni</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-on-surface">Board Certified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Stats Section */}
      <section className="pb-20 px-6 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <Card key={index} hoverEffect className="flex flex-col items-center justify-center p-6 md:p-8 bg-surface-container-lowest text-center">
              <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center mb-4">
                {stat.icon}
              </div>
              <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{stat.value}</div>
              <div className="text-xs md:text-sm text-on-surface-variant font-medium">{stat.label}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. Our Core Values */}
      <section className="py-20 bg-surface-bright border-t border-outline-variant/10">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-4 tracking-tight">
              Our Core Values
            </h2>
            <p className="text-on-surface-variant text-sm md:text-base leading-relaxed">
              The principles that guide our practice and ensure you receive the highest standard of care.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="flex flex-col p-8 transition-transform duration-300">
                <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center mb-6">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">{value.title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Healing Environment */}
      <section className="py-20 px-6 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5">
            <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-4 tracking-tight">
              A Healing Environment
            </h2>
            <p className="text-on-surface-variant text-base leading-relaxed">
              We&apos;ve designed our clinic to feel more like a sanctuary than a medical office. Clean lines, calming colors, and state-of-the-art tech ensure your visit is relaxing.
            </p>
          </div>
          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            <div className="relative h-[200px] md:h-[300px] rounded-xl overflow-hidden shadow-sm">
              <Image
                src="/reception.jpg"
                alt="Welcoming Reception Area"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative h-[200px] md:h-[300px] rounded-xl overflow-hidden shadow-sm">
              <Image
                src="/dentaltech.jpg"
                alt="Advanced Technology Treatment Room"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. CTA Banner */}
      <section className="pb-20 px-6 max-w-[1200px] mx-auto">
        <div className="bg-primary text-white rounded-2xl p-8 md:p-16 text-center relative overflow-hidden shadow-level-2">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">
              Start Your Journey to a Perfect Smile
            </h2>
            <p className="text-white/80 mb-8 text-sm md:text-base leading-relaxed">
              Experience the DentaPure difference today. Schedule your comprehensive consultation online in just a few clicks.
            </p>
            <Link href="/book">
              <Button
                variant="outline"
                size="lg"
                className="bg-white text-primary border-white hover:bg-white/90 font-semibold inline-flex items-center gap-2"
              >
                <span>Book Appointment</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
